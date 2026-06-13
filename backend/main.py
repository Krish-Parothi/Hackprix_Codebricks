from fastapi import FastAPI, HTTPException
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
from agent.voice import translate_to_english_sarvam, generate_audio_elevenlabs

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

class TranslationRequest(BaseModel):
    text: str


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
    audio_bytes = await generate_audio_elevenlabs(req.text)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    return Response(content=audio_bytes, media_type="audio/mpeg")

@app.post("/translate")
async def translate_text(req: TranslationRequest):
    translated = await translate_to_english_sarvam(req.text)
    return {"translated_text": translated}