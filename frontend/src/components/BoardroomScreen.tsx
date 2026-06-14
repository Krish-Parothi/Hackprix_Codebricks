import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Pause, Activity, Database, TrendingUp, AlertTriangle, MessageSquare, Zap, X } from 'lucide-react';

interface BoardroomScreenProps {
  ticker: string;
  onVerdictReached: (verdict: 'BUY' | 'HOLD' | 'SELL', confidence: number, factors: { name: string; score: number }[], summary: string, threadId: string) => void;
  onSwitchToMonitoring: () => void;
  onBackToLanding: () => void;
}

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  color: string;
  status: 'STANDBY' | 'ACTIVE' | 'SPEAKING';
  avatar: string;
}

const initialAgents: AgentStatus[] = [
  { id: 'chair', name: 'Chairperson AI', role: 'Deliberation Lead', color: 'var(--primary)', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' },
  { id: 'market', name: 'Market Analyst', role: 'Fundamental Data', color: '#3b82f6', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'technical', name: 'Technical', role: 'Signals & Trend', color: '#8b5cf6', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=150&q=80' },
  { id: 'news', name: 'News Crawler', role: 'Global Sentiment', color: '#f59e0b', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
  { id: 'sentiment', name: 'Context & NLP', role: 'Text Analytics', color: '#10b981', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'risk', name: 'Systemic Risk', role: 'Drawdown Evaluator', color: '#ef4444', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
  { id: 'bull', name: 'Bull Advisor', role: 'Growth Perspective', color: '#22c55e', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80' },
  { id: 'bear', name: 'Bear Advisor', role: 'Risk Perspective', color: '#f97316', status: 'STANDBY', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' }
];

export const BoardroomScreen: React.FC<BoardroomScreenProps> = ({ ticker, onVerdictReached, onSwitchToMonitoring, onBackToLanding }) => {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [displayedText, setDisplayedText] = useState('Awaiting command to initiate sequence...');
  const [isDebating, setIsDebating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [newsFeed, setNewsFeed] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(ticker);
  const [activeTicker, setActiveTicker] = useState(ticker);
  const eventSourceRef = useRef<EventSource | null>(null);

  const playbackQueueRef = useRef<any[]>([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const doneDataRef = useRef<any | null>(null);
  const finalReportRef = useRef<any | null>(null);

  const [evidenceData, setEvidenceData] = useState({
    price: '-', change: '-', isPositive: true, volume: '-', peRatio: '-', rsi: 50, macd: '-', ema: '-', beta: 1.15
  });

  const fetchEvidenceData = async (targetTicker: string) => {
    if (!targetTicker) return;
    setDisplayedText(`Fetching market intelligence for ${targetTicker}...`);
    try {
      const marketRes = await fetch(`/api/market/${targetTicker}`);
      const marketData = await marketRes.json();

      if (marketData.market_data) {
        const md = marketData.market_data;
        const priceStr = typeof md.price === 'number' ? md.price.toFixed(2) : md.price || '0';
        const dayChange = typeof md.day_change === 'number' ? md.day_change : 0;
        setEvidenceData(p => ({
          ...p,
          price: priceStr,
          change: `${dayChange > 0 ? '+' : ''}${dayChange.toFixed(2)}`,
          isPositive: dayChange >= 0,
          volume: md.formatted_volume || '-',
          peRatio: md.pe_ratio?.toString() || '-'
        }));
      }
      if (marketData.technical_data) {
        const ts = marketData.technical_data;
        setEvidenceData(p => ({
          ...p, rsi: ts.rsi || 50, macd: ts.macd_signal || '-', ema: ts.trend || ts.ema_signal || '-'
        }));
      }

      const newsRes = await fetch(`/api/news/${targetTicker}`);
      const newsData = await newsRes.json();
      if (newsData.news_data?.articles) {
        setNewsFeed(newsData.news_data.articles.map((a: any) => a.title).slice(0, 4));
      }

      setDisplayedText(`Telemetry acquired for ${targetTicker}. Awaiting START DEBATE command.`);
      setActiveTicker(targetTicker);
    } catch (e) {
      setDisplayedText(`Error fetching data for ${targetTicker}. Backend may be offline.`);
      console.error(e);
    }
  };

  const resetSession = () => {
    if (hasStarted || isDebating) {
      setHasStarted(false);
      setIsDebating(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      playbackQueueRef.current = [];
      isPlayingRef.current = false;
      doneDataRef.current = null;
      finalReportRef.current = null;
      setDisplayedText('Session interrupted. Ready for new ticker.');
      setAgents(prev => prev.map(a => ({ ...a, status: 'STANDBY' })));
    }
  };

  const toggleSession = () => {
    if (isDebating) {
      // Pause
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsDebating(false);
      setDisplayedText('Session paused by user.');
      setAgents(prev => prev.map(a => ({ ...a, status: 'STANDBY' })));
    } else {
      // Start / Resume
      const targetTicker = inputValue.trim().toUpperCase() || activeTicker;
      if (!targetTicker) {
        setDisplayedText('Error: No ticker symbol provided.');
        return;
      }
      setActiveTicker(targetTicker);
      setIsDebating(true);
      setHasStarted(true);
      setDisplayedText(`Initiating secure connection to FinAgentX Backend for ${targetTicker}...`);
      setAgents(prev => prev.map(a => ({ ...a, status: 'STANDBY' })));

      const encodedMessage = encodeURIComponent(`Analyze ${targetTicker}`);
      const es = new EventSource(`/api/analyze/stream?message=${encodedMessage}`);
      eventSourceRef.current = es;

      const processQueue = async () => {
        if (isPlayingRef.current || playbackQueueRef.current.length === 0) {
          if (playbackQueueRef.current.length === 0 && !isPlayingRef.current && doneDataRef.current) {
            setDisplayedText('Committee deliberation complete. Generating final verdict.');
            setAgents(prev => prev.map(a => a.id === 'chair' ? { ...a, status: 'SPEAKING' } : { ...a, status: 'STANDBY' }));
            setTimeout(() => {
              setAgents(prev => prev.map(a => ({ ...a, status: 'STANDBY' })));
              
              const report = finalReportRef.current || {};
              const recStr = (report.recommendation || 'HOLD').toUpperCase();
              let verdict: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
              if (recStr.includes('BUY') || recStr.includes('ACCUMULATE')) verdict = 'BUY';
              if (recStr.includes('SELL') || recStr.includes('AVOID')) verdict = 'SELL';
              
              const conf = report.signal_score ? Math.round(report.signal_score * 10) : 85;
              const factors = [
                { name: 'Signal Strength', score: conf },
                { name: 'Risk Profile', score: report.risk_score ? Math.round(report.risk_score * 10) : 50 }
              ];
              
              onVerdictReached(verdict, conf, factors, report.resolution || 'Analysis complete.', doneDataRef.current.thread_id || 'demo');
              doneDataRef.current = null;
            }, 3000);
          }
          return;
        }

        isPlayingRef.current = true;
        const eventData = playbackQueueRef.current.shift();

        const nodeToAgentMap: Record<string, string> = {
          'intent_parser': 'chair', 'market': 'market', 'technical': 'technical',
          'news': 'news', 'rag': 'sentiment', 'bull_agent': 'bull', 'bear_agent': 'bear',
          'report_synthesis': 'chair'
        };

        const nodeToSpeakerMap: Record<string, string> = {
          'chair': 'amit', 'market': 'tanya', 'technical': 'rahul',
          'news': 'shreya', 'sentiment': 'anushka', 'bull': 'tanya', 'bear': 'rahul'
        };

        const agentId = nodeToAgentMap[eventData.node];
        let spokenText = "";

        if (agentId) {
          setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'SPEAKING' } : { ...a, status: 'ACTIVE' }));

          if (eventData.node === 'market' && eventData.update.market_data) {
            const md = eventData.update.market_data;
            if (md.speech_text) {
              spokenText = md.speech_text;
            } else {
              const change = typeof md.day_change === 'number' ? md.day_change.toFixed(2) : 'unknown';
              spokenText = `Market Analyst reporting. The current price is ${md.price}, with a day change of ${change} percent. Volume is ${md.formatted_volume || 'unknown'}.`;
            }
            const priceStr = typeof md.price === 'number' ? md.price.toFixed(2) : md.price || '0';
            setEvidenceData(p => ({
              ...p, price: priceStr, change: `${md.day_change > 0 ? '+' : ''}${md.day_change.toFixed(2)}`, isPositive: md.day_change >= 0,
              volume: md.formatted_volume || '-', peRatio: md.pe_ratio?.toString() || '-'
            }));
          } else if (eventData.node === 'technical' && eventData.update.technical_data) {
            const ts = eventData.update.technical_data;
            if (ts.speech_text) {
              spokenText = ts.speech_text;
            } else {
              spokenText = `Technical Analyst here. RSI is at ${ts.rsi}. The trend indicates ${ts.trend}. Support is at ${ts.support}.`;
            }
            setEvidenceData(p => ({
              ...p, rsi: ts.rsi || 50, macd: ts.macd_signal || '-', ema: ts.trend || ts.ema_signal || '-'
            }));
          } else if (eventData.node === 'news' && eventData.update.news_data) {
            const nd = eventData.update.news_data;
            if (nd.speech_text) {
              spokenText = nd.speech_text;
            } else {
              spokenText = `News Crawler reporting. The aggregate news sentiment is ${nd.aggregate_sentiment}.`;
            }
            if (nd.articles) {
              setNewsFeed(nd.articles.map((a: any) => a.title).slice(0, 4));
            }
          } else if (eventData.node === 'bull_agent' && eventData.update.bull_thesis) {
            spokenText = eventData.update.bull_thesis;
          } else if (eventData.node === 'bear_agent' && eventData.update.bear_thesis) {
            spokenText = eventData.update.bear_thesis;
          } else if (eventData.node === 'report_synthesis' && eventData.update.report) {
            finalReportRef.current = eventData.update.report;
            const rec = eventData.update.report.recommendation || 'HOLD';
            spokenText = `The committee has concluded its deliberation. Based on our analysis, our final recommendation is to ${rec}.`;
          } else if (eventData.node === 'intent_parser') {
            spokenText = `Welcome to the FinAgentX Investment Committee. I am the Chairperson. We will now deliberate on ${activeTicker}. Let us begin with the Market Analyst.`;
          }

          if (spokenText) {
            setDisplayedText(`[${eventData.node.toUpperCase()}]: ${spokenText}`);
            try {
              const speaker = nodeToSpeakerMap[agentId] || 'tanya';
              const audioRes = await fetch('/api/voice/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: spokenText, speaker })
              });
              if (audioRes.ok) {
                const blob = await audioRes.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                currentAudioRef.current = audio;
                await new Promise((resolve) => {
                  audio.onended = resolve;
                  audio.onerror = resolve;
                  audio.play().catch(resolve);
                });
              } else {
                await new Promise(r => setTimeout(r, 2000));
              }
            } catch (e) {
              await new Promise(r => setTimeout(r, 2000));
            }
          } else {
            setDisplayedText(`[${eventData.node.toUpperCase()}]: Processing...`);
            await new Promise(r => setTimeout(r, 500));
          }

          setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'ACTIVE' } : a));
        }

        isPlayingRef.current = false;
        processQueue();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.node === 'done') {
            doneDataRef.current = data;
            if (!isPlayingRef.current) processQueue();
            return;
          }
          playbackQueueRef.current.push(data);
          if (!isPlayingRef.current) processQueue();
        } catch (e) { }
      };

      es.onerror = () => {
        setDisplayedText('Connection interrupted. Please try again.');
        es.close();
        setIsDebating(false);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return (
    <div className="terminal-layout" style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#0a0f1e', overflow: 'hidden', position: 'relative' }}>
      {/* Background Grid */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0, opacity: 0.5 }}></div>

      {/* LEFT PANEL: Agent Roster */}
      <div style={{ width: '280px', borderRight: '1px solid rgba(0, 212, 255, 0.15)', padding: '24px', zIndex: 2, background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '2px', color: 'var(--primary)' }}>COMMITTEE</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={isDebating ? "status-dot-pulse" : ""} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDebating ? 'var(--success)' : 'var(--text-muted)' }}></div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{agents.length} AGENTS</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: agent.status === 'SPEAKING' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255,255,255,0.02)', borderRadius: '8px',
              border: `1px solid ${agent.status === 'SPEAKING' ? agent.color : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.3s ease',
              boxShadow: agent.status === 'SPEAKING' ? `0 0 15px ${agent.color}40` : 'none'
            }}>
              {/* Agent Avatar */}
              <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', padding: '2px', background: `linear-gradient(135deg, ${agent.color}, transparent)` }}>
                <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                {agent.status === 'SPEAKING' && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-dark)' }}></div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>{agent.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{agent.role}</div>
              </div>
              {/* Status Pill */}
              <div style={{
                fontSize: '9px', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)',
                background: agent.status === 'SPEAKING' ? `${agent.color}30` : 'rgba(255,255,255,0.05)',
                color: agent.status === 'SPEAKING' ? agent.color : 'var(--text-muted)',
                fontWeight: agent.status === 'SPEAKING' ? 700 : 400
              }}>
                {agent.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Network Stage */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>

        {/* Top Bar */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(0, 212, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '2px', color: 'var(--text-muted)' }}>INVESTMENT COMMITTEE SESSION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '6px', padding: '6px 12px', width: '260px', boxShadow: 'inset 0 0 10px rgba(0,212,255,0.1)' }}>
                <span style={{ color: 'var(--primary)', marginRight: '10px', fontFamily: 'var(--font-mono)', fontSize: '16px', animation: 'blink 1s step-end infinite' }}>&gt;</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value.toUpperCase());
                    resetSession();
                  }}
                  placeholder="ENTER TICKER..."
                  style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff', background: 'transparent', border: 'none', outline: 'none', width: '100%', letterSpacing: '2px' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      fetchEvidenceData(inputValue.trim().toUpperCase());
                    }
                  }}
                  autoFocus
                />
                {inputValue && (
                  <button
                    onClick={() => {
                      setInputValue('');
                      resetSession();
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', marginLeft: '8px' }}
                    title="Clear text"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Recommended Tickers */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RECOMMENDED:</span>
                {['NVDA', 'RELIANCE', 'TSLA', 'AAPL'].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setInputValue(t);
                      resetSession();
                      fetchEvidenceData(t);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button onClick={onBackToLanding} style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', padding: '6px 16px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              DISCONNECT
            </button>
          </div>
        </div>

        {/* Circular Network Grid Stage */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* SVG Connection Lines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {agents.slice(1).map((agent, i) => {
              const angle = (i * (360 / (agents.length - 1))) * (Math.PI / 180) - Math.PI / 2; // Offset by -90deg
              const x2 = `calc(50% + ${Math.cos(angle) * 200}px)`;
              const y2 = `calc(50% + ${Math.sin(angle) * 200}px)`;
              const isSpeaking = agent.status === 'SPEAKING';
              return (
                <line key={`line-${i}`} x1="50%" y1="50%" x2={x2} y2={y2}
                  stroke={isSpeaking ? agent.color : 'rgba(0, 212, 255, 0.1)'}
                  strokeWidth={isSpeaking ? 3 : 1}
                  strokeDasharray={isSpeaking ? "5,5" : "none"}
                  style={{ transition: 'all 0.3s ease', animation: isSpeaking ? 'flowDash 0.5s linear infinite' : 'none' }}
                />
              );
            })}
          </svg>

          {/* Central Command Button */}
          <button
            onClick={toggleSession}
            style={{
              position: 'absolute', width: '100px', height: '100px', borderRadius: '50%',
              background: 'rgba(10, 15, 30, 0.9)', border: `2px solid ${isDebating ? 'var(--warning)' : 'var(--primary)'}`,
              zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: `0 0 30px ${isDebating ? 'rgba(255, 209, 102, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`,
              transition: 'all 0.3s'
            }}
          >
            {isDebating ? <Pause size={32} color="var(--warning)" /> : <Play size={32} color="var(--primary)" style={{ marginLeft: '4px' }} />}
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isDebating ? 'var(--warning)' : 'var(--primary)', marginTop: '8px', letterSpacing: '1px' }}>
              {isDebating ? 'PAUSE' : (hasStarted ? 'RESUME' : (inputValue ? 'START DEBATE' : 'START'))}
            </div>
          </button>

          {/* Satellite Agent Nodes */}
          {agents.slice(1).map((agent, i) => {
            const angle = (i * (360 / (agents.length - 1))) * (Math.PI / 180) - Math.PI / 2;
            const isSpeaking = agent.status === 'SPEAKING';
            return (
              <div key={agent.id} style={{
                position: 'absolute', width: '70px', height: '70px',
                transform: `translate(${Math.cos(angle) * 200}px, ${Math.sin(angle) * 200}px)`,
                zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <div style={{
                  position: 'relative', width: '60px', height: '60px', borderRadius: '50%', padding: '3px',
                  background: isSpeaking ? `linear-gradient(135deg, ${agent.color}, transparent)` : 'rgba(255,255,255,0.05)',
                  boxShadow: isSpeaking ? `0 0 20px ${agent.color}80` : 'none', transition: 'all 0.3s'
                }}>
                  <img src={agent.avatar} alt={agent.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', opacity: isSpeaking ? 1 : 0.6 }} />
                </div>
                <div style={{
                  fontSize: '9px', fontFamily: 'var(--font-mono)', color: isSpeaking ? '#fff' : 'var(--text-muted)',
                  marginTop: '8px', textAlign: 'center', background: 'rgba(10, 15, 30, 0.8)', padding: '2px 6px', borderRadius: '4px'
                }}>
                  {agent.name.split(' ')[0].toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transcript Area */}
        <div style={{ height: '100px', margin: '24px', borderRadius: '8px', padding: '16px', background: 'rgba(10, 15, 30, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)', backdropFilter: 'blur(10px)', display: 'flex', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={14} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginBottom: '6px', letterSpacing: '1px' }}>SYSTEM LOG</div>
            <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.5', fontFamily: 'var(--font-main)' }}>
              {displayedText}
              {isDebating && <span style={{ display: 'inline-block', width: '8px', height: '14px', background: 'var(--primary)', marginLeft: '6px', animation: 'blink 1s step-end infinite' }}></span>}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Evidence Wall */}
      <div style={{ width: '320px', borderLeft: '1px solid rgba(0, 212, 255, 0.15)', padding: '24px', zIndex: 2, background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '24px' }}>EVIDENCE INTELLIGENCE</h2>

        {/* Market Data Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>PRICE</div>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-display)', color: '#fff' }}>${evidenceData.price}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>DAY CHANGE</div>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-display)', color: evidenceData.isPositive ? 'var(--success)' : 'var(--danger)' }}>{evidenceData.change}%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>VOLUME</div>
            <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: '#fff' }}>{evidenceData.volume}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>P/E RATIO</div>
            <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: '#fff' }}>{evidenceData.peRatio}</div>
          </div>
        </div>

        {/* Technical Signals */}
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '16px' }}>TECHNICAL GAUGES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>RSI (14)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>{evidenceData.rsi}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>MACD</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{evidenceData.macd.toString().toUpperCase()}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '12px', marginBottom: '8px' }}>EMA</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{evidenceData.ema.toString().toUpperCase()}</div>
          </div>
        </div>

        {/* News Stream */}
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '16px' }}>GLOBAL CONTEXT</h2>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
          {newsFeed.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {newsFeed.map((news, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--primary)', marginRight: '6px' }}>●</span> {news}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              Awaiting news crawler...
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
};
