import requests, os
from transformers import pipeline
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
NEWS_KEY = os.getenv("NEWS_API_KEY")
_sentiment = None

def get_sentiment_pipeline():
    global _sentiment
    if _sentiment is None:
        _sentiment = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            top_k=1
        )
    return _sentiment

def news_agent_node(state: AgentState) -> AgentState:
    ticker = state["ticker"]
    try:
        url = (
            f"https://newsapi.org/v2/everything?q={ticker}"
            f"&sortBy=publishedAt&pageSize=10&apiKey={NEWS_KEY}"
        )
        articles = requests.get(url, timeout=10).json().get("articles", [])[:5]
        pipe = get_sentiment_pipeline()

        scored = []
        for a in articles:
            text = f"{a.get('title','')}. {a.get('description','')}"[:512]
            result = pipe(text)[0][0]
            scored.append({
                "title": a.get("title"),
                "source": a.get("source", {}).get("name"),
                "date": a.get("publishedAt"),
                "sentiment": result["label"],
                "score": round(result["score"], 3),
                "url": a.get("url"),
            })

        labels = [s["sentiment"] for s in scored]
        agg = max(set(labels), key=labels.count) if labels else "neutral"

        news_data = {
            "articles": scored,
            "aggregate_sentiment": agg,
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        news_data = {"error": str(e)}

    return {"news_data": news_data}