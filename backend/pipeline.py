import asyncio
import json
import re
from groq import AsyncGroq, RateLimitError
import os
from dotenv import load_dotenv
from agents import AGENTS_BY_MODE, AgentDef
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


async def run_synthesis(context: str, problem: str, all_analyses: List[dict], pill: dict = None) -> dict:
    """Run the synthesis agent to produce the final mechanism."""

    analyses_text = "\n".join(
        [f"[{a['role']}] {a['analysis']}" for a in all_analyses]
    )

    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=800,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": """You are the Synthesis Agent — you integrate all expert analyses into a unified mechanism design solution.

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

Return ONLY the JSON object.""",
            },
            {
                "role": "user",
                "content": (
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
                ),
            },
        ],
    )

    text = response.choices[0].message.content
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])


async def run_pipeline(mode: str, context: str, problem: str, pill: dict = None) -> AsyncGenerator[str, None]:
    """
    Main pipeline: runs agents in batches, streams results as SSE events.
    """
    agents = AGENTS_BY_MODE.get(mode, AGENTS_BY_MODE["company"])
    all_analyses = []

    # Run agents in batches of 3 to stay within TPM limits
    batch_size = 3
    for i in range(0, len(agents), batch_size):
        batch = agents[i : i + batch_size]

        # Run batch in parallel
        tasks = [
            run_agent(agent, context, problem, all_analyses) for agent in batch
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                continue
            all_analyses.append(result)
            # Yield SSE event
            yield f"event: agent\ndata: {json.dumps(result)}\n\n"

        # Delay between batches: let TPM window breathe
        await asyncio.sleep(3.0)

    # Run synthesis (optionally enriched with a library pill)
    yield f"event: status\ndata: {json.dumps({'message': 'Synthesizing...'})}\n\n"
    synthesis = await run_synthesis(context, problem, all_analyses, pill=pill)
    yield f"event: synthesis\ndata: {json.dumps(synthesis)}\n\n"
    yield f"event: done\ndata: {{}}\n\n"
