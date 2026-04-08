import asyncio
import json
import re
import random
from groq import AsyncGroq, RateLimitError
import os
from dotenv import load_dotenv
from typing import AsyncGenerator

load_dotenv()
client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))


def _parse_retry_seconds(error: RateLimitError) -> float:
    try:
        msg = str(error)
        match = re.search(r'try again in ([\d.]+)s', msg)
        if match:
            return float(match.group(1)) + 0.5
    except Exception:
        pass
    return 6.0


async def groq_create_with_retry(max_retries: int = 5, **kwargs):
    for attempt in range(max_retries):
        try:
            return await client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait = _parse_retry_seconds(e)
            await asyncio.sleep(wait)
    raise RuntimeError("Max retries exceeded")


async def extract_population(context: str, problem: str) -> list[dict]:
    """Extract realistic population personas from the context."""
    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=1000,
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": """Extract a realistic population of individual personas from the described context.
Return a JSON array of exactly 10 individuals. Each person should be distinct and realistic.

Structure:
[
  {
    "id": "p1",
    "name": "First name only",
    "role": "Their role/position",
    "personality": "2-3 word personality description (e.g. 'skeptical, competitive')",
    "initial_stance": "resistant|neutral|receptive",
    "motivation": "What primarily motivates this person at work"
  }
]

Make personas diverse: different personalities, stances, motivations. Include skeptics, enthusiasts, and neutrals.
Return ONLY the JSON array."""
            },
            {"role": "user", "content": f"Context: {context}\nProblem: {problem}"}
        ]
    )
    text = response.choices[0].message.content
    start = text.find("[")
    end = text.rfind("]") + 1
    return json.loads(text[start:end])


async def run_round(
    persona: dict,
    mechanism_rules: list[str],
    round_num: int,
    previous_round_summary: str,
    context: str
) -> dict:
    """Simulate one person's decision in one round."""

    rules_text = "\n".join([f"- {r}" for r in mechanism_rules])

    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=150,
        temperature=0.85,
        messages=[
            {
                "role": "system",
                "content": f"""You are {persona['name']}, {persona['role']}.
Personality: {persona['personality']}
Motivation: {persona['motivation']}
Initial stance: {persona['initial_stance']}"""
            },
            {
                "role": "user",
                "content": f"""Mechanism rules:
{rules_text}

Round {round_num} context: {previous_round_summary if previous_round_summary else "First round — mechanism just announced."}

Write 1 sentence of your behavior and reasoning.
Then on a new line: DECISION: COMPLY or RESIST"""
            }
        ]
    )

    text = response.choices[0].message.content
    decision = "COMPLY" if "COMPLY" in text.upper() else "RESIST"
    behavior = text.replace("DECISION: COMPLY", "").replace("DECISION: RESIST", "").strip()

    return {
        "id": persona["id"],
        "name": persona["name"],
        "role": persona["role"],
        "decision": decision,
        "behavior": behavior,
        "round": round_num
    }


async def run_simulation_pipeline(
    context: str,
    problem: str,
    synthesis: dict
) -> AsyncGenerator[str, None]:

    mechanism_rules = synthesis.get("rules", ["Implement the designed mechanism"])
    mechanism_name = synthesis.get("mechanism_name", "The Mechanism")

    # Extract population
    yield f"event: status\ndata: {json.dumps({'message': 'Building virtual population...'})}\n\n"
    population = await extract_population(context, problem)

    # Send population info
    for p in population:
        yield f"event: persona\ndata: {json.dumps(p)}\n\n"

    await asyncio.sleep(0.5)

    # Run 7 rounds
    all_round_results = []
    previous_summary = ""

    for round_num in range(1, 8):
        yield f"event: round_start\ndata: {json.dumps({'round': round_num, 'total': 7})}\n\n"

        # Run personas in batches of 3 to avoid TPM limit
        round_results = []
        batch_size = 3
        for i in range(0, len(population), batch_size):
            batch = population[i:i + batch_size]
            tasks = [
                run_round(p, mechanism_rules, round_num, previous_summary, context)
                for p in batch
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in batch_results:
                if not isinstance(r, Exception):
                    round_results.append(r)
                    yield f"event: agent_action\ndata: {json.dumps(r)}\n\n"
            # Breathe between persona batches
            if i + batch_size < len(population):
                await asyncio.sleep(2.0)

        all_round_results.append(round_results)

        # Calculate stats
        comply_count = sum(1 for r in round_results if r["decision"] == "COMPLY")
        comply_rate = comply_count / len(round_results) if round_results else 0

        round_summary = {
            "round": round_num,
            "comply_rate": round(comply_rate, 2),
            "comply_count": comply_count,
            "total": len(round_results)
        }
        yield f"event: round_end\ndata: {json.dumps(round_summary)}\n\n"

        previous_summary = f"Round {round_num}: {comply_count}/{len(round_results)} complied ({comply_rate*100:.0f}%). "
        if comply_rate > 0.6:
            previous_summary += "The mechanism is gaining traction."
        elif comply_rate < 0.3:
            previous_summary += "Significant resistance continues."
        else:
            previous_summary += "Mixed response, situation evolving."

        # Delay between rounds
        if round_num < 7:
            await asyncio.sleep(2.0)

    # Final simulation results
    final_rates = [
        sum(1 for r in rnd if r["decision"] == "COMPLY") / len(rnd)
        for rnd in all_round_results if rnd
    ]

    simulation_summary = {
        "rounds_data": [round(r, 2) for r in final_rates],
        "final_comply_rate": round(final_rates[-1], 2) if final_rates else 0,
        "peak_comply_rate": round(max(final_rates), 2) if final_rates else 0,
        "trend": "improving" if final_rates[-1] > final_rates[0] else "declining" if final_rates[-1] < final_rates[0] else "stable",
        "population_size": len(population)
    }

    yield f"event: simulation_complete\ndata: {json.dumps(simulation_summary)}\n\n"
    yield f"event: done\ndata: {{}}\n\n"
