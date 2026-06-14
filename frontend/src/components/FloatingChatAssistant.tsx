"use client";

import React, { useState, useRef, useEffect } from "react";

const QUICK_ACTIONS = [
  { label: "📊 Analyze NVDA", prompt: "Can you analyze NVDA for me?" },
  { label: "💹 Portfolio Risk", prompt: "What is my current portfolio risk?" },
  { label: "🔍 Market Trends", prompt: "What are today's key market trends?" },
  { label: "⚡ Top Movers", prompt: "Show me today's top market movers." },
];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: "Hey there! I'm FinPilot AI. Ask me anything about your portfolio, or pick a quick action below.",
  timestamp: new Date(),
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

  .fp-root * {
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
  }

  /* ── FAB ── */
  .fp-fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid #00f5d4;
    cursor: pointer;
    background: #0a1628;
    box-shadow: 0 0 15px rgba(0,245,212,0.6), 0 8px 32px rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, border-color 0.2s;
    z-index: 9999;
    outline: none;
  }
  .fp-fab:hover {
    transform: scale(1.08) translateY(-2px);
    border-color: #00f5d4;
    box-shadow: 0 0 25px rgba(0,245,212,0.9), 0 12px 40px rgba(0,0,0,0.9);
  }
  .fp-fab:active { transform: scale(0.94); }
  .fp-fab-logo {
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    color: #00f5d4;
    letter-spacing: 0.05em;
    line-height: 1;
    text-shadow: 0 0 8px #00f5d4;
  }
  .fp-fab-pulse {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid rgba(0,245,212,0.6);
    animation: fp-pulse 2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes fp-pulse {
    0%, 100% { opacity: 0; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.06); }
  }

  /* ── PANEL ── */
  .fp-panel {
    position: fixed;
    bottom: 96px;
    right: 28px;
    width: 420px;
    height: 580px;
    border-radius: 16px;
    background: #06111f;
    border: 1px solid rgba(0, 245, 212, 0.15);
    box-shadow:
      0 0 0 1px rgba(0,245,212,0.06),
      0 32px 80px rgba(0,0,0,0.85),
      0 0 60px rgba(0,245,212,0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 9998;
    transform-origin: bottom right;
  }
  .fp-panel-enter { animation: fp-open 0.4s cubic-bezier(.22,1,.36,1) forwards; }
  @keyframes fp-open {
    from { opacity: 0; transform: scale(0.88) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .fp-panel-exit { animation: fp-close 0.25s cubic-bezier(.55,0,.1,1) forwards; }
  @keyframes fp-close {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to   { opacity: 0; transform: scale(0.9) translateY(12px); }
  }

  /* ── HEADER ── */
  .fp-header {
    padding: 14px 16px 12px;
    background: linear-gradient(135deg, rgba(0,245,212,0.06) 0%, rgba(0,180,255,0.03) 100%);
    border-bottom: 1px solid rgba(0,245,212,0.1);
    display: flex;
    align-items: center;
    gap: 11px;
    flex-shrink: 0;
    position: relative;
  }
  .fp-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 16px; right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,245,212,0.3), transparent);
  }
  .fp-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: #0a1628;
    border: 1px solid rgba(0,245,212,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .fp-avatar-text {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #00f5d4;
    letter-spacing: 0.03em;
  }
  .fp-header-info { flex: 1; }
  .fp-header-title {
    color: #e0f7f4;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .fp-header-sub {
    color: rgba(160,220,210,0.55);
    font-size: 11px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.02em;
  }
  .fp-status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #00f5d4;
    box-shadow: 0 0 6px #00f5d4;
    animation: fp-blink 2.2s ease-in-out infinite;
  }
  @keyframes fp-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .fp-close-btn {
    width: 28px; height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(0,245,212,0.15);
    background: rgba(0,245,212,0.04);
    color: rgba(0,245,212,0.5);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .fp-close-btn:hover {
    background: rgba(0,245,212,0.12);
    border-color: rgba(0,245,212,0.35);
    color: #00f5d4;
  }

  /* ── MESSAGES ── */
  .fp-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0,245,212,0.2) transparent;
  }
  .fp-messages::-webkit-scrollbar { width: 3px; }
  .fp-messages::-webkit-scrollbar-thumb {
    background: rgba(0,245,212,0.25);
    border-radius: 3px;
  }

  .fp-bubble-row {
    display: flex;
    gap: 8px;
    animation: fp-bubble-in 0.28s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes fp-bubble-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .fp-bubble-row.user { flex-direction: row-reverse; }

  .fp-bubble-avatar {
    width: 26px; height: 26px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    margin-top: 2px;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .fp-bubble-avatar.ai {
    background: #0a1628;
    border: 1px solid rgba(0,245,212,0.25);
    color: #00f5d4;
  }
  .fp-bubble-avatar.user-av {
    background: rgba(0,180,255,0.08);
    border: 1px solid rgba(0,180,255,0.2);
    color: #00b4ff;
  }

  .fp-bubble {
    max-width: 78%;
    padding: 9px 13px;
    font-size: 12.5px;
    line-height: 1.6;
    letter-spacing: 0.01em;
  }
  .fp-bubble.ai {
    background: rgba(0,245,212,0.04);
    border: 1px solid rgba(0,245,212,0.1);
    border-radius: 12px;
    border-bottom-left-radius: 3px;
    color: #c5e8e4;
  }
  .fp-bubble.user {
    background: rgba(0,180,255,0.07);
    border: 1px solid rgba(0,180,255,0.2);
    border-radius: 12px;
    border-bottom-right-radius: 3px;
    color: #b8dcf4;
  }

  .fp-timestamp {
    font-size: 9.5px;
    color: rgba(150,200,195,0.35);
    margin-top: 3px;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.03em;
  }
  .fp-bubble-row.user .fp-timestamp { text-align: right; }

  /* ── TYPING ── */
  .fp-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 13px;
    background: rgba(0,245,212,0.04);
    border: 1px solid rgba(0,245,212,0.1);
    border-radius: 12px;
    border-bottom-left-radius: 3px;
    width: fit-content;
  }
  .fp-dot {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: rgba(0,245,212,0.6);
    animation: fp-dot 1.2s ease-in-out infinite;
  }
  .fp-dot:nth-child(2) { animation-delay: 0.2s; }
  .fp-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes fp-dot {
    0%,80%,100% { transform: scale(1); opacity: 0.4; }
    40% { transform: scale(1.5); opacity: 1; }
  }

  /* ── QUICK ACTIONS ── */
  .fp-actions {
    padding: 8px 14px 6px;
    border-top: 1px solid rgba(0,245,212,0.07);
    animation: fp-bubble-in 0.3s 0.1s both;
  }
  .fp-actions-label {
    font-size: 9.5px;
    color: rgba(0,245,212,0.5);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
    margin-bottom: 7px;
  }
  .fp-action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }
  .fp-action-btn {
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid rgba(0,245,212,0.12);
    background: rgba(0,245,212,0.03);
    color: rgba(160,220,210,0.75);
    font-size: 11.5px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s;
    line-height: 1.3;
  }
  .fp-action-btn:hover {
    background: rgba(0,245,212,0.08);
    border-color: rgba(0,245,212,0.3);
    color: #a8ede6;
    transform: translateY(-1px);
  }
  .fp-action-btn:active { transform: translateY(0); }

  /* ── INPUT AREA ── */
  .fp-input-area {
    padding: 10px 14px 14px;
    border-top: 1px solid rgba(0,245,212,0.08);
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
    background: rgba(0,10,20,0.3);
  }
  .fp-input {
    flex: 1;
    background: rgba(0,245,212,0.03);
    border: 1px solid rgba(0,245,212,0.12);
    border-radius: 10px;
    padding: 9px 13px;
    color: #c5e8e4;
    font-size: 12.5px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    caret-color: #00f5d4;
  }
  .fp-input::placeholder { color: rgba(0,245,212,0.25); }
  .fp-input:focus {
    border-color: rgba(0,245,212,0.35);
    background: rgba(0,245,212,0.05);
  }
  .fp-input:disabled { opacity: 0.5; }

  .fp-send-btn {
    width: 34px; height: 34px;
    border-radius: 9px;
    border: 1px solid rgba(0,245,212,0.3);
    background: rgba(0,245,212,0.1);
    color: #00f5d4;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s, transform 0.12s, box-shadow 0.15s;
    flex-shrink: 0;
  }
  .fp-send-btn:hover:not(:disabled) {
    background: rgba(0,245,212,0.18);
    border-color: rgba(0,245,212,0.55);
    transform: scale(1.06);
    box-shadow: 0 0 14px rgba(0,245,212,0.2);
  }
  .fp-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── SCAN LINE (ambient) ── */
  .fp-scanline {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(0,245,212,0.4) 50%, transparent 100%);
    animation: fp-scan 3s linear infinite;
    pointer-events: none;
  }
  @keyframes fp-scan {
    0%   { top: 0%; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
`;

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FloatingChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 450);
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 280);
  };

  const sendMessage = async (text?: string) => {
    const query = text ?? input;
    if (!query.trim() || isLoading) return;
    setShowActions(false);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      const reply = typeof data === "string" ? data : data?.reply || "No response received.";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Unable to reach server. Check your connection.", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const panelClass = `fp-panel ${
    isOpen && !isAnimating ? "" : isOpen ? "fp-panel-enter" : "fp-panel-exit"
  }`;

  return (
    <>
      <style>{styles}</style>
      <div className="fp-root">

        {/* ── CHAT PANEL ── */}
        {(isOpen || isAnimating) && (
          <div className={panelClass} style={{ position: "fixed" }}>
            {/* Ambient scan line */}
            <div className="fp-scanline" />

            {/* Header */}
            <div className="fp-header">
              <div className="fp-avatar">
                <span className="fp-avatar-text">FP</span>
              </div>
              <div className="fp-header-info">
                <div className="fp-header-title">FinPilot AI</div>
                <div className="fp-header-sub">
                  <span className="fp-status-dot" />
                  ONLINE · MARKET ANALYST
                </div>
              </div>
              <button className="fp-close-btn" onClick={handleClose} aria-label="Close">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="fp-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`fp-bubble-row ${msg.role === "user" ? "user" : ""}`}>
                  <div className={`fp-bubble-avatar ${msg.role === "user" ? "user-av" : "ai"}`}>
                    {msg.role === "user" ? "U" : "AI"}
                  </div>
                  <div>
                    <div className={`fp-bubble ${msg.role === "user" ? "user" : "ai"}`}>
                      {msg.content}
                    </div>
                    <div className="fp-timestamp">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="fp-bubble-row">
                  <div className="fp-bubble-avatar ai">AI</div>
                  <div className="fp-typing">
                    <div className="fp-dot" />
                    <div className="fp-dot" />
                    <div className="fp-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {showActions && (
              <div className="fp-actions">
                <div className="fp-actions-label">Quick Actions</div>
                <div className="fp-action-grid">
                  {QUICK_ACTIONS.map((a) => (
                    <button key={a.label} className="fp-action-btn" onClick={() => sendMessage(a.prompt)}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="fp-input-area">
              <input
                ref={inputRef}
                className="fp-input"
                placeholder="Ask about your portfolio…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                className="fp-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 7L1.5 1.5l2 5.5-2 5.5L12.5 7z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── FAB ── */}
        <button
          className="fp-fab"
          onClick={isOpen ? handleClose : handleOpen}
          aria-label="Toggle FinPilot AI"
        >
          <div className="fp-fab-pulse" />
          {isOpen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="#00f5d4" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="fp-fab-logo">FP</span>
          )}
        </button>

      </div>
    </>
  );
}
