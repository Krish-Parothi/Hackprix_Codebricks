from graphs.state import AgentState

def rag_agent_node(state: AgentState) -> AgentState:
    # For the hackathon demo, we simulate the RAG process reading from a Vector DB.
    # In a real scenario, you'd use ChromaDB/Pinecone to fetch chunks from annual reports.
    ticker = state.get("ticker", "UNKNOWN")
    
    # Mock RAG data
    mock_rag_data = {
        "filing_age_days": 12,
        "key_insights": [
            f"{ticker} management highlighted strong AI infrastructure demand in the latest earnings call.",
            "Supply chain constraints were mentioned as a minor headwind for the next quarter.",
            "R&D expenditure increased by 14% year-over-year, indicating aggressive growth focus."
        ]
    }
    
    return {"rag_data": mock_rag_data}
