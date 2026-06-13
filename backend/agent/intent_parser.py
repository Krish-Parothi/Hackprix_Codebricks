from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graphs.state import AgentState
import json, os
from dotenv import load_dotenv
load_dotenv()
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))

PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Extract investment intent from user message. Return ONLY valid JSON:
{{
  "ticker": "NVDA",
  "amount": 100000,
  "horizon": "5 years",
  "risk_profile": "moderate",
  "goal_type": "growth"
}}
risk_profile: conservative | moderate | aggressive
goal_type: growth | income | hedge"""),
    ("human", "{input}")
])

def intent_parser_node(state: AgentState) -> AgentState:
    last_msg = state["messages"][-1].content
    chain = PROMPT | llm
    result = chain.invoke({"input": last_msg})
    try:
        parsed = json.loads(result.content)
    except Exception:
        import re
        match = re.search(r'\{.*\}', result.content, re.DOTALL)
        parsed = json.loads(match.group()) if match else {}

    return {
        "ticker": parsed.get("ticker", ""),
        "amount": parsed.get("amount", 0),
        "horizon": parsed.get("horizon", ""),
        "risk_profile": parsed.get("risk_profile", "moderate"),
        "goal_type": parsed.get("goal_type", "growth"),
    }