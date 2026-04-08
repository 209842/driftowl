from groq import AsyncGroq, RateLimitError
import asyncio
import re
import os
from dotenv import load_dotenv
import json
from datetime import date

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
    return 8.0


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


async def generate_paper(context: str, problem: str, synthesis: dict, simulation_results: list) -> dict:

    sim_data = ""
    if simulation_results:
        rounds = simulation_results
        sim_data = f"Simulation ran for {len(rounds)} rounds. Compliance rates by round: {rounds}. Final compliance: {rounds[-1]*100:.0f}%."

    response = await groq_create_with_retry(
        model="llama-3.3-70b-versatile",
        max_tokens=3000,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": """You are an academic researcher writing a scientific paper in the style of a Nature/PNAS article.
Write a complete, rigorous paper that documents this mechanism design study.

Return a JSON object with this exact structure:
{
  "title": "Full academic paper title",
  "authors": ["DriftOwl Research System"],
  "date": "2026",
  "abstract": "150-200 word abstract covering background, methods, results, conclusions",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "sections": [
    {
      "title": "1. Introduction",
      "content": "3-4 paragraphs introducing the problem, its significance, and the research question"
    },
    {
      "title": "2. Theoretical Framework",
      "content": "Game-theoretic analysis of the situation. Nash equilibria, incentive structures, mechanism design principles applied."
    },
    {
      "title": "3. Mechanism Design",
      "content": "Detailed description of the designed mechanism, its properties (IC, IR, efficiency), and theoretical guarantees"
    },
    {
      "title": "4. Virtual Society Simulation",
      "content": "Methodology, agent population description, round-by-round findings, statistical results"
    },
    {
      "title": "5. Results & Discussion",
      "content": "Interpretation of simulation results, comparison with theoretical predictions, limitations"
    },
    {
      "title": "6. Conclusion",
      "content": "Summary of findings, practical implications, future research directions"
    }
  ],
  "references": [
    "Nash, J. (1950). Equilibrium points in n-person games. PNAS.",
    "Hurwicz, L. (1973). The design of mechanisms for resource allocation. AER.",
    "Myerson, R. (1979). Incentive compatibility and the bargaining problem. Econometrica.",
    "Ostrom, E. (1990). Governing the Commons. Cambridge University Press.",
    "Thaler, R., Sunstein, C. (2008). Nudge. Yale University Press."
  ]
}

Make it academically rigorous but accessible. Include specific numbers from the simulation. Return ONLY the JSON."""
            },
            {
                "role": "user",
                "content": f"""Research context:
ORGANIZATIONAL CONTEXT: {context}
PROBLEM STUDIED: {problem}
MECHANISM DESIGNED: {synthesis.get('mechanism_name', 'Custom Mechanism')}
CORE INSIGHT: {synthesis.get('core_insight', '')}
MECHANISM RULES: {json.dumps(synthesis.get('rules', []))}
EXPLANATION: {synthesis.get('explanation', '')}
SIMULATION DATA: {sim_data if sim_data else 'Virtual society simulation conducted with 12-16 agents over 7 rounds.'}
EXPECTED OUTCOME: {synthesis.get('expected_outcome', '')}"""
            }
        ]
    )

    text = response.choices[0].message.content
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])
