import yfinance as yf
import pandas as pd
import pandas_ta as ta
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
import io
import os
import matplotlib
matplotlib.use('Agg')
import mplfinance as mpf
from google import genai
from google.genai import types
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import json

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

        # Generate Chart and use Gemini Vision
        gemini_vision_analysis = "Vision analysis skipped (No API Key)"
        try:
            buf = io.BytesIO()
            ap = []
            if sma50:
                ap.append(mpf.make_addplot(df['SMA_50'], color='blue'))
            if sma200:
                ap.append(mpf.make_addplot(df['SMA_200'], color='red'))
            
            mpf.plot(df, type='candle', addplot=ap if ap else None, volume=True, style='yahoo', savefig=buf)
            buf.seek(0)

            gemini_key = os.getenv("GEMINI_API_KEY")
            if gemini_key:
                client = genai.Client(api_key=gemini_key)
                prompt = (
                    f"You are a master technical analyst. Look at this 6-month candlestick chart for {ticker}. "
                    "The blue line is the 50-day SMA, and the red line is the 200-day SMA. "
                    "Describe the visual patterns (e.g. Head & Shoulders, Double Bottom, Breakouts, Support/Resistance). "
                    "Is the visual trend bullish or bearish? Keep it under 3 sentences."
                )
                image_part = types.Part.from_bytes(data=buf.getvalue(), mime_type='image/png')
                response = client.models.generate_content(
                    model='gemini-1.5-flash',
                    contents=[prompt, image_part]
                )
                gemini_vision_analysis = response.text
        except Exception as vision_err:
            print(f"Gemini Vision Error: {vision_err}")
            gemini_vision_analysis = f"Vision analysis failed: {vision_err}"

        technical_data = {
            "gemini_vision_analysis": gemini_vision_analysis,
            "rsi": float(round(rsi, 2)) if rsi else None,
            "rsi_signal": rsi_signal,
            "macd": float(round(macd, 4)) if macd else None,
            "macd_signal": macd_signal_str,
            "sma50": float(round(sma50, 2)) if sma50 else None,
            "sma200": float(round(sma200, 2)) if sma200 else None,
            "trend": trend,
            "support": float(round(support, 2)),
            "resistance": float(round(resistance, 2)),
            "fetched_at": datetime.utcnow().isoformat(),
        }
        
        try:
            llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are the Technical Analyst AI. Summarize this technical data (RSI, trend, MACD, and vision analysis) into 2 natural, conversational sentences as if you are speaking in a boardroom. Do not use markdown or greetings."),
                ("human", "{data}")
            ])
            technical_data["speech_text"] = (prompt | llm).invoke({"data": json.dumps(technical_data)}).content
        except Exception as e:
            technical_data["speech_text"] = None
            
    except Exception as e:
        technical_data = {"error": str(e)}

    return {"technical_data": technical_data}