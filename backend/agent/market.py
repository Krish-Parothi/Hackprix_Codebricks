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

        market_data = {
            "price": info.get("currentPrice"),
            "pe_ratio": info.get("trailingPE"),
            "sector_pe": info.get("forwardPE"),
            "revenue_growth": info.get("revenueGrowth"),
            "market_cap": info.get("marketCap"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "hist_close": hist["Close"].tolist()[-30:],
            "earnings": earnings,
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        market_data = {"error": str(e)}

    return {"market_data": market_data}