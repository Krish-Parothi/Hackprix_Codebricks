from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
        _db = _client["finagentx"]
    return _db

async def get_user_profile(user_id: str) -> dict:
    db = get_db()
    doc = await db.users.find_one({"user_id": user_id})
    return doc or {"user_id": user_id, "holdings": [], "goals": "growth", "watchlist": []}

async def save_analysis(user_id: str, ticker: str, report: dict):
    db = get_db()
    await db.analyses.insert_one({
        "user_id": user_id,
        "ticker": ticker,
        "report": report,
        "created_at": datetime.utcnow(),
    })

async def get_past_analysis(user_id: str, ticker: str) -> dict | None:
    db = get_db()
    return await db.analyses.find_one(
        {"user_id": user_id, "ticker": ticker},
        sort=[("created_at", -1)]
    )

async def add_to_watchlist(user_id: str, ticker: str, alert_price: float):
    db = get_db()
    await db.users.update_one(
        {"user_id": user_id},
        {"$addToSet": {"watchlist": {"ticker": ticker, "alert_price": alert_price}}},
        upsert=True
    )