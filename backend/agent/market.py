import yfinance as yf
import requests, os
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")

def market_agent_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1y")

        # Alpha Vantage earnings
        av_url = (
            f"https://www.alphavantage.co/query?function=EARNINGS"
            f"&symbol={ticker}&apikey={AV_KEY}"
        )
        av_data = requests.get(av_url, timeout=10).json()
        earnings = av_data.get("quarterlyEarnings", [])[:4]

        # Calculate daily change and format volume
        current_close = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_close
        day_change = ((current_close - prev_close) / prev_close * 100) if prev_close else 0.0
        volume = int(hist["Volume"].iloc[-1]) if not hist.empty and "Volume" in hist.columns else 0

        # Format volume (e.g. 42.1M)
        if volume >= 1_000_000_000:
            formatted_volume = f"{volume / 1_000_000_000:.1f}B"
        elif volume >= 1_000_000:
            formatted_volume = f"{volume / 1_000_000:.1f}M"
        elif volume >= 1_000:
            formatted_volume = f"{volume / 1_000:.1f}K"
        else:
            formatted_volume = str(volume)

        market_data = {
            "price": info.get("currentPrice") or current_close,
            "pe_ratio": info.get("trailingPE"),
            "sector_pe": info.get("forwardPE"),
            "revenue_growth": info.get("revenueGrowth"),
            "market_cap": info.get("marketCap"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "hist_close": hist["Close"].tolist()[-30:],
            "day_change": day_change,
            "formatted_volume": formatted_volume,
            "earnings": earnings,
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        market_data = {"error": str(e)}

    return {"market_data": market_data}