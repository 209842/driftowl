import asyncio
import json
import re
from groq import AsyncGroq, RateLimitError
import os
from dotenv import load_dotenv
from agents import AGENTS_BY_MODE, CONTRARIAN_AGENTS, AgentDef
from typing import List, AsyncGenerator

load_dotenv()
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))


def _parse_retry_seconds(error: RateLimitError) -> float:
    """Extract wait time from Groq 429 error message, default 6s."""
    try:
        msg = str(error)
        match = re.search(r'try again in ([\d.]+)s', msg)
        if match:
            return float(match.group(1)) + 0.5
    except Exception:
        pass
    return 6.0


async def groq_create_with_retry(max_retries: int = 4, **kwargs):
    """Call client.chat.completions.create with automatic retry on 429."""
    for attempt in range(max_retries):
        try:
            return await client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait = _parse_retry_seconds(e)
            await asyncio.sleep(wait)
    raise RuntimeError("Max retries exceeded")


async def run_agent(agent: AgentDef, context: str, problem: str, previous_analyses: List[dict]) -> dict:
    """Run a single agent and return their analysis."""

    prev_context = ""
    if previous_analyses:
        prev_context = "\n\nOther experts have already shared these insights:\n"
        for p in previous_analyses[:3]:  # show max 3 previous
            prev_context += f"- {p['name']} ({p['role']}): {p['analysis'][:200]}...\n"

    user_msg = f"""Context: {context}

Problem: {problem}
{prev_context}
Provide your expert analysis in 2-3 sentences. Be specific, insightful, and direct.
Then on a new line write: REFERENCES: [list 1-2 expert roles from the context above whose insights you build on, or NONE]"""

    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=220,
        temperature=0.8,
        messages=[
            {"role": "system", "content": agent["prompt"]},
            {"role": "user", "content": user_msg},
        ],
    )

    text = response.choices[0].message.content

    # Parse references
    references = []
    if "REFERENCES:" in text:
        parts = text.split("REFERENCES:")
        analysis = parts[0].strip()
        ref_text = parts[1].strip()
        if ref_text != "NONE":
            # Map referenced roles back to agent ids
            for prev in previous_analyses:
                if prev["role"].lower() in ref_text.lower() or prev["name"].lower() in ref_text.lower():
                    references.append(prev["id"])
    else:
        analysis = text.strip()

    return {
        "id": agent["id"],
        "name": agent["name"],
        "role": agent["role"],
        "color": agent["color"],
        "analysis": analysis,
        "references": references,
    }


def _parse_json_safe(text: str) -> dict:
    """Extract and parse JSON from LLM response, with basic repair for common issues."""
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in response")
    raw = text[start:end]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Basic repair: remove trailing commas before } or ]
        import re
        repaired = re.sub(r',\s*([}\]])', r'\1', raw)
        return json.loads(repaired)


async def run_synthesis(context: str, problem: str, all_analyses: List[dict], pill: dict = None) -> dict:
    """Run the synthesis agent to produce the final mechanism."""

    analyses_text = "\n".join(
        [f"[{a['role']}] {a['analysis']}" for a in all_analyses]
    )

    system_prompt = """You are the Synthesis Agent — you integrate all expert analyses into a unified mechanism design solution.

Return a JSON object with this exact structure:
{
  "mechanism_name": "Short evocative name for the mechanism",
  "core_insight": "The single most important insight that unlocks the solution (1 sentence)",
  "rules": [
    "Rule 1: concrete, implementable rule",
    "Rule 2: concrete, implementable rule",
    "Rule 3: concrete, implementable rule",
    "Rule 4: concrete, implementable rule"
  ],
  "explanation": "Why this mechanism works: connect the game theory to the human psychology to the practical implementation (3-4 sentences)",
  "expected_outcome": "What the system looks like after 90 days of implementation"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no extra text."""

    user_content = (
        f"Context: {context}\n\nProblem: {problem}\n\nExpert analyses:\n{analyses_text}"
        + (
            f"\n\nLIBRARY PILL (proven pattern to build upon):\n"
            f"Mechanism: {pill['mechanism_name']}\n"
            f"Rules: {chr(10).join('- ' + r for r in pill.get('core_rules', []))}\n"
            f"Conditions: {chr(10).join('- ' + c for c in pill.get('key_conditions', []))}\n"
            f"Why it works: {pill.get('why_it_works', '')}\n\n"
            f"Adapt and extend this proven pattern to the specific context above."
            if pill else ""
        )
    )

    for attempt in range(3):
        response = await groq_create_with_retry(
            model="llama-3.3-70b-versatile",
            max_tokens=800,
            temperature=0.2 if attempt > 0 else 0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        try:
            return _parse_json_safe(response.choices[0].message.content)
        except (json.JSONDecodeError, ValueError):
            if attempt == 2:
                # Last resort fallback
                return {
                    "mechanism_name": "Synthesis unavailable",
                    "core_insight": "The model returned malformed output. Please retry.",
                    "rules": ["Retry the analysis for a complete synthesis."],
                    "explanation": "",
                    "expected_outcome": ""
                }
            await asyncio.sleep(1.0)


async def run_contrarian_agent(agent: AgentDef, context: str, problem: str, synthesis: dict) -> dict:
    """Run a single contrarian agent that attacks the synthesis."""

    synthesis_text = f"""Proposed mechanism: {synthesis.get('mechanism_name', '')}
Core insight: {synthesis.get('core_insight', '')}
Rules:
{chr(10).join(f'  {i+1}. {r}' for i, r in enumerate(synthesis.get('rules', [])))}
Explanation: {synthesis.get('explanation', '')}
Expected outcome: {synthesis.get('expected_outcome', '')}"""

    user_msg = f"""Context: {context}

Problem being solved: {problem}

{synthesis_text}

Challenge this mechanism from your expert perspective in 2-3 sharp, specific sentences. Be adversarial and precise — identify the concrete failure point, not vague doubts."""

    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=220,
        temperature=0.9,
        messages=[
            {"role": "system", "content": agent["prompt"]},
            {"role": "user", "content": user_msg},
        ],
    )

    return {
        "id": agent["id"],
        "name": agent["name"],
        "role": agent["role"],
        "color": agent["color"],
        "analysis": response.choices[0].message.content.strip(),
        "references": [],
        "is_contrarian": True,
    }


async def run_arbitration(context: str, problem: str, synthesis: dict, contrarian_analyses: List[dict]) -> dict:
    """Arbitration agent: weighs synthesis vs contrarian attacks, produces refined mechanism."""

    synthesis_text = f"""ORIGINAL MECHANISM — "{synthesis.get('mechanism_name', '')}":
Core insight: {synthesis.get('core_insight', '')}
Rules: {'; '.join(synthesis.get('rules', []))}
Explanation: {synthesis.get('explanation', '')}
Expected outcome: {synthesis.get('expected_outcome', '')}"""

    contrarian_text = "\n".join(
        [f"[{a['role']}] {a['analysis']}" for a in contrarian_analyses]
    )

    for attempt in range(3):
        response = await groq_create_with_retry(
            model="llama-3.3-70b-versatile",
            max_tokens=900,
            temperature=0.2 if attempt > 0 else 0.3,
            messages=[
                {"role": "system", "content": """You are the Arbitration Agent — a senior mechanism design judge.
You have received an original mechanism proposal and a set of adversarial challenges.
Your job: decide what survives, what must change, and produce the final reinforced mechanism.

Return ONLY a JSON object with this exact structure:
{
  "verdict": "STRENGTHENED",
  "robustness_score": 7,
  "critical_vulnerabilities": ["Vulnerability 1", "Vulnerability 2"],
  "arbitration_reasoning": "2-3 sentences explaining the verdict",
  "mechanism_name": "Final mechanism name",
  "core_insight": "Refined core insight",
  "rules": ["Rule 1", "Rule 2", "Rule 3", "Rule 4"],
  "explanation": "Why the final mechanism is robust",
  "expected_outcome": "What the system looks like after 90 days"
}

verdict must be exactly one of: STRENGTHENED, REVISED, REBUILT
IMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no extra text."""},
                {"role": "user", "content": f"Context: {context}\n\nProblem: {problem}\n\n{synthesis_text}\n\nCONTRARIAN CHALLENGES:\n{contrarian_text}"},
            ],
        )
        try:
            return _parse_json_safe(response.choices[0].message.content)
        except (json.JSONDecodeError, ValueError):
            if attempt == 2:
                return {
                    "verdict": "STRENGTHENED",
                    "robustness_score": 5,
                    "critical_vulnerabilities": [],
                    "arbitration_reasoning": "Arbitration output was malformed. Original mechanism retained.",
                    "mechanism_name": synthesis.get("mechanism_name", ""),
                    "core_insight": synthesis.get("core_insight", ""),
                    "rules": synthesis.get("rules", []),
                    "explanation": synthesis.get("explanation", ""),
                    "expected_outcome": synthesis.get("expected_outcome", "")
                }
            await asyncio.sleep(1.0)


async def run_pipeline(mode: str, context: str, problem: str, pill: dict = None) -> AsyncGenerator[str, None]:
    """
    Main pipeline: runs agents in batches, streams results as SSE events.
    Phase 1: Expert agents → Synthesis
    Phase 2: Contrarian team → Arbitration
    """
    agents = AGENTS_BY_MODE.get(mode, AGENTS_BY_MODE["company"])
    all_analyses = []

    # --- Phase 1: Expert agents ---
    batch_size = 3
    for i in range(0, len(agents), batch_size):
        batch = agents[i : i + batch_size]
        tasks = [run_agent(agent, context, problem, all_analyses) for agent in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                continue
            all_analyses.append(result)
            yield f"event: agent\ndata: {json.dumps(result)}\n\n"

        await asyncio.sleep(3.0)

    # --- Synthesis ---
    yield f"event: status\ndata: {json.dumps({'message': 'Synthesizing expert consensus...'})}\n\n"
    synthesis = await run_synthesis(context, problem, all_analyses, pill=pill)
    yield f"event: synthesis\ndata: {json.dumps(synthesis)}\n\n"

    # --- Phase 2: Contrarian team ---
    yield f"event: status\ndata: {json.dumps({'message': 'Contrarian team assembling...'})}\n\n"

    contrarian_analyses = []
    for i in range(0, len(CONTRARIAN_AGENTS), batch_size):
        batch = CONTRARIAN_AGENTS[i : i + batch_size]
        tasks = [run_contrarian_agent(agent, context, problem, synthesis) for agent in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                continue
            contrarian_analyses.append(result)
            yield f"event: contrarian_agent\ndata: {json.dumps(result)}\n\n"

        await asyncio.sleep(3.0)

    # --- Arbitration ---
    yield f"event: status\ndata: {json.dumps({'message': 'Arbitrating...'})}\n\n"
    arbitration = await run_arbitration(context, problem, synthesis, contrarian_analyses)
    yield f"event: arbitration\ndata: {json.dumps(arbitration)}\n\n"

    yield f"event: done\ndata: {{}}\n\n"
