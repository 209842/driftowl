from pydantic import BaseModel
from typing import List, Optional


class SessionRequest(BaseModel):
    mode: str  # "company", "platform", "dao", "government"
    context: str
    problem: str


class AgentEvent(BaseModel):
    id: str
    name: str
    role: str
    color: str
    analysis: str
    references: List[str]  # ids of agents this one builds on


class SynthesisEvent(BaseModel):
    mechanism_name: str
    core_insight: str
    rules: List[str]
    explanation: str
    expected_outcome: str
