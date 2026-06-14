# # from langchain_groq import ChatGroq
# # from langchain_core.prompts import ChatPromptTemplate
# # from graphs.state import AgentState
# # import json, os
# # from dotenv import load_dotenv
# # load_dotenv()
# # llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

# # PROMPT = ChatPromptTemplate.from_messages([
# #     ("system", """Extract investment intent from user message. Return ONLY valid JSON:
# # {{
# #   "ticker": "NVDA",
# #   "amount": 100000,
# #   "horizon": "5 years",
# #   "risk_profile": "moderate",
# #   "goal_type": "growth"
# # }}
# # risk_profile: conservative | moderate | aggressive
# # goal_type: growth | income | hedge"""),
# #     ("human", "{input}")
# # ])

# # def intent_parser_node(state: AgentState) -> AgentState:
# #     last_msg = state["messages"][-1].content
# #     chain = PROMPT | llm
# #     result = chain.invoke({"input": last_msg})
# #     try:
# #         parsed = json.loads(result.content)
# #     except Exception:
# #         import re
# #         match = re.search(r'\{.*\}', result.content, re.DOTALL)
# #         parsed = json.loads(match.group()) if match else {}

# #     return {
# #         "ticker": parsed.get("ticker", ""),
# #         "amount": float(parsed.get("amount") or 100000.0),
# #         "horizon": parsed.get("horizon") or "5 years",
# #         "risk_profile": parsed.get("risk_profile") or "moderate",
# #         "goal_type": parsed.get("goal_type") or "growth",
# #     }

# from langchain_groq import ChatGroq
# from langchain_core.prompts import ChatPromptTemplate
# from graphs.state import AgentState
# import json, re, os
# from dotenv import load_dotenv
# load_dotenv()

# llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

# PROMPT = ChatPromptTemplate.from_messages([
#     ("system", """Extract investment intent from user message. Return ONLY valid JSON, no trailing commas, no extra text.

# {{
#   "ticker": "RELIANCE",
#   "amount": 100000,
#   "horizon": "5 years",
#   "risk_profile": "moderate",
#   "goal_type": "growth"
# }}

# Rules:
# - ticker: NSE symbol ONLY, no suffix (e.g. RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, SBIN, WIPRO)
# - If user says "Reliance" → ticker = "RELIANCE"
# - If user says "TCS" → ticker = "TCS"
# - amount: integer in INR, default 100000
# - risk_profile: conservative | moderate | aggressive
# - goal_type: growth | income | hedge"""),
#     ("human", "{input}")
# ])

# # NSE ticker lookup — catches common aliases and LLM hallucinations
# NSE_ALIASES = {
#     "RELIANCE INDUSTRIES": "RELIANCE",
#     "RELIANCE IND": "RELIANCE",
#     "RIL": "RELIANCE",
#     "HDFC BANK": "HDFCBANK",
#     "HDFC": "HDFCBANK",
#     "ICICI": "ICICIBANK",
#     "ICICI BANK": "ICICIBANK",
#     "STATE BANK": "SBIN",
#     "SBI": "SBIN",
#     "INFOSYS": "INFY",
#     "TATA MOTORS": "TATAMOTORS",
#     "TATA CONSULTANCY": "TCS",
#     "BAJAJ FINANCE": "BAJFINANCE",
#     "ADANI ENTERPRISES": "ADANIENT",
# }

# def resolve_ticker(raw: str) -> str:
#     """Normalize LLM ticker output to clean NSE symbol with .NS suffix."""
#     ticker = raw.upper().strip().replace("$", "").replace(".NS", "").replace(".BSE", "")
#     ticker = NSE_ALIASES.get(ticker, ticker)
#     return f"{ticker}.NS"

# def safe_parse_json(text: str) -> dict:
#     """Try progressively looser strategies to extract JSON from LLM output."""
#     # Strategy 1: direct parse
#     try:
#         return json.loads(text)
#     except json.JSONDecodeError:
#         pass

#     # Strategy 2: extract first { ... } block
#     match = re.search(r'\{.*?\}', text, re.DOTALL)
#     if not match:
#         return {}

#     raw = match.group()

#     # Strategy 3: clean common LLM mistakes and retry
#     cleaned = raw
#     cleaned = re.sub(r',\s*}', '}', cleaned)        # trailing comma in object
#     cleaned = re.sub(r',\s*]', ']', cleaned)        # trailing comma in array
#     cleaned = re.sub(r'(\w+)\s*:', r'"\1":', cleaned)  # unquoted keys
#     cleaned = re.sub(r':\s*"([^"]*)"(\s*[,}])', lambda m: f': "{m.group(1)}"{m.group(2)}', cleaned)

#     try:
#         return json.loads(cleaned)
#     except json.JSONDecodeError:
#         return {}

# def intent_parser_node(state: AgentState) -> AgentState:
#     last_msg = state["messages"][-1].content
#     chain = PROMPT | llm
#     result = chain.invoke({"input": last_msg})

#     parsed = safe_parse_json(result.content)

#     raw_ticker = parsed.get("ticker", "").strip()
#     if not raw_ticker:
#         # Last resort: try to pull a word from the original message
#         words = last_msg.upper().split()
#         raw_ticker = next((w for w in words if len(w) >= 2 and w.isalpha()), "NIFTY50")

#     return {
#         "ticker":       resolve_ticker(raw_ticker),
#         "amount":       float(parsed.get("amount") or 100000.0),
#         "horizon":      parsed.get("horizon") or "5 years",
#         "risk_profile": parsed.get("risk_profile") or "moderate",
#         "goal_type":    parsed.get("goal_type") or "growth",
#     }

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graphs.state import AgentState
import json, re, os
import yfinance as yf
from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))

PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a financial intent parser. Extract the stock ticker and investment details from the user message.

Return ONLY a valid JSON object. No explanation, no markdown, no trailing commas.

{{
  "ticker": "RELIANCE",
  "amount": 100000,
  "horizon": "5 years",
  "risk_profile": "moderate",
  "goal_type": "growth"
}}

CRITICAL TICKER RULES:
- ticker must be a real stock symbol, NOT a word like "Analyze", "Buy", "Check", "Tell"
- For Indian stocks: use NSE symbol (RELIANCE, TCS, INFY, HDFCBANK, SBIN, WIPRO, TATAMOTORS)
- For US stocks: use standard symbol (NVDA, AAPL, TSLA, MSFT, GOOGL, AMZN, META)
- Common mappings: "Reliance" → RELIANCE, "TCS" → TCS, "Infosys" → INFY, "Apple" → AAPL, "Nvidia" → NVDA
- If no ticker found, use null

risk_profile: conservative | moderate | aggressive
goal_type: growth | income | hedge"""),
    ("human", "{input}")
])

# Words that are NEVER valid tickers
INVALID_TICKER_WORDS = {
    "ANALYZE", "ANALYSIS", "BUY", "SELL", "HOLD", "CHECK", "TELL",
    "SHOW", "GET", "FIND", "WHAT", "HOW", "IS", "ARE", "THE", "FOR",
    "ME", "MY", "ABOUT", "STOCK", "SHARE", "PRICE", "INVEST", "INVESTMENT"
}

NSE_ALIASES = {
    "RIL": "RELIANCE",
    "RELIANCE INDUSTRIES": "RELIANCE",
    "HDFC": "HDFCBANK",
    "HDFC BANK": "HDFCBANK",
    "ICICI": "ICICIBANK",
    "ICICI BANK": "ICICIBANK",
    "SBI": "SBIN",
    "STATE BANK": "SBIN",
    "INFOSYS": "INFY",
    "TATA MOTORS": "TATAMOTORS",
    "TATA CONSULTANCY": "TCS",
    "BAJAJ FINANCE": "BAJFINANCE",
    "ADANI": "ADANIENT",
}

# US tickers — do NOT append .NS
US_TICKERS = {
    "NVDA", "AAPL", "TSLA", "MSFT", "GOOGL", "GOOG", "AMZN", "META",
    "NFLX", "AMD", "INTC", "QCOM", "AVGO", "TSM", "ASML", "SMCI",
    "JPM", "BAC", "GS", "MS", "V", "MA", "PYPL",
    "BABA", "JD", "BIDU", "NIO", "XPEV",
}

def resolve_ticker(raw: str) -> str:
    """Return correct Yahoo Finance symbol — .NS for Indian, bare for US."""
    ticker = raw.upper().strip().replace("$", "")
    # Strip any existing suffix
    ticker = re.sub(r'\.(NS|BSE|NYSE|NASDAQ)$', '', ticker)

    # Apply Indian alias map
    ticker = NSE_ALIASES.get(ticker, ticker)

    if ticker in US_TICKERS:
        return ticker           # e.g. NVDA, AAPL — no suffix needed
    else:
        return f"{ticker}.NS"   # assume NSE for everything else


def extract_ticker_from_message(message: str) -> str | None:
    """
    Fallback: scan the user message for a likely ticker symbol.
    Skips common English words and verbs.
    """
    words = message.upper().split()
    for word in words:
        clean = re.sub(r'[^A-Z]', '', word)
        if (
            2 <= len(clean) <= 6
            and clean.isalpha()
            and clean not in INVALID_TICKER_WORDS
        ):
            return clean
    return None


def safe_parse_json(text: str) -> dict:
    """Extract JSON from LLM output using multiple fallback strategies."""
    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: extract first {...} block
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        return {}

    raw = match.group()

    # Strategy 3: clean common LLM JSON mistakes
    cleaned = re.sub(r',\s*}', '}', raw)       # trailing comma
    cleaned = re.sub(r',\s*]', ']', cleaned)   # trailing comma in array

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {}


def intent_parser_node(state: AgentState) -> AgentState:
    last_msg = state["messages"][-1].content
    chain = PROMPT | llm
    result = chain.invoke({"input": last_msg})

    parsed = safe_parse_json(result.content)

    # --- Ticker resolution (safe against None and invalid words) ---
    raw_ticker = parsed.get("ticker")  # may be None if LLM returned null

    if not raw_ticker or not isinstance(raw_ticker, str):
        raw_ticker = extract_ticker_from_message(last_msg)

    raw_ticker = (raw_ticker or "").strip().upper()

    if raw_ticker in INVALID_TICKER_WORDS or not raw_ticker:
        raw_ticker = extract_ticker_from_message(last_msg) or "NIFTY50"

    ticker = resolve_ticker(raw_ticker)

    return {
        "ticker":       ticker,
        "amount":       float(parsed.get("amount") or 100000.0),
        "horizon":      parsed.get("horizon") or "5 years",
        "risk_profile": parsed.get("risk_profile") or "moderate",
        "goal_type":    parsed.get("goal_type") or "growth",
    }