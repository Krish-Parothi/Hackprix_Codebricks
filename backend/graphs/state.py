from typing import TypedDict, Optional, Any
from langgraph.graph import MessagesState

class AgentState(MessagesState):
    # User intent
    ticker: str
    amount: float
    horizon: str
    risk_profile: str
    goal_type: str

    # Evidence bundles
    market_data: dict
    technical_data: dict
    news_data: dict
    rag_data: dict
    evidence_bundle: dict

    # Analysis
    contradictions: dict
    risk_scores: dict
    portfolio_fit: dict
    bull_thesis: str
    bear_thesis: str
    report: dict

    # Control
    hitl_approved: bool
    hitl_action: str  # approve / modify / reject
    error: Optional[str]