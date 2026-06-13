import yfinance as yf
import pandas as pd
import pandas_ta as ta
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
def technical_agent_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    try:
        df = yf.Ticker(ticker).history(period="6mo")
        df.ta.rsi(append=True)
        df.ta.macd(append=True)
        df.ta.sma(length=50, append=True)
        df.ta.sma(length=200, append=True)

        latest = df.iloc[-1]
        rsi = latest.get("RSI_14")
        macd = latest.get("MACD_12_26_9")
        macd_signal = latest.get("MACDs_12_26_9")
        sma50 = latest.get("SMA_50")
        sma200 = latest.get("SMA_200")

        # Support / resistance (20-day high/low)
        support = df["Low"].tail(20).min()
        resistance = df["High"].tail(20).max()

        rsi_signal = (
            "oversold" if rsi < 30 else
            "overbought" if rsi > 70 else "neutral"
        )
        macd_signal_str = "bullish" if (macd and macd_signal and macd > macd_signal) else "bearish"
        trend = "uptrend" if (sma50 and sma200 and sma50 > sma200) else "downtrend"

        technical_data = {
            "rsi": round(rsi, 2) if rsi else None,
            "rsi_signal": rsi_signal,
            "macd": round(macd, 4) if macd else None,
            "macd_signal": macd_signal_str,
            "sma50": round(sma50, 2) if sma50 else None,
            "sma200": round(sma200, 2) if sma200 else None,
            "trend": trend,
            "support": round(support, 2),
            "resistance": round(resistance, 2),
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        technical_data = {"error": str(e)}

    return {"technical_data": technical_data}