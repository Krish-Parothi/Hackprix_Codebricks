import numpy as np
import yfinance as yf
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graphs.state import AgentState
from memory.mongo import get_user_profile
import json, os
from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))

def convert_numpy(obj):
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    return obj

# ── Contradiction Detector ────────────────────────────────────────────────────
CONTRA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a conflict analyst. Given market evidence, identify contradictions.
Return ONLY JSON:
{{
  "conflicts": [{{"signal_a": "...", "signal_b": "...", "description": "...", "resolution": "..."}}],
  "conflict_count": 0,
  "overall_conflict_level": "low|medium|high"
}}"""),
    ("human", "Evidence:\n{evidence}")
])

def contradiction_detector_node(state: AgentState) -> AgentState:
    bundle = state.get("evidence_bundle", {})
    chain = CONTRA_PROMPT | llm
    result = chain.invoke({"evidence": json.dumps(bundle, indent=2)})
    try:
        contradictions = json.loads(result.content)
    except Exception:
        contradictions = {"conflicts": [], "conflict_count": 0, "overall_conflict_level": "low"}
    return {"contradictions": contradictions}


# ── Risk Quantification ───────────────────────────────────────────────────────
def risk_quantification_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    amount = state["amount"]
    try:
        df = yf.Ticker(ticker).history(period="1y")["Close"]
        returns = df.pct_change().dropna()

        # VaR at 95% confidence
        var_95 = float(np.percentile(returns, 5)) * amount

        # Sharpe (assume 6% risk-free rate annualised for India)
        rf_daily = 0.06 / 252
        excess = returns - rf_daily
        sharpe = float((excess.mean() / excess.std()) * np.sqrt(252))

        # Beta vs Nifty
        nifty = yf.Ticker("^NSEI").history(period="1y")["Close"].pct_change().dropna()
        common = returns.align(nifty, join="inner")
        cov = np.cov(common[0], common[1])
        beta = float(cov[0][1] / cov[1][1]) if cov[1][1] != 0 else 1.0

        volatility = float(returns.std() * np.sqrt(252))

        # Risk score 1-10
        risk_score = min(10, round(
            (abs(var_95) / amount * 100) * 0.4 +
            volatility * 10 * 0.4 +
            max(0, beta - 1) * 2 * 0.2
        , 1))

        risk_scores = {
            "var_95_inr": round(var_95, 2),
            "sharpe_ratio": round(sharpe, 3),
            "beta": round(beta, 3),
            "annual_volatility": round(volatility, 4),
            "risk_score": risk_score,
        }
    except Exception as e:
        risk_scores = {"error": str(e), "risk_score": 5.0}

    return {"risk_scores": risk_scores}


# ── Portfolio Fit ─────────────────────────────────────────────────────────────
async def portfolio_fit_node(state: AgentState) -> AgentState:
    profile = await get_user_profile("default_user")
    holdings = profile.get("holdings", [])
    goals = profile.get("goals", "growth")
    amount = state["amount"] 

    horizon_years = int("".join(filter(str.isdigit, state["horizon"] or "5")) or 5)
    risk_profile = state["risk_profile"]

    horizon_fit = (
        "HIGH" if horizon_years >= 5 else
        "MEDIUM" if horizon_years >= 2 else "LOW"
    )

    allocation_pct = {
        "conservative": 0.10,
        "moderate": 0.20,
        "aggressive": 0.40,
    }.get(risk_profile, 0.20)

    portfolio_fit = {
        "existing_holdings": holdings,
        "user_goals": goals,
        "horizon_fit": horizon_fit,
        "suggested_allocation_pct": f"{round(allocation_pct * 100, 1)}%",
        "suggested_allocation_inr": round(amount * allocation_pct, 2),
        "allocation_pct": allocation_pct,
    }
    return {"portfolio_fit": portfolio_fit}


# ── Report Synthesis ──────────────────────────────────────────────────────────
REPORT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a senior financial analyst for Indian retail investors.
Given structured evidence, produce a final investment report as JSON:
{{
  "signal_score": 6.2,
  "risk_score": 7.4,
  "recommendation": "ACCUMULATE GRADUALLY | BUY | HOLD | AVOID",
  "allocation": {{"immediate_inr": 20000, "staggered_inr": 20000, "remaining_inr": 60000}},
  "key_conflicts": ["..."],
  "resolution": "...",
  "pros": ["..."],
  "cons": ["..."],
  "sources": ["..."]
}}
signal_score = weighted average of RSI(0.3) + MACD(0.2) + sentiment(0.3) + fundamentals(0.2), scale 1-10.
risk_score = from risk_scores.risk_score provided. Do NOT invent numbers."""),
    ("human", "Full evidence:\n{evidence}\nRisk scores:\n{risk}\nPortfolio fit:\n{portfolio}\nContradictions:\n{contradictions}\nBull Thesis:\n{bull_thesis}\nBear Thesis:\n{bear_thesis}")
])

def report_synthesis_node(state: AgentState) -> AgentState:
    chain = REPORT_PROMPT | llm
    result = chain.invoke({
        "evidence": json.dumps(state.get("evidence_bundle", {}), indent=2),
        "risk": json.dumps(state.get("risk_scores", {}), indent=2),
        "portfolio": json.dumps(state.get("portfolio_fit", {}), indent=2),
        "contradictions": json.dumps(state.get("contradictions", {}), indent=2),
        "bull_thesis": state.get("bull_thesis", "None"),
        "bear_thesis": state.get("bear_thesis", "None"),
    })
    try:
        report = json.loads(result.content)
    except Exception:
        import re
        match = re.search(r'\{.*\}', result.content, re.DOTALL)
        report = json.loads(match.group()) if match else {"raw": result.content}

    return {"report": report}


# def risk_quantification_node(state: AgentState) -> AgentState:
#     ticker = state["ticker"]
#     amount = state["amount"]
#     try:
#         df = yf.Ticker(ticker).history(period="1y")["Close"]
#         returns = df.pct_change().dropna()

#         var_95 = float(np.percentile(returns, 5)) * amount
#         rf_daily = 0.06 / 252
#         excess = returns - rf_daily
#         sharpe = float((excess.mean() / excess.std()) * np.sqrt(252))

#         nifty = yf.Ticker("^NSEI").history(period="1y")["Close"].pct_change().dropna()
#         common = returns.align(nifty, join="inner")
#         cov = np.cov(common[0], common[1])
#         beta = float(cov[0][1] / cov[1][1]) if cov[1][1] != 0 else 1.0
#         volatility = float(returns.std() * np.sqrt(252))

#         risk_score = min(10, round(
#             (abs(var_95) / amount * 100) * 0.4 +
#             volatility * 10 * 0.4 +
#             max(0, beta - 1) * 2 * 0.2
#         , 1))

#         risk_scores = {
#             "var_95_inr": float(round(var_95, 2)),      # ✅ explicit float()
#             "sharpe_ratio": float(round(sharpe, 3)),    # ✅
#             "beta": float(round(beta, 3)),              # ✅
#             "annual_volatility": float(round(volatility, 4)),  # ✅
#             "risk_score": float(risk_score),            # ✅
#         }
#     except Exception as e:
#         risk_scores = {"error": str(e), "risk_score": 5.0}

#     return {"risk_scores": risk_scores}

def risk_quantification_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    amount = state["amount"]
    try:
        df = yf.Ticker(ticker).history(period="1y")["Close"]
        
        # Guard: empty price data
        if df.empty or len(df) < 2:
            return {"risk_scores": {"error": "Insufficient price data", "risk_score": 5.0}}

        returns = df.pct_change().dropna()

        # Guard: empty returns after dropna
        if returns.empty:
            return {"risk_scores": {"error": "No valid returns", "risk_score": 5.0}}

        # VaR at 95%
        var_95 = float(np.percentile(returns, 5)) * amount

        # Sharpe — guard against zero std
        rf_daily = 0.06 / 252
        excess = returns - rf_daily
        sharpe = float((excess.mean() / excess.std()) * np.sqrt(252)) if excess.std() != 0 else 0.0

        # Beta vs Nifty — guard against misaligned / empty overlap
        nifty_raw = yf.Ticker("^NSEI").history(period="1y")["Close"]
        if nifty_raw.empty:
            beta = 1.0
        else:
            nifty = nifty_raw.pct_change().dropna()
            aligned_stock, aligned_nifty = returns.align(nifty, join="inner")

            # Guard: need at least 2 overlapping points for covariance
            if len(aligned_stock) < 2 or len(aligned_nifty) < 2:
                beta = 1.0
            else:
                cov = np.cov(aligned_stock, aligned_nifty)
                beta = float(cov[0][1] / cov[1][1]) if cov[1][1] != 0 else 1.0

        volatility = float(returns.std() * np.sqrt(252))

        risk_score = min(10, round(
            (abs(var_95) / amount * 100) * 0.4 +
            volatility * 10 * 0.4 +
            max(0, beta - 1) * 2 * 0.2
        , 1))

        risk_scores = {
            "var_95_inr": float(round(var_95, 2)),
            "sharpe_ratio": float(round(sharpe, 3)),
            "beta": float(round(beta, 3)),
            "annual_volatility": float(round(volatility, 4)),
            "risk_score": float(risk_score),
        }

    except Exception as e:
        risk_scores = {"error": str(e), "risk_score": 5.0}

    return {"risk_scores": risk_scores}