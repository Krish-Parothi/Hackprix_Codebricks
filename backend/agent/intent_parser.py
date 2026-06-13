# from langchain_groq import ChatGroq
# from langchain_core.prompts import ChatPromptTemplate
# from graphs.state import AgentState
# import json, os
# from dotenv import load_dotenv
# load_dotenv()
# llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

# PROMPT = ChatPromptTemplate.from_messages([
#     ("system", """Extract investment intent from user message. Return ONLY valid JSON:
# {{
#   "ticker": "NVDA",
#   "amount": 100000,
#   "horizon": "5 years",
#   "risk_profile": "moderate",
#   "goal_type": "growth"
# }}
# risk_profile: conservative | moderate | aggressive
# goal_type: growth | income | hedge"""),
#     ("human", "{input}")
# ])

# def intent_parser_node(state: AgentState) -> AgentState:
#     last_msg = state["messages"][-1].content
#     chain = PROMPT | llm
#     result = chain.invoke({"input": last_msg})
#     try:
#         parsed = json.loads(result.content)
#     except Exception:
#         import re
#         match = re.search(r'\{.*\}', result.content, re.DOTALL)
#         parsed = json.loads(match.group()) if match else {}

#     return {
#         "ticker": parsed.get("ticker", ""),
#         "amount": float(parsed.get("amount") or 100000.0),
#         "horizon": parsed.get("horizon") or "5 years",
#         "risk_profile": parsed.get("risk_profile") or "moderate",
#         "goal_type": parsed.get("goal_type") or "growth",
#     }

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graphs.state import AgentState
import json, re, os
from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Extract investment intent from user message. Return ONLY valid JSON, no trailing commas, no extra text.

{{
  "ticker": "RELIANCE",
  "amount": 100000,
  "horizon": "5 years",
  "risk_profile": "moderate",
  "goal_type": "growth"
}}

Rules:
- ticker: NSE symbol ONLY, no suffix (e.g. RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, WIPRO)
- If user says "Reliance" → ticker = "RELIANCE"
- If user says "TCS" → ticker = "TCS"
- amount: integer in INR, default 100000
- risk_profile: conservative | moderate | aggressive
- goal_type: growth | income | hedge"""),
    ("human", "{input}")
])

# NSE ticker lookup — catches common aliases and LLM hallucinations
NSE_ALIASES = {
    "RELIANCE INDUSTRIES": "RELIANCE",
    "RELIANCE IND": "RELIANCE",
    "RIL": "RELIANCE",
    "HDFC BANK": "HDFCBANK",
    "HDFC": "HDFCBANK",
    "ICICI": "ICICIBANK",
    "ICICI BANK": "ICICIBANK",
    "STATE BANK": "SBIN",
    "SBI": "SBIN",
    "INFOSYS": "INFY",
    "TATA MOTORS": "TATAMOTORS",
    "TATA CONSULTANCY": "TCS",
    "BAJAJ FINANCE": "BAJFINANCE",
    "ADANI ENTERPRISES": "ADANIENT",
}

def resolve_ticker(raw: str) -> str:
    """Normalize LLM ticker output to clean NSE symbol with .NS suffix."""
    ticker = raw.upper().strip().replace("$", "").replace(".NS", "").replace(".BSE", "")
    ticker = NSE_ALIASES.get(ticker, ticker)
    return f"{ticker}.NS"

def safe_parse_json(text: str) -> dict:
    """Try progressively looser strategies to extract JSON from LLM output."""
    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: extract first { ... } block
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        return {}

    raw = match.group()

    # Strategy 3: clean common LLM mistakes and retry
    cleaned = raw
    cleaned = re.sub(r',\s*}', '}', cleaned)        # trailing comma in object
    cleaned = re.sub(r',\s*]', ']', cleaned)        # trailing comma in array
    cleaned = re.sub(r'(\w+)\s*:', r'"\1":', cleaned)  # unquoted keys
    cleaned = re.sub(r':\s*"([^"]*)"(\s*[,}])', lambda m: f': "{m.group(1)}"{m.group(2)}', cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {}

def intent_parser_node(state: AgentState) -> AgentState:
    last_msg = state["messages"][-1].content
    chain = PROMPT | llm
    result = chain.invoke({"input": last_msg})

    parsed = safe_parse_json(result.content)

    raw_ticker = parsed.get("ticker", "").strip()
    if not raw_ticker:
        # Last resort: try to pull a word from the original message
        words = last_msg.upper().split()
        raw_ticker = next((w for w in words if len(w) >= 2 and w.isalpha()), "NIFTY50")

    return {
        "ticker":       resolve_ticker(raw_ticker),
        "amount":       float(parsed.get("amount") or 100000.0),
        "horizon":      parsed.get("horizon") or "5 years",
        "risk_profile": parsed.get("risk_profile") or "moderate",
        "goal_type":    parsed.get("goal_type") or "growth",
    }