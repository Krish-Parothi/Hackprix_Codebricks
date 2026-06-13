# from langgraph.graph import StateGraph, END
# from langgraph.checkpoint.memory import MemorySaver
# from graphs.state import AgentState
# from agent.intent_parser import intent_parser_node
# from agent.market import market_agent_node
# from agent.technical import technical_agent_node
# from agent.news import news_agent_node
# from agent.aggregator import aggregator_node
# from agent.analysis import (
#     contradiction_detector_node,
#     risk_quantification_node,
#     portfolio_fit_node,
#     report_synthesis_node,
# )

# def hitl_gate_node(state: AgentState) -> AgentState:
#     # Pauses here — FastAPI resumes with Command(resume=...)
#     return {}

# def execution_node(state: AgentState) -> AgentState:
#     # Post-approval: update memory, set alerts (called from API after HITL)
#     return {}

# def route_after_hitl(state: AgentState) -> str:
#     action = state.get("hitl_action", "")
#     if action == "approve":
#         return "execution"
#     return END

# def build_graph():
#     g = StateGraph(AgentState)

#     g.add_node("intent_parser", intent_parser_node)
#     g.add_node("market", market_agent_node)
#     g.add_node("technical", technical_agent_node)
#     g.add_node("news", news_agent_node)
#     g.add_node("aggregator", aggregator_node)
#     g.add_node("contradiction_detector", contradiction_detector_node)
#     g.add_node("risk_quantification", risk_quantification_node)
#     g.add_node("portfolio_fit", portfolio_fit_node)
#     g.add_node("report_synthesis", report_synthesis_node)
#     g.add_node("hitl_gate", hitl_gate_node)
#     g.add_node("execution", execution_node)

#     # Entry
#     g.set_entry_point("intent_parser")
#     g.add_edge("intent_parser", "market")
#     g.add_edge("intent_parser", "technical")
#     g.add_edge("intent_parser", "news")

#     # All 3 parallel agents → aggregator
#     g.add_edge("market", "aggregator")
#     g.add_edge("technical", "aggregator")
#     g.add_edge("news", "aggregator")

#     g.add_edge("aggregator", "contradiction_detector")
#     g.add_edge("contradiction_detector", "risk_quantification")
#     g.add_edge("risk_quantification", "portfolio_fit")
#     g.add_edge("portfolio_fit", "report_synthesis")
#     g.add_edge("report_synthesis", "hitl_gate")

#     g.add_conditional_edges("hitl_gate", route_after_hitl, {
#         "execution": "execution",
#         END: END,
#     })
#     g.add_edge("execution", END)

#     checkpointer = MemorySaver()
#     return g.compile(
#         checkpointer=checkpointer,
#         interrupt_before=["hitl_gate"]
#     )

# graph = build_graph()

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableLambda  # ✅ add this
from graphs.state import AgentState
from agent.intent_parser import intent_parser_node
from agent.market import market_agent_node
from agent.technical import technical_agent_node
from agent.news import news_agent_node
from agent.rag import rag_agent_node
from agent.debate import bull_agent_node, bear_agent_node
from agent.aggregator import aggregator_node
from agent.analysis import (
    contradiction_detector_node,
    risk_quantification_node,
    portfolio_fit_node,
    report_synthesis_node,
)

def hitl_gate_node(state: AgentState) -> AgentState:
    return {}

def execution_node(state: AgentState) -> AgentState:
    return {}

def route_after_hitl(state: AgentState) -> str:
    action = state.get("hitl_action", "")
    if action == "approve":
        return "execution"
    return END

def build_graph():
    g = StateGraph(AgentState)

    g.add_node("intent_parser", intent_parser_node)
    g.add_node("market", market_agent_node)
    g.add_node("technical", technical_agent_node)
    g.add_node("news", news_agent_node)
    g.add_node("rag", rag_agent_node)
    g.add_node("aggregator", aggregator_node)
    g.add_node("contradiction_detector", contradiction_detector_node)
    g.add_node("risk_quantification", risk_quantification_node)
    g.add_node("portfolio_fit", portfolio_fit_node)
    g.add_node("bull_agent", bull_agent_node)
    g.add_node("bear_agent", bear_agent_node)
    g.add_node("report_synthesis", report_synthesis_node)
    g.add_node("hitl_gate", hitl_gate_node)
    g.add_node("execution", execution_node)

    g.set_entry_point("intent_parser")
    g.add_edge("intent_parser", "market")
    g.add_edge("intent_parser", "technical")
    g.add_edge("intent_parser", "news")
    g.add_edge("intent_parser", "rag")

    g.add_edge("market", "aggregator")
    g.add_edge("technical", "aggregator")
    g.add_edge("news", "aggregator")
    g.add_edge("rag", "aggregator")

    g.add_edge("aggregator", "contradiction_detector")
    g.add_edge("contradiction_detector", "risk_quantification")
    g.add_edge("risk_quantification", "portfolio_fit")
    
    # Debate system chain
    g.add_edge("portfolio_fit", "bull_agent")
    g.add_edge("bull_agent", "bear_agent")
    g.add_edge("bear_agent", "report_synthesis")
    
    g.add_edge("report_synthesis", "hitl_gate")

    g.add_conditional_edges("hitl_gate", route_after_hitl, {
        "execution": "execution",
        END: END,
    })
    g.add_edge("execution", END)

    checkpointer = MemorySaver()
    return g.compile(
        checkpointer=checkpointer,
        interrupt_before=["hitl_gate"]
    )

graph = build_graph()