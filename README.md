# 🚀 FinPilot AI (FinAgentX 2.0)

<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue.svg" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-green.svg" alt="Backend" />
  <img src="https://img.shields.io/badge/AI-LangGraph%20%7C%20Gemini%20%7C%20Groq-orange.svg" alt="AI" />
</div>

<br />

**FinPilot AI** (built for Hackprix) is a state-of-the-art, multi-agent financial advisory platform. It acts as your personal AI boardroom—complete with debating AI agents, autonomous market monitoring, and a fully conversational assistant powered by Google's latest Gemini models. 

Forget simple chatbots. FinPilot features an advanced **LangGraph-powered pipeline** where multiple specialized agents (Market, Technical, News, RAG, Bull, and Bear) aggregate data, detect contradictions, debate stock sentiment, and present you with human-in-the-loop (HITL) verified trade recommendations.

## ✨ Key Features

### 🧠 Advanced Multi-Agent Boardroom (LangGraph)
- **Specialized Agents:** Separate autonomous nodes for intent parsing, market data, technical indicators (RSI, MACD, SMA), and real-time news scraping.
- **Bull vs. Bear Debate:** An innovative debate system where agents argue bullish and bearish perspectives before synthesizing a final report.
- **Risk Quantification:** Analyzes technical data and market conditions to calculate customized portfolio fit and risk scores.

### 💬 Floating Gemini Chat Assistant
- **Context-Aware Interactions:** Talk to your portfolio using an elegant, floating chat assistant powered by `Gemini`.
- **Autonomous Tool Fetching:** The assistant is bound to multiple tools, fetching live data from **Alpha Vantage**, **News API**, and **YFinance** seamlessly during conversations.

### 🌍 Global & Regional Accessibility
- **Sarvam AI Integration:** Automatically translates Indian regional languages to English, bridging the language gap for financial advice.
- **AI Voice Synthesis:** Leverages **ElevenLabs** and **Sarvam** for incredibly natural Text-To-Speech (TTS) generation. 

### 📈 Comprehensive Dashboard & Monitoring
- **Live Watchlists:** Setup price alerts and let the system run `Autonomous Monitoring` in the background.
- **Automated Trade Statements:** Executes trades, generates PDF trade statements using `fpdf2`, and dispatches emails via SMTP.
- **Real-Time Data:** Powered by `yfinance`, `pandas-ta`, and `chromadb` for vector storage and market tracking.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js & Vite:** Extremely fast, modern UI.
- **Component Architecture:** Rich dashboards, live debate panels, and interactive portfolio screens.
- **Styling:** Custom CSS with immersive, dark-themed aesthetics and smooth micro-animations.

### **Backend**
- **FastAPI:** High-performance, asynchronous Python backend.
- **LangChain & LangGraph:** Complex state-machine based multi-agent architecture.
- **MongoDB:** Robust persistent storage for users, watchlists, and thread memory.

### **AI & Data Providers**
- **Google GenAI (Gemini):** Core reasoning engine for the conversational assistant.
- **Groq (Llama 3.3 70B):** Lightning-fast inference for market and news summarization.
- **ProsusAI FinBERT:** Specialized sentiment analysis model on financial news.
- **Alpha Vantage & YFinance:** Accurate, real-time market data and earnings.
- **Sarvam AI & ElevenLabs:** NLP translations and high-fidelity speech synthesis.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.12+)
- MongoDB connection

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krish-Parothi/Hackprix_Codebricks.git
   cd Hackprix_Codebricks
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   pip install -r requirements.txt # Or install using uv based on uv.lock
   ```

3. **Environment Variables:**
   Create a `.env` file in the `backend` and root directories. Add your API keys:
   ```env
   GROQ_API_KEY=your_key
   NEWS_API_KEY=your_key
   SARVAM_API_KEY=your_key
   ALPHA_VANTAGE_KEY=your_key
   GEMINI_API_KEY=your_key
   SMTP_EMAIL=your_email
   SMTP_PASSWORD=your_password
   ```

4. **Run the Backend Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Run the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🎯 Architecture Diagram

1. **User Request** → Floating Chat / Analyze Dashboard
2. **Intent Parser Node** → Routes request to active agents
3. **Parallel Fetching** → Market Data (Alpha Vantage), News (NewsAPI), Technicals (Pandas-TA)
4. **Aggregator & Contradiction Detector** → Flags opposing data points
5. **Debate Node** → Bull and Bear agents argue their cases using Groq's fast LLMs
6. **Synthesis** → Final report is sent to the user for Human-In-The-Loop (HITL) approval
7. **Execution** → Trade executed, PDF generated, and email sent

---
<p align="center">
  <i>Built with ❤️ for Hackprix.</i>
</p>
