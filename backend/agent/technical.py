import yfinance as yf
import pandas as pd
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
import io
import os
import math
import matplotlib
matplotlib.use('Agg')
import mplfinance as mpf
from google import genai
from google.genai import types
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import json

load_dotenv()

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

def technical_agent_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    try:
        df = yf.Ticker(ticker).history(period="6mo")
        
        if df.empty:
            raise ValueError(f"No price data found for {ticker}")

        # Calculate RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI_14'] = 100 - (100 / (1 + rs))

        # Calculate MACD
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD_12_26_9'] = exp1 - exp2
        df['MACDs_12_26_9'] = df['MACD_12_26_9'].ewm(span=9, adjust=False).mean()

        # Calculate SMA
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()

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
            "neutral" if math.isnan(rsi) else
            "oversold" if rsi < 30 else
            "overbought" if rsi > 70 else "neutral"
        )
        macd_signal_str = "neutral" if math.isnan(macd) or math.isnan(macd_signal) else ("bullish" if macd > macd_signal else "bearish")
        trend = "neutral" if math.isnan(sma50) or math.isnan(sma200) else ("uptrend" if sma50 > sma200 else "downtrend")

        # Generate Chart and use Gemini Vision
        gemini_vision_analysis = "Vision analysis skipped (No API Key)"
        try:
            buf = io.BytesIO()
            ap = []
            if not df['SMA_50'].dropna().empty:
                ap.append(mpf.make_addplot(df['SMA_50'], color='blue'))
            if not df['SMA_200'].dropna().empty:
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
            "rsi": float(round(rsi, 2)) if pd.notna(rsi) else None,
            "rsi_signal": rsi_signal,
            "macd": float(round(macd, 4)) if pd.notna(macd) else None,
            "macd_signal": macd_signal_str,
            "sma50": float(round(sma50, 2)) if pd.notna(sma50) else None,
            "sma200": float(round(sma200, 2)) if pd.notna(sma200) else None,
            "trend": trend,
            "support": float(round(support, 2)) if pd.notna(support) else None,
            "resistance": float(round(resistance, 2)) if pd.notna(resistance) else None,
            "fetched_at": datetime.utcnow().isoformat(),
        }
        
        technical_data = clean_nan(technical_data)

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

    return {"technical_data": clean_nan(technical_data)}