import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, RotateCcw, AlertTriangle, ExternalLink, HelpCircle, ShieldAlert, Cpu, BarChart2, MessageSquare, Shield, Activity } from 'lucide-react';

interface BoardroomScreenProps {
  ticker: string;
  onVerdictReached: (verdict: 'BUY' | 'HOLD' | 'SELL', confidence: number, factors: { name: string; score: number }[], summary: string, threadId: string) => void;
  onSwitchToMonitoring: () => void;
  onBackToLanding: () => void;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  angle: number; // For rendering around table
}

export const BoardroomScreen: React.FC<BoardroomScreenProps> = ({
  ticker,
  onVerdictReached,
  onSwitchToMonitoring,
  onBackToLanding
}) => {
  // Live SSE state machine
  const [isPlaying, setIsPlaying] = useState(true);
  const [speakerId, setSpeakerId] = useState<string | null>('chair');
  const [displayedText, setDisplayedText] = useState('Welcome. Initializing data stream from FinAgentX...');
  const [deliberationProgress, setDeliberationProgress] = useState(0);

  // Evidence Wall Data (live updates)
  const [evidenceData, setEvidenceData] = useState({
    price: '-', change: '-', isPositive: true, volume: '-', peRatio: '-', rsi: '-', macd: '-', ema: '-', volatility: '-', riskScore: '-', drawdown: '-'
  });
  const [newsFeed, setNewsFeed] = useState<string[]>([]);
  
  const [activeAgentStatuses, setActiveAgentStatuses] = useState<Record<string, string>>({
    chair: 'Awaiting connections...', market: 'Standby', news: 'Standby', sentiment: 'Standby', risk: 'Standby', bull: 'Standby', bear: 'Standby'
  });

  // Reference for storing the final report before firing the callback
  const finalReportRef = useRef<any>(null);

  // Agents specification (7 agents seated at coordinates)
  const agents: Agent[] = [
    { id: 'chair', name: 'Chairperson AI', role: 'Deliberation Lead', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80', status: 'Active', angle: 0 },
    { id: 'market', name: 'Market Analyst', role: 'Technical signals', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 51.4 },
    { id: 'news', name: 'News Crawler', role: 'Context & NLP', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 102.8 },
    { id: 'sentiment', name: 'Sentiment Engine', role: 'Momentum crawler', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 154.2 },
    { id: 'risk', name: 'Risk Assessment', role: 'Drawdown evaluator', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 205.6 },
    { id: 'bull', name: 'Bull Advisor', role: 'Growth perspective', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 257.0 },
    { id: 'bear', name: 'Bear Advisor', role: 'Systemic risk assessment', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80', status: 'Standby', angle: 308.4 }
  ];

  // The live SSE connection loop
  useEffect(() => {
    if (!isPlaying) return;

    // Use URL query parameters properly encoded
    const encodedMessage = encodeURIComponent(`Analyze ${ticker}`);
    const eventSource = new EventSource(`/api/analyze/stream?message=${encodedMessage}&user_id=demo_user`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const node = data.node;
        const update = data.update || {};

        if (node === 'market') {
          setSpeakerId('market');
          setActiveAgentStatuses(p => ({ ...p, market: 'Fetching price & fundamentals...' }));
          setDisplayedText('Market Analyst: Fetching historical price data and volume metrics...');
          if (update.market_data && !update.market_data.error) {
             const mData = update.market_data;
             const priceStr = typeof mData.price === 'number' ? `$${mData.price.toFixed(2)}` : `$${mData.price || '-'}`;
             const dayChange = typeof mData.day_change === 'number' ? mData.day_change : 0;
             const changeStr = `${dayChange > 0 ? '+' : ''}${dayChange.toFixed(2)}%`;
             
             setEvidenceData(p => ({
               ...p,
               price: priceStr,
               peRatio: String(mData.pe_ratio || '-'),
               change: changeStr,
               isPositive: dayChange >= 0,
               volume: mData.formatted_volume || '-'
             }));
          }
        } else if (node === 'technical') {
          setSpeakerId('market');
          setActiveAgentStatuses(p => ({ ...p, market: 'Calculating technical indicators...' }));
          setDisplayedText('Market Analyst: Technical analysis complete. RSI and MACD signals generated.');
          if (update.technical_data && !update.technical_data.error) {
             const tData = update.technical_data;
             const rsiFormatted = typeof tData.rsi === 'number' ? tData.rsi.toFixed(1) : String(tData.rsi || '-');
             setEvidenceData(p => ({
               ...p,
               rsi: rsiFormatted,
               macd: tData.macd_signal || '-',
               ema: tData.trend || '-'
             }));
          }
        } else if (node === 'news') {
          setSpeakerId('news');
          setActiveAgentStatuses(p => ({ ...p, market: 'Done', news: 'Parsing articles...' }));
          setDisplayedText('News Crawler: Scanning global financial news and sentiment streams.');
          if (update.news_data && update.news_data.articles) {
             setNewsFeed(update.news_data.articles.map((a:any) => a.title).slice(0, 4));
          }
        } else if (node === 'rag') {
          setSpeakerId('sentiment');
          setActiveAgentStatuses(p => ({ ...p, news: 'Done', sentiment: 'Scanning internal docs...' }));
          setDisplayedText('Sentiment Engine: Querying internal knowledge base and earnings transcripts.');
        } else if (node === 'contradiction_detector' || node === 'risk_quantification') {
          setSpeakerId('risk');
          setActiveAgentStatuses(p => ({ ...p, sentiment: 'Done', risk: 'Running models...' }));
          setDisplayedText('Risk Assessment: Evaluating systemic risk limits and VaR metrics.');
          if (update.risk_scores) {
             setEvidenceData(p => ({
               ...p,
               riskScore: `${update.risk_scores.risk_score}/10`
             }));
          }
        } else if (node === 'bull_agent') {
          setSpeakerId('bull');
          setActiveAgentStatuses(p => ({ ...p, risk: 'Done', bull: 'Formulating thesis...' }));
          setDisplayedText('Bull Advisor: ' + (update.bull_thesis || 'Identifying upside catalysts...'));
        } else if (node === 'bear_agent') {
          setSpeakerId('bear');
          setActiveAgentStatuses(p => ({ ...p, bull: 'Done', bear: 'Stress testing...' }));
          setDisplayedText('Bear Advisor: ' + (update.bear_thesis || 'Identifying structural weaknesses...'));
        } else if (node === 'report_synthesis') {
          setSpeakerId('chair');
          setActiveAgentStatuses(p => ({ ...p, bear: 'Done', chair: 'Synthesizing...' }));
          setDisplayedText('Chairperson AI: Synthesizing committee findings and drafting final verdict...');
          setDeliberationProgress(1); // triggers synthesis animation
          
          if (update.report) {
            finalReportRef.current = update.report;
          }
        } else if (node === 'done') {
          eventSource.close();
          const threadId = data.thread_id;
          const report = finalReportRef.current;
          
          if (report) {
            let rec: 'BUY'|'HOLD'|'SELL' = 'BUY';
            if (report.recommendation?.includes('HOLD')) rec = 'HOLD';
            if (report.recommendation?.includes('SELL') || report.recommendation?.includes('AVOID')) rec = 'SELL';
            
            const conf = Math.round((report.signal_score || 5) * 10);
            const factors = (report.pros || []).map((p:string) => ({name: p.slice(0,35), score: 10})).concat(
              (report.cons || []).map((c:string) => ({name: c.slice(0,35), score: -10}))
            ).slice(0, 4); // Only show top 4
            
            const summary = report.resolution || "Consensus reached.";
            
            // Wait a tiny bit for the UI animation
            setTimeout(() => {
              onVerdictReached(rec, conf, factors, summary, threadId);
            }, 1500);
          }
        }
      } catch (err) {
        console.error("SSE Parse Error", err);
      }
    };

    eventSource.onerror = () => {
      console.log("EventSource Error or Closed");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isPlaying, ticker, onVerdictReached]);

  return (
    <div className="boardroom-layout-grid">
      {/* Glow Backdrops */}
      <div className="glow-bg primary" style={{ top: '15%', left: '25%', opacity: speakerId === 'bull' ? 0.25 : speakerId === 'bear' ? 0.05 : 0.12 }} />
      <div className="glow-bg secondary" style={{ bottom: '15%', right: '25%', opacity: speakerId === 'bear' ? 0.25 : speakerId === 'bull' ? 0.05 : 0.12 }} />

      {/* Header bar */}
      <div className="glass-panel" style={{
        gridColumn: '1 / span 3',
        borderRadius: 0,
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        {/* Back and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBackToLanding}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
          >
            DISCONNECT
          </button>
          <div>
            <h2 style={{ fontSize: '9px', fontFamily: 'var(--font-display)', color: 'var(--primary)', letterSpacing: '2.5px' }}>
              INVESTMENT COMMITTEE SESSION
            </h2>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              Subject: <span style={{ color: 'var(--primary)' }}>{ticker} Corporation</span>
            </h1>
          </div>
        </div>

        {/* Meeting ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>MEETING ID</span>
            <p style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>#AI-2026-001</p>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)' }} />
          <button
            onClick={onSwitchToMonitoring}
            style={{
              background: 'rgba(0, 212, 255, 0.05)',
              border: '1px solid var(--border-cyan)',
              color: 'var(--primary)',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 10px var(--primary-glow)';
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
            }}
          >
            <Activity size={12} />
            WATCHLIST MONITOR
          </button>
        </div>
      </div>

      {/* Left Sidebar: Session Control & Logs */}
      <div className="glass-panel" style={{
        margin: '20px 0 20px 20px',
        border: '1px solid var(--border-glass)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        zIndex: 5
      }}>
        {/* Playback controls */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ fontSize: '9px', fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '15px', letterSpacing: '1px' }}>
            BOARDROOM PROTOCOL
          </h3>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                flex: 1,
                padding: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '11px'
              }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            <button
              onClick={onBackToLanding}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px'
              }}
              title="Reset Session"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Panelist Status Feed */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ fontSize: '9px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            PANEL SEATS STATUS
          </h4>
          {agents.map((agent) => {
            const isSpeaking = speakerId === agent.id;
            const status = activeAgentStatuses[agent.id as keyof typeof activeAgentStatuses] || agent.status;
            return (
              <div key={agent.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: isSpeaking ? 1 : 0.6,
                transform: isSpeaking ? 'translateX(4px)' : 'translateX(0)',
                transition: 'all 0.3s'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSpeaking ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isSpeaking ? '0 0 10px var(--primary-glow)' : 'none'
                    }}
                  />
                  {isSpeaking && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '1.5px solid var(--bg-medium)'
                    }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 600, color: isSpeaking ? 'var(--primary)' : '#fff' }}>{agent.name}</h5>
                    {isSpeaking && (
                      <div className="typing-indicator" style={{ display: 'flex', gap: '3px' }}>
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Section: Circular Table Boardroom */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Spotlight overlay behind active speakers */}
        {speakerId === 'bull' && <div className="spotlight bull active" style={{ left: '20%', top: '10%' }} />}
        {speakerId === 'bear' && <div className="spotlight bear active" style={{ right: '20%', top: '10%' }} />}

        <div className="boardroom-table-container">
          <div className="boardroom-table-projection">
            {/* Concentric table rings */}
            <div className="table-glow-ring outer" />
            <div className="table-glow-ring inner" />

            {/* Central core */}
            <div className={`table-glow-ring center-core ${deliberationProgress > 0 ? 'deliberating' : ''}`}>
              {deliberationProgress > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--warning)', letterSpacing: '1px' }}>
                    SYNTHESIZING
                  </span>
                  <div style={{
                    width: '40px',
                    height: '2px',
                    background: 'rgba(255, 209, 102, 0.2)',
                    marginTop: '4px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      width: '60%',
                      height: '100%',
                      background: 'var(--warning)',
                      animation: 'flow 1s linear infinite'
                    }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Cpu size={24} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 4px var(--primary))', animation: 'heartbeat 2s infinite ease-in-out' }} />
                  <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.5px' }}>
                    DECISION CORE
                  </span>
                </div>
              )}
            </div>

            {/* SVG Data lines pulsing to center */}
            <svg className="data-stream-svg" viewBox="0 0 580 480">
              {agents.map((agent, index) => {
                // Compute seat coordinates
                const angle = (agent.angle * Math.PI) / 180 - Math.PI / 2;
                const x = 290 + 200 * Math.cos(angle);
                const y = 240 + 140 * Math.sin(angle);
                const isSpeaking = speakerId === agent.id;

                return (
                  <g key={agent.id}>
                    {/* Connection line */}
                    <line
                      x1={x}
                      y1={y}
                      x2={290}
                      y2={240}
                      stroke={isSpeaking ? 'var(--primary)' : 'rgba(0, 212, 255, 0.1)'}
                      strokeWidth={isSpeaking ? '1.5' : '0.5'}
                      strokeDasharray={isSpeaking ? '5,5' : 'none'}
                    />
                    {isSpeaking && (
                      <circle
                        cx={290}
                        cy={240}
                        r="3"
                        fill="var(--primary)"
                        className="pulse-line"
                        style={{
                          animation: 'flow 1.5s linear infinite',
                          motionPath: `path('M ${x} ${y} L 290 240')`
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Agent Seats placed around the elliptical table */}
            {agents.map((agent) => {
              const angle = (agent.angle * Math.PI) / 180 - Math.PI / 2;
              const x = 290 + 200 * Math.cos(angle);
              const y = 240 + 140 * Math.sin(angle);
              const isSpeaking = speakerId === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`agent-seat ${isSpeaking ? 'active' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                  }}
                >
                  <div className="agent-avatar-container">
                    <img src={agent.avatar} alt={agent.name} className="agent-avatar" />
                    <div className="agent-status-ring" />
                    {isSpeaking && (
                      <div className="speaking-wave">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </div>
                  <div className="agent-role-tag">{agent.role}</div>
                  <div className="agent-status-text">
                    {activeAgentStatuses[agent.id as keyof typeof activeAgentStatuses] || agent.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Conversation Transcript Speech Bubble at bottom */}
        {speakerId && (
          <div className="glass-panel dialogue-bubble" style={{
            background: 'rgba(8, 12, 28, 0.95)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
          }}>
            <div style={{ position: 'relative' }}>
              <img
                src={agents.find(a => a.id === speakerId)?.avatar}
                alt="Speaker"
                style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1.5px solid var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                  {agents.find(a => a.id === speakerId)?.name}
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {agents.find(a => a.id === speakerId)?.role.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#fff', lineHeight: '1.5', fontFamily: 'var(--font-sans)', minHeight: '40px' }}>
                {displayedText}
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '12px',
                  background: 'var(--primary)',
                  marginLeft: '4px',
                  animation: 'scanline 1s infinite alternate',
                  verticalAlign: 'middle'
                }} />
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Evidence Wall */}
      <div className="glass-panel" style={{
        margin: '20px 20px 20px 0',
        border: '1px solid var(--border-glass)',
        padding: '20px',
        display: 'grid',
        gridTemplateRows: 'auto auto auto 1fr',
        gap: '20px',
        overflow: 'hidden',
        zIndex: 5
      }}>
        {/* Panel Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
          <BarChart2 size={16} color="var(--primary)" />
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-display)', color: 'var(--primary)', letterSpacing: '1px' }}>
            EVIDENCE INTELLIGENCE WALL
          </span>
        </div>

        {/* Market Data */}
        <div>
          <h4 style={{ fontSize: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            MARKET DATA OVERVIEW
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>PRICE</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{evidenceData.price}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>DAILY CHANGE</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: evidenceData.isPositive ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{evidenceData.change}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>VOLUME</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{evidenceData.volume}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>P/E RATIO</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>{evidenceData.peRatio}</span>
            </div>
          </div>
        </div>

        {/* Technical and Risk Gauges */}
        <div>
          <h4 style={{ fontSize: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            TECHNICAL & RISK GAUGES
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>RSI (14)</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{evidenceData.rsi}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>EMA SIGNAL</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{evidenceData.ema}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>MACD LEVEL</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{evidenceData.macd}</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>PORTFOLIO BETA</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>1.15</span>
            </div>
          </div>
        </div>

        {/* Live News Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h4 style={{ fontSize: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            CONTEXT NEWS STREAM
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {newsFeed.map((news, idx) => (
              <div key={idx} style={{
                padding: '10px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                fontSize: '11px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)'
              }}>
                {news}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
