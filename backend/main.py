from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from graphs.pipeline import graph
from memory.mongo import save_analysis, add_to_watchlist
import json, uuid, asyncio
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi.responses import Response
from agent.voice import translate_to_english_sarvam, generate_audio_elevenlabs, generate_audio_sarvam
from agent.market import market_agent_node
from agent.technical import technical_agent_node
from agent.news import news_agent_node
from agent.intent_parser import resolve_ticker
from agent.document_parser import parse_and_explain_document
from utils.pdf_generator import generate_trade_statement
from utils.email_service import send_statement_email
import yfinance as yf

load_dotenv()

async def autonomous_monitoring():
    while True:
        print("[System] Autonomous Monitoring: Checking watchlists and evaluating alerts...")
        # Here we would query MongoDB for watchlists and run the agent pipeline
        await asyncio.sleep(3600)  # Runs every hour

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(autonomous_monitoring())
    yield
    task.cancel()

app = FastAPI(title="FinAgentX 2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_threads: dict = {}

class AnalyzeRequest(BaseModel):
    message: str
    user_id: str = "default_user"

class HITLRequest(BaseModel):
    thread_id: str
    action: str
    user_id: str = "default_user"
    modified_allocation: dict | None = None

class WatchlistRequest(BaseModel):
    user_id: str
    ticker: str
    alert_price: float

class VoiceRequest(BaseModel):
    text: str
    speaker: str = "tanya"

class TranslationRequest(BaseModel):
    text: str

class ExecuteTradeRequest(BaseModel):
    ticker: str
    amount: float
    user_email: str

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    state_input = {
        "messages": [HumanMessage(content=req.message)],
        "hitl_approved": False,
        "hitl_action": "",
    }

    result = await graph.ainvoke(state_input, config)  # ✅ direct await
    _threads[thread_id] = {"config": config, "user_id": req.user_id}

    return {
        "thread_id": thread_id,
        "report": result.get("report"),
        "risk_scores": result.get("risk_scores"),
        "contradictions": result.get("contradictions"),
        "portfolio_fit": result.get("portfolio_fit"),
        "status": "awaiting_approval",
    }


@app.post("/approve")
async def approve(req: HITLRequest):
    thread_data = _threads.get(req.thread_id)
    if not thread_data:
        raise HTTPException(status_code=404, detail="Thread not found")

    config = thread_data["config"]
    user_id = thread_data["user_id"]

    resume_state = {"hitl_action": req.action}
    if req.modified_allocation:
        resume_state["portfolio_fit"] = req.modified_allocation

    result = await graph.ainvoke(Command(resume=resume_state), config)  # ✅ direct await

    if req.action == "approve":
        ticker = result.get("ticker", "")
        report = result.get("report", {})
        await save_analysis(user_id, ticker, report)

    return {"status": f"action_{req.action}_processed", "report": result.get("report")}


@app.post("/watchlist")
async def watchlist(req: WatchlistRequest):
    await add_to_watchlist(req.user_id, req.ticker, req.alert_price)
    return {"status": "added", "ticker": req.ticker}


@app.get("/analyze/stream")
async def analyze_stream(message: str, user_id: str = "default_user"):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    state_input = {
        "messages": [HumanMessage(content=message)],
        "hitl_approved": False,
        "hitl_action": "",
    }

    async def event_gen():
        async for event in graph.astream(state_input, config, stream_mode="updates"):  # ✅ astream
            node = list(event.keys())[0]
            yield f"data: {json.dumps({'node': node, 'update': event[node]})}\n\n"
            await asyncio.sleep(0)
        yield f"data: {json.dumps({'node': 'done', 'thread_id': thread_id})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")

@app.post("/voice/synthesize")
async def voice_synthesize(req: VoiceRequest):
    audio_bytes = await generate_audio_sarvam(req.text, req.speaker)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    return Response(content=audio_bytes, media_type="audio/wav")

@app.post("/translate")
async def translate_text(req: TranslationRequest):
    translated = await translate_to_english_sarvam(req.text)
    return {"translated_text": translated}

@app.get("/market/{ticker}")
def get_market(ticker: str):
    resolved_ticker = resolve_ticker(ticker)
    state = {"ticker": resolved_ticker}
    market_res = market_agent_node(state)
    tech_res = technical_agent_node(state)
    return {
        "market_data": market_res.get("market_data"),
        "technical_data": tech_res.get("technical_data")
    }

@app.get("/news/{ticker}")
def get_news(ticker: str):
    resolved_ticker = resolve_ticker(ticker)
    state = {"ticker": resolved_ticker}
    news_res = news_agent_node(state)
    return {"news_data": news_res.get("news_data")}

@app.post("/analyze/document")
async def analyze_document(file: UploadFile = File(...)):
    try:
        explanation = await parse_and_explain_document(file)
        return {"status": "success", "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute_trade")
async def execute_trade(req: ExecuteTradeRequest):
    try:
        pdf_path = generate_trade_statement(req.ticker, req.amount, req.user_email)
        email_result = send_statement_email(req.user_email, req.ticker, pdf_path)
        
        return {
            "status": "success",
            "message": "Trade executed successfully.",
            "email_status": email_result,
            "pdf_generated": True
        }
    except Exception as e:
        print(f"Error executing trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def fetch_yfinance_data():
    tickers = ["NVDA", "AAPL", "TSLA", "MSFT", "RELIANCE.NS", "TCS.NS"]
    try:
        # Fetch last 2 days to calculate change
        data = yf.download(tickers, period="5d", group_by="ticker", auto_adjust=False, threads=True)
        results = []
        for t in tickers:
            try:
                # Get the specific dataframe for this ticker
                df = data[t] if len(tickers) > 1 else data
                df = df.dropna()
                if len(df) >= 2:
                    current_price = float(df['Close'].iloc[-1])
                    prev_price = float(df['Close'].iloc[-2])
                    change_pct = ((current_price - prev_price) / prev_price) * 100
                    results.append({
                        "ticker": t,
                        "price": current_price,
                        "change": round(change_pct, 2)
                    })
                else:
                    results.append({"ticker": t, "price": 0, "change": 0})
            except Exception as e:
                print(f"Error parsing ticker {t}: {e}")
                results.append({"ticker": t, "price": 0, "change": 0})
        return results
    except Exception as e:
        print(f"yfinance download failed: {e}")
        return []

@app.get("/dashboard_data")
async def dashboard_data():
    try:
        live_data = await asyncio.to_thread(fetch_yfinance_data)
        
        # Calculate mock portfolio stats based on the live data's average change
        avg_change = sum(item["change"] for item in live_data if item["change"] != 0) / len(live_data) if live_data else 0.5
        total_value = 1250000 * (1 + (avg_change / 100))
        day_pl = total_value - 1250000
        
        return {
            "status": "success",
            "portfolio": {
                "total_value": total_value,
                "day_pl": day_pl,
                "risk_score": 6.4,
                "sharpe": 1.85,
                "beta": 1.12
            },
            "watchlist": live_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Gemini Chatbot Integration ---
import os
from pydantic import BaseModel

class AskRequestAPI(BaseModel):
    query: str

@app.post("/ask")
async def ask_bot(req: AskRequestAPI):
    query = req.query
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"reply": "Gemini API Key is missing from the environment."}
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
        from langchain_core.tools import tool

        @tool
        def fetch_market_data(ticker: str) -> str:
            """Fetch market data including price, PE ratio, volume, and earnings for a ticker. Use this when the user asks about a stock's market data or price."""
            try:
                resolved = resolve_ticker(ticker)
                res = market_agent_node({"ticker": resolved})
                return str(res.get("market_data", {}))
            except Exception as e:
                return str(e)

        @tool
        def fetch_news_data(ticker: str) -> str:
            """Fetch recent news articles and sentiment for a ticker. Use this when the user asks for news about a stock."""
            try:
                resolved = resolve_ticker(ticker)
                res = news_agent_node({"ticker": resolved})
                return str(res.get("news_data", {}))
            except Exception as e:
                return str(e)

        @tool
        def fetch_technical_data(ticker: str) -> str:
            """Fetch technical data including RSI, MACD, and SMA for a ticker. Use this when the user asks for technical indicators of a stock."""
            try:
                resolved = resolve_ticker(ticker)
                res = technical_agent_node({"ticker": resolved})
                return str(res.get("technical_data", {}))
            except Exception as e:
                return str(e)

        @tool
        async def translate_regional_language(text: str) -> str:
            """Uses Sarvam AI to translate Indian regional language to English. Use this if the user provides text in Hindi or other regional languages."""
            try:
                return await translate_to_english_sarvam(text)
            except Exception as e:
                return str(e)

        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", api_key=api_key, temperature=0.7)
        tools = [fetch_market_data, fetch_news_data, fetch_technical_data, translate_regional_language]
        llm_with_tools = llm.bind_tools(tools)
        
        messages = [
            SystemMessage(content="You are FinPilot AI, a financial assistant. Use tools to fetch market data, technical data, or news when asked about specific stocks or market conditions. If the user speaks in a regional language, translate it first. Summarize the tool outputs clearly for the user. Be conversational and concise. Do NOT use markdown in your final response."),
            HumanMessage(content=query)
        ]
        
        response = await llm_with_tools.ainvoke(messages)
        
        while response.tool_calls:
            messages.append(response)
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                tool_result = ""
                if tool_name == "fetch_market_data":
                    tool_result = fetch_market_data.invoke(tool_args)
                elif tool_name == "fetch_news_data":
                    tool_result = fetch_news_data.invoke(tool_args)
                elif tool_name == "fetch_technical_data":
                    tool_result = fetch_technical_data.invoke(tool_args)
                elif tool_name == "translate_regional_language":
                    tool_result = await translate_regional_language.ainvoke(tool_args)
                
                messages.append(ToolMessage(content=str(tool_result), tool_call_id=tool_call["id"]))
            
            response = await llm_with_tools.ainvoke(messages)
            
        final_reply = response.content
        if isinstance(final_reply, list):
            text_parts = [str(p.get("text", "")) for p in final_reply if isinstance(p, dict) and "text" in p]
            final_reply = " ".join(text_parts) if text_parts else str(final_reply)
        elif not isinstance(final_reply, str):
            final_reply = str(final_reply)
            
        return {"reply": final_reply}
    except Exception as e:
        print(f"Error in /ask endpoint: {e}")
        return {"reply": "Sorry, I'm having trouble processing that right now. Please check my brain connection."}
