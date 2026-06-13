import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graphs.state import AgentState

llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

BULL_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a highly optimistic Venture Capitalist and Bull Investor.
Given the evidence bundle for a stock, write a persuasive 'Bull Thesis' highlighting all the positive signals, growth potential, and reasons to BUY.
Keep it punchy, professional, and highlight specific metrics or news.
Do NOT output JSON, just write the thesis as a raw string."""),
    ("human", "Evidence:\n{evidence}")
])

def bull_agent_node(state: AgentState) -> AgentState:
    bundle = state.get("evidence_bundle", {})
    chain = BULL_PROMPT | llm
    try:
        result = chain.invoke({"evidence": json.dumps(bundle, indent=2)})
        thesis = result.content
    except Exception as e:
        thesis = f"Bull Thesis unavailable: {str(e)}"
    
    return {"bull_thesis": thesis}


BEAR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a strict, risk-averse Auditor and Bear Investor.
Given the evidence bundle for a stock, write a harsh 'Bear Thesis' highlighting all the negative signals, risks, overvaluation concerns, and reasons to AVOID.
Keep it punchy, professional, and highlight specific risks or weaknesses.
Do NOT output JSON, just write the thesis as a raw string."""),
    ("human", "Evidence:\n{evidence}")
])

def bear_agent_node(state: AgentState) -> AgentState:
    bundle = state.get("evidence_bundle", {})
    chain = BEAR_PROMPT | llm
    try:
        result = chain.invoke({"evidence": json.dumps(bundle, indent=2)})
        thesis = result.content
    except Exception as e:
        thesis = f"Bear Thesis unavailable: {str(e)}"
    
    return {"bear_thesis": thesis}
