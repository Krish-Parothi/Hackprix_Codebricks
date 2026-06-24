import requests, os, json
from transformers import pipeline
from graphs.state import AgentState
from datetime import datetime
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

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
            f"&sortBy=publishedAt&pageSize=10&language=en&apiKey={NEWS_KEY}"
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
        
        try:
            llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"))
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are the News Crawler AI. Summarize this news data (headlines and aggregate sentiment) into 2 natural, conversational sentences as if you are speaking in a boardroom. Do not use markdown or greetings."),
                ("human", "{data}")
            ])
            # Only send titles to LLM to save tokens
            news_summary_data = {"aggregate_sentiment": agg, "articles": [a["title"] for a in scored]}
            news_data["speech_text"] = (prompt | llm).invoke({"data": json.dumps(news_summary_data)}).content
        except Exception as e:
            news_data["speech_text"] = None
            
    except Exception as e:
        news_data = {"error": str(e)}

    return {"news_data": news_data}