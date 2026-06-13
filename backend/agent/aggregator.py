from graphs.state import AgentState
from datetime import datetime, timezone

STALE_DAYS = 90

def _staleness_flag(iso_str: str) -> bool:
    try:
        fetched = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - fetched
        return delta.days > STALE_DAYS
    except Exception:
        return False

def aggregator_node(state: AgentState) -> AgentState:
    market = state.get("market_data", {})
    technical = state.get("technical_data", {})
    news = state.get("news_data", {})
    rag = state.get("rag_data", {})

    bundle = {
        "ticker": state["ticker"],
        "amount": state["amount"],
        "horizon": state["horizon"],
        "risk_profile": state["risk_profile"],
        "goal_type": state["goal_type"],
        "market": {
            "data": market,
            "stale": _staleness_flag(market.get("fetched_at", "")),
        },
        "technical": {
            "data": technical,
            "stale": _staleness_flag(technical.get("fetched_at", "")),
        },
        "news": {
            "data": news,
            "stale": _staleness_flag(news.get("fetched_at", "")),
        },
        "rag": {
            "data": rag,
            "stale": rag.get("filing_age_days", 0) > STALE_DAYS,
        },
        "aggregated_at": datetime.utcnow().isoformat(),
    }

    return {"evidence_bundle": bundle}