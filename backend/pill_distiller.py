"""
pill_distiller.py
─────────────────
After an analysis completes, extract an abstract, reusable
"mechanism pill" — stripping all user-specific details and
preserving only the transferable game-theoretic pattern.
"""

import json
import asyncio
from groq import AsyncGroq
from auth import save_pill

client = AsyncGroq()
MODEL = "llama-3.3-70b-versatile"

PROBLEM_CLASSES = [
    "Principal-Agent",
    "Coordination",
    "Auction",
    "Public Goods",
    "Signaling",
    "Reputation",
    "Voting",
    "Information Design",
    "Bargaining",
    "Contract Design",
]

DISTILL_PROMPT = """You are a mechanism design theorist. Given a completed analysis, extract an ABSTRACT, REUSABLE mechanism pill.

RULES:
- Remove ALL specific details: company names, numbers, people, industries.
- Keep only the abstract game-theoretic pattern.
- The pill must be useful for someone with a SIMILAR (not identical) problem.
- Be concise and precise.

COMPLETED ANALYSIS:
Mode: {mode}
Problem: {problem}
Context: {context}
Mechanism name: {mechanism_name}
Core insight: {core_insight}
Rules applied: {rules}
Expected outcome: {expected_outcome}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "problem_class": "<one of: {classes}>",
  "abstract_pattern": "<1-2 sentences: the abstract problem this mechanism solves>",
  "mechanism_name": "<canonical name of the mechanism>",
  "core_rules": ["<rule 1>", "<rule 2>", "<rule 3>"],
  "key_conditions": ["<condition under which this mechanism is IC>", "<condition for IR>"],
  "why_it_works": "<2-3 sentences: the game-theoretic reasoning, no specific details>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>"]
}}"""


async def distill_pill(
    mode: str,
    problem: str,
    context: str,
    synthesis: dict,
) -> str | None:
    """
    Run the distillation LLM call and save the pill.
    Returns the pill_id on success, None on failure.
    """
    if not synthesis:
        return None

    prompt = DISTILL_PROMPT.format(
        mode=mode,
        problem=problem[:500],
        context=context[:500],
        mechanism_name=synthesis.get("mechanism_name", ""),
        core_insight=synthesis.get("core_insight", ""),
        rules="\n".join(f"- {r}" for r in synthesis.get("rules", [])),
        expected_outcome=synthesis.get("expected_outcome", ""),
        classes=", ".join(PROBLEM_CLASSES),
    )

    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )
        raw = resp.choices[0].message.content.strip()

        # Strip markdown code block if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        pill = json.loads(raw)
        pill["mode"] = mode

        # Validate required fields
        required = ["problem_class", "abstract_pattern", "mechanism_name",
                    "core_rules", "key_conditions", "why_it_works", "tags"]
        if not all(k in pill for k in required):
            return None

        pill_id = save_pill(pill)
        print(f"[PILL] Distilled and saved: {pill['mechanism_name']} ({pill['problem_class']}) → {pill_id}")
        return pill_id

    except Exception as e:
        print(f"[PILL] Distillation failed: {e}")
        return None


async def distill_pill_background(mode, problem, context, synthesis):
    """Fire-and-forget wrapper — call without awaiting."""
    await distill_pill(mode, problem, context, synthesis)
