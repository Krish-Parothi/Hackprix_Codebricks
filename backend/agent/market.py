# import yfinance as yf
# import requests, os, json
# from graphs.state import AgentState
# from datetime import datetime
# from dotenv import load_dotenv
# from langchain_groq import ChatGroq
# from langchain_core.prompts import ChatPromptTemplate

# load_dotenv()
# AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")

# import math

# def clean_nan(obj):
#     if isinstance(obj, float) and math.isnan(obj):
#         return None
#     elif isinstance(obj, dict):
#         return {k: clean_nan(v) for k, v in obj.items()}
#     elif isinstance(obj, list):
#         return [clean_nan(v) for v in obj]
#     return obj

# def market_agent_node(state: AgentState) -> AgentState:
#     ticker = state["ticker"]
#     try:
#         stock = yf.Ticker(ticker)
#         info = stock.info
#         hist = stock.history(period="1y")

#         # Alpha Vantage earnings
#         av_url = (
#             f"https://www.alphavantage.co/query?function=EARNINGS"
#             f"&symbol={ticker}&apikey={AV_KEY}"
#         )
#         av_data = requests.get(av_url, timeout=10).json()
#         earnings = av_data.get("quarterlyEarnings", [])[:4]

#         # Calculate daily change and format volume
#         current_close = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
#         prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_close
#         day_change = ((current_close - prev_close) / prev_close * 100) if prev_close else 0.0
#         volume = int(hist["Volume"].iloc[-1]) if not hist.empty and "Volume" in hist.columns else 0

#         # Format volume (e.g. 42.1M)
#         if volume >= 1_000_000_000:
#             formatted_volume = f"{volume / 1_000_000_000:.1f}B"
#         elif volume >= 1_000_000:
#             formatted_volume = f"{volume / 1_000_000:.1f}M"
#         elif volume >= 1_000:
#             formatted_volume = f"{volume / 1_000:.1f}K"
#         else:
#             formatted_volume = str(volume)

#         market_data = {
#             "price": info.get("currentPrice") or current_close,
#             "pe_ratio": info.get("trailingPE"),
#             "sector_pe": info.get("forwardPE"),
#             "revenue_growth": info.get("revenueGrowth"),
#             "market_cap": info.get("marketCap"),
#             "52w_high": info.get("fiftyTwoWeekHigh"),
#             "52w_low": info.get("fiftyTwoWeekLow"),
#             "hist_close": hist["Close"].tolist()[-30:],
#             "day_change": day_change,
#             "formatted_volume": formatted_volume,
#             "earnings": earnings,
#             "fetched_at": datetime.utcnow().isoformat(),
#         }
        
#         market_data = clean_nan(market_data)
        
#         try:
#             llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))
#             prompt = ChatPromptTemplate.from_messages([
#                 ("system", "You are the Market Analyst AI. Summarize this market data into 2 natural, conversational sentences as if you are speaking in a boardroom. Speak out the price, day change, and volume. Do not use markdown or greetings."),
#                 ("human", "{data}")
#             ])
#             market_data["speech_text"] = (prompt | llm).invoke({"data": json.dumps(market_data)}).content
#         except Exception as e:
#             market_data["speech_text"] = None
            
#     except Exception as e:
#         market_data = {"error": str(e)}

#     return {"market_data": clean_nan(market_data)}


import yfinance as yf
import requests, os, json, math
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")


def clean_nan(obj):
    """Recursively replace NaN/Inf floats with None for JSON safety."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    elif isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(v) for v in obj]
    return obj


def format_volume(volume: int) -> str:
    if volume >= 1_000_000_000:
        return f"{volume / 1_000_000_000:.1f}B"
    elif volume >= 1_000_000:
        return f"{volume / 1_000_000:.1f}M"
    elif volume >= 1_000:
        return f"{volume / 1_000:.1f}K"
    return str(volume)


def market_agent_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]

    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1y")

        # --- Alpha Vantage earnings ---
        av_url = (
            f"https://www.alphavantage.co/query?function=EARNINGS"
            f"&symbol={ticker}&apikey={AV_KEY}"
        )
        av_data = requests.get(av_url, timeout=10).json()
        earnings = av_data.get("quarterlyEarnings", [])[:4]

        # --- Price / change / volume ---
        hist_close = hist["Close"].tolist() if not hist.empty else []

        current_close = float(hist_close[-1]) if hist_close else 0.0
        prev_close    = float(hist_close[-2]) if len(hist_close) > 1 else current_close
        day_change    = ((current_close - prev_close) / prev_close * 100) if prev_close else 0.0

        raw_volume = int(hist["Volume"].iloc[-1]) if not hist.empty and "Volume" in hist.columns else 0
        formatted_volume = format_volume(raw_volume)

        market_data = {
            "price":            info.get("currentPrice") or current_close,
            "pe_ratio":         info.get("trailingPE"),
            "sector_pe":        info.get("forwardPE"),
            "revenue_growth":   info.get("revenueGrowth"),
            "market_cap":       info.get("marketCap"),
            "52w_high":         info.get("fiftyTwoWeekHigh"),
            "52w_low":          info.get("fiftyTwoWeekLow"),
            "hist_close":       hist_close[-30:],
            "day_change":       day_change,
            "formatted_volume": formatted_volume,
            "earnings":         earnings,
            "fetched_at":       datetime.utcnow().isoformat(),
        }

        market_data = clean_nan(market_data)

        # --- LLM speech summary ---
        # Build a lean payload — no need to send fetched_at or raw earnings
        summary_payload = {
            k: market_data[k]
            for k in ("price", "day_change", "formatted_volume", "pe_ratio", "52w_high", "52w_low")
            if k in market_data
        }

        try:
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=os.getenv("GROQ_API_KEY")
            )
            prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    "You are the Market Analyst AI. Summarize this market data into "
                    "2 natural, conversational sentences as if speaking in a boardroom. "
                    "Include the price, day change, and volume. No markdown or greetings."
                ),
                ("human", "{data}"),
            ])
            market_data["speech_text"] = (
                (prompt | llm).invoke({"data": json.dumps(summary_payload)}).content
            )
        except Exception as llm_err:
            market_data["speech_text"] = None
            print(f"[market_agent] LLM error: {llm_err}")

    except Exception as e:
        print(f"[market_agent] Fatal error for {ticker}: {e}")
        market_data = {"error": str(e)}  # ← always defined now

    return {"market_data": clean_nan(market_data)}