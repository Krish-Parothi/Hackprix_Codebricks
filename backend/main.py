from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from graphs.pipeline import graph
from memory.mongo import save_analysis, add_to_watchlist
import json, uuid, asyncio
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="FinAgentX 2.0")

# In-memory thread store (swap for Redis in prod)
_threads: dict = {}

class AnalyzeRequest(BaseModel):
    message: str
    user_id: str = "default_user"

class HITLRequest(BaseModel):
    thread_id: str
    action: str          # approve | modify | reject
    user_id: str = "default_user"
    modified_allocation: dict | None = None

class WatchlistRequest(BaseModel):
    user_id: str
    ticker: str
    alert_price: float


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

    # Run until HITL interrupt
    result = await asyncio.to_thread(
        graph.invoke, state_input, config
    )
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

    result = await asyncio.to_thread(
        graph.invoke,
        Command(resume=resume_state),
        config
    )

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
    """SSE streaming endpoint"""
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    state_input = {
        "messages": [HumanMessage(content=message)],
        "hitl_approved": False,
        "hitl_action": "",
    }

    async def event_gen():
        for event in graph.stream(state_input, config, stream_mode="updates"):
            node = list(event.keys())[0]
            yield f"data: {json.dumps({'node': node, 'update': event[node]})}\n\n"
            await asyncio.sleep(0)
        yield f"data: {json.dumps({'node': 'done', 'thread_id': thread_id})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")