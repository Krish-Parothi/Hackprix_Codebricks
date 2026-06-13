import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, FastForward, RotateCcw, Cpu, BarChart2, Activity } from 'lucide-react';

interface BoardroomScreenProps {
  ticker: string;
  onVerdictReached: (verdict: 'BUY' | 'HOLD' | 'SELL', confidence: number, factors: { name: string; score: number }[], summary: string) => void;
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

type TickerSnapshot = {
  price: string;
  change: string;
  isPositive: boolean;
  volume: string;
  peRatio: string;
  rsi: string;
  macd: string;
  ema: string;
  volatility: string;
  riskScore: string;
  drawdown: string;
  newsFeed: string[];
};

function getTickerSnapshot(ticker: string): TickerSnapshot {
  if (ticker === 'NVDA') {
    return {
      price: '$124.85',
      change: '+4.8%',
      isPositive: true,
      volume: '65.2M',
      peRatio: '68.4',
      rsi: '58.2',
      macd: 'BUY SIGN',
      ema: 'Bullish',
      volatility: 'Low',
      riskScore: '18%',
      drawdown: '-4.2%',
      newsFeed: [
        'AI-driven assessment for NVDA signals solid operational efficiency.',
        'Macro conditions for NVDA sector remain favorable, analyst says.',
        'Volume indicators reveal minor block accumulation at current pivot.'
      ]
    };
  }

  if (ticker === 'AAPL') {
    return {
      price: '$178.20',
      change: '-0.8%',
      isPositive: false,
      volume: '48.9M',
      peRatio: '28.1',
      rsi: '58.2',
      macd: 'BUY SIGN',
      ema: 'Bullish',
      volatility: 'Low',
      riskScore: '18%',
      drawdown: '-4.2%',
      newsFeed: [
        'AI-driven assessment for AAPL signals solid operational efficiency.',
        'Macro conditions for AAPL sector remain favorable, analyst says.',
        'Volume indicators reveal minor block accumulation at current pivot.'
      ]
    };
  }

  if (ticker === 'MSFT') {
    return {
      price: '$415.50',
      change: '+1.2%',
      isPositive: true,
      volume: '22.3M',
      peRatio: '35.6',
      rsi: '58.2',
      macd: 'BUY SIGN',
      ema: 'Bullish',
      volatility: 'Low',
      riskScore: '18%',
      drawdown: '-4.2%',
      newsFeed: [
        'AI-driven assessment for MSFT signals solid operational efficiency.',
        'Macro conditions for MSFT sector remain favorable, analyst says.',
        'Volume indicators reveal minor block accumulation at current pivot.'
      ]
    };
  }

  if (ticker === 'RELIANCE') {
    return {
      price: '₹2,910.40',
      change: '+0.5%',
      isPositive: true,
      volume: '8.4M',
      peRatio: '26.8',
      rsi: '58.2',
      macd: 'BUY SIGN',
      ema: 'Bullish',
      volatility: 'Low',
      riskScore: '18%',
      drawdown: '-4.2%',
      newsFeed: [
        'AI-driven assessment for RELIANCE signals solid operational efficiency.',
        'Macro conditions for RELIANCE sector remain favorable, analyst says.',
        'Volume indicators reveal minor block accumulation at current pivot.'
      ]
    };
  }

  if (ticker === 'TCS') {
    return {
      price: '₹3,820.00',
      change: '-1.2%',
      isPositive: false,
      volume: '2.1M',
      peRatio: '29.3',
      rsi: '58.2',
      macd: 'BUY SIGN',
      ema: 'Bullish',
      volatility: 'Low',
      riskScore: '18%',
      drawdown: '-4.2%',
      newsFeed: [
        'AI-driven assessment for TCS signals solid operational efficiency.',
        'Macro conditions for TCS sector remain favorable, analyst says.',
        'Volume indicators reveal minor block accumulation at current pivot.'
      ]
    };
  }

  const randomChange = `${Math.random() > 0.4 ? '+' : '-'}${(Math.random() * 4).toFixed(1)}%`;

  return {
    price: `$${(Math.random() * 200 + 50).toFixed(2)}`,
    change: randomChange,
    isPositive: randomChange.startsWith('+'),
    volume: `${(Math.random() * 30 + 10).toFixed(1)}M`,
    peRatio: (Math.random() * 40 + 15).toFixed(1),
    rsi: '58.2',
    macd: 'BUY SIGN',
    ema: 'Bullish',
    volatility: 'Low',
    riskScore: '18%',
    drawdown: '-4.2%',
    newsFeed: [
      `AI-driven assessment for ${ticker} signals solid operational efficiency.`,
      `Macro conditions for ${ticker} sector remain favorable, analyst says.`,
      'Volume indicators reveal minor block accumulation at current pivot.'
    ]
  };
}

export const BoardroomScreen: React.FC<BoardroomScreenProps> = ({
  ticker,
  onVerdictReached,
  onSwitchToMonitoring,
  onBackToLanding
}) => {
  // Simulator state machine
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speakerId, setSpeakerId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [deliberationProgress, setDeliberationProgress] = useState(0);
  const typewriterTimer = useRef<number | null>(null);

  const snapshot = useMemo(() => getTickerSnapshot(ticker), [ticker]);

  // Evidence Wall Data (live updates)
  const [evidenceData, setEvidenceData] = useState({
    price: '$124.85',
    change: '+2.4%',
    isPositive: true,
    volume: '42.1M',
    peRatio: '32.4',
    rsi: '58.2',
    macd: 'BUY SIGN',
    ema: 'Bullish',
    volatility: 'Low',
    riskScore: '18%',
    drawdown: '-4.2%'
  });

  const [newsFeed, setNewsFeed] = useState<string[]>([
    'Institutional inflows surge after strategic partnership.',
    'Regulatory review scheduled for mid-Q3.',
    'Technical resistance tested at major pivot points.'
  ]);

  // Setup mock details based on selected ticker
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEvidenceData(prev => ({
        ...prev,
        price: snapshot.price,
        change: snapshot.change,
        isPositive: snapshot.isPositive,
        peRatio: snapshot.peRatio,
        volume: snapshot.volume
      }));

      setNewsFeed(snapshot.newsFeed);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ticker, snapshot]);

  // Agents specification (7 agents seated at coordinates)
  const agents: Agent[] = [
    { id: 'chair', name: 'Chairperson AI', role: 'Deliberation Lead', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80', status: 'Awaiting reports...', angle: 0 },
    { id: 'market', name: 'Market Analyst', role: 'Technical signals', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80', status: 'Preparing metrics...', angle: 51.4 },
    { id: 'news', name: 'News Crawler', role: 'Context & NLP', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80', status: 'Awaiting floor...', angle: 102.8 },
    { id: 'sentiment', name: 'Sentiment Engine', role: 'Momentum crawler', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80', status: 'Assembling reports...', angle: 154.2 },
    { id: 'risk', name: 'Risk Assessment', role: 'Drawdown evaluator', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80', status: 'Computing betas...', angle: 205.6 },
    { id: 'bull', name: 'Bull Advisor', role: 'Growth perspective', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80', status: 'Drafting catalysts...', angle: 257.0 },
    { id: 'bear', name: 'Bear Advisor', role: 'Systemic risk assessment', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80', status: 'Checking headwinds...', angle: 308.4 }
  ];

  // Simulation dialogue phases
  const phases = useMemo(() => [
    {
      speakerId: 'chair',
      text: `Welcome, Committee. We are now open for Session #AI-2026-001. Today's subject is ${ticker}. Let's initialize data streaming and review analyst reports.`,
      statusUpdates: { chair: 'Speaking', market: 'Ready to present', news: 'Ready', sentiment: 'Scanning', risk: 'Calculating', bull: 'Ready', bear: 'Ready' }
    },
    {
      speakerId: 'market',
      text: `Technical trends for ${ticker}: Current price is ${snapshot.price} (${snapshot.change}). RSI is ${snapshot.rsi}. Moving averages indicate strong medium-term support. Momentum signals buy correlation.`,
      statusUpdates: { chair: 'Listening', market: 'Speaking', news: 'Scanning', sentiment: 'Active', risk: 'Calculating', bull: 'Ready', bear: 'Ready' },
      dataUpdates: { rsi: '64.2', ema: 'Strong Bullish', macd: 'STRONG BUY' }
    },
    {
      speakerId: 'news',
      text: `I've analyzed 48 recent news publications for ${ticker}. 36 are highly positive, highlighting robust capital reserves and market-expansion partnerships. 8 are neutral, 4 contain minor margin concerns.`,
      statusUpdates: { chair: 'Listening', market: 'Report Submitted', news: 'Speaking', sentiment: 'Compiling', risk: 'Active', bull: 'Ready', bear: 'Ready' },
      newsUpdates: [
        'Quarterly revenue projections raised due to AI segment growth.',
        'Antitrust review causes minimal sentiment friction.',
        'Heavy institutional block trades detected in standard range.'
      ]
    },
    {
      speakerId: 'sentiment',
      text: `Sentiment Index for ${ticker} yields a high score of 78% positive momentum. Social channels reveal high retail trust. Institutional search indices are trending upwards rapidly.`,
      statusUpdates: { chair: 'Listening', market: 'Ready', news: 'Report Submitted', sentiment: 'Speaking', risk: 'Active', bull: 'Ready', bear: 'Ready' },
      dataUpdates: { riskScore: '12%', volatility: 'Stable' }
    },
    {
      speakerId: 'risk',
      text: `Risk Assessment checks out. Current portfolio drawdown limits are at ${snapshot.drawdown}. Volatility is classified as ${snapshot.volatility}. Portfolio correlation is clean, low exposure risks here.`,
      statusUpdates: { chair: 'Listening', market: 'Ready', news: 'Ready', sentiment: 'Ready', risk: 'Speaking', bull: 'Standing by', bear: 'Standing by' }
    },
    {
      speakerId: 'bull',
      text: `Here is the Bull case for ${ticker}: Multi-year cloud contracts expanding. Unlocked data-center demand is outstripping supply. Earnings surprise estimates are +14%. Excellent product pipeline.`,
      statusUpdates: { chair: 'Listening', market: 'Ready', news: 'Ready', sentiment: 'Ready', risk: 'Ready', bull: 'Presenting Bull Case', bear: 'Waiting rebuttal' }
    },
    {
      speakerId: 'bear',
      text: `I must urge caution. The Bear Case for ${ticker}: Valuations are historically stretched. Macro credit tightening poses potential headwinds, and competitor supply chains are recovering fast. Valuation multiple risks exist.`,
      statusUpdates: { chair: 'Listening', market: 'Ready', news: 'Ready', sentiment: 'Ready', risk: 'Ready', bull: 'Finished presenting', bear: 'Presenting Bear Case' }
    },
    {
      speakerId: 'chair',
      text: `Acknowledged. I will now synthesize these reports and opinions. Commencing consensus aggregation... Chairperson core active.`,
      statusUpdates: { chair: 'Synthesizing opinions...', market: 'Standby', news: 'Standby', sentiment: 'Standby', risk: 'Standby', bull: 'Standby', bear: 'Standby' }
    }
  ], [ticker, snapshot]);

  // Typewriter effect handler
  useEffect(() => {
    if (typewriterTimer.current) {
      clearInterval(typewriterTimer.current);
    }

    const currentPhase = phases[phaseIndex];
    if (!currentPhase) return;

    const syncTimer = window.setTimeout(() => {
      setSpeakerId(currentPhase.speakerId);
      setDisplayedText('');
    }, 0);

    let charIdx = 0;
    typewriterTimer.current = window.setInterval(() => {
      if (charIdx < currentPhase.text.length) {
        setDisplayedText(prev => prev + currentPhase.text.charAt(charIdx));
        charIdx++;
      } else {
        if (typewriterTimer.current) {
          clearInterval(typewriterTimer.current);
        }
      }
    }, 15);

    // Apply mock updates if available
    if (currentPhase.dataUpdates) {
      setEvidenceData(prev => ({ ...prev, ...currentPhase.dataUpdates }));
    }
    if (currentPhase.newsUpdates) {
      setNewsFeed(currentPhase.newsUpdates);
    }

    return () => {
      window.clearTimeout(syncTimer);
      if (typewriterTimer.current) {
        clearInterval(typewriterTimer.current);
      }
    };
  }, [phaseIndex, ticker, phases]);

  const revealFinalVerdict = useCallback(() => {
    // Generate logical verdict parameters based on the company
    let recommendation: 'BUY' | 'HOLD' | 'SELL' = 'BUY';
    let confidence = 86;
    let factors = [
      { name: 'Positive Sentiment', score: 35 },
      { name: 'Technical Momentum', score: 22 },
      { name: 'Fundamental Strength', score: 18 },
      { name: 'Systemic Risk Penalty', score: -9 }
    ];
    let summary = `Collaborative intelligence consensus is Buy. Strong data-center revenue expansion and bullish indicators suggest substantial medium-term upside potential, outweighing current valuation premiums.`;

    if (ticker === 'AAPL') {
      recommendation = 'HOLD';
      confidence = 68;
      factors = [
        { name: 'Steady Revenue Stream', score: 25 },
        { name: 'Institutional Trust', score: 15 },
        { name: 'Technical Consolidation', score: -10 },
        { name: 'Market Saturation Penalty', score: -14 }
      ];
      summary = `The committee yields a Hold. Apple exhibits exceptional capital efficiency, but current valuation multiples and near-term hardware saturation indicators support a neutral stance.`;
    } else if (ticker === 'TCS') {
      recommendation = 'SELL';
      confidence = 74;
      factors = [
        { name: 'Strong Brand Equity', score: 12 },
        { name: 'Yield Dividend Backup', score: 10 },
        { name: 'Headwinds in Sector Demand', score: -28 },
        { name: 'Technical EMA Breakdown', score: -18 }
      ];
      summary = `The committee resolves a Sell. Weakening deal pipelines and breakdown under key EMA support ranges present structural downside risks to near-term margins.`;
    }

    onVerdictReached(recommendation, confidence, factors, summary);
  }, [onVerdictReached, ticker]);

  const triggerDeliberationSynthesis = useCallback(() => {
    setSpeakerId('chair');
    setPhaseIndex(phases.length - 1); // Ensure final synthesize text is shown
    setDeliberationProgress(1); // Set to active

    // Pulsing progress ring
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          revealFinalVerdict();
        }, 1000);
      }
    }, 120);
  }, [phases.length, revealFinalVerdict]);

  // Main simulator scheduler
  useEffect(() => {
    if (!isPlaying) return;

    const currentTextLength = phases[phaseIndex]?.text.length || 100;
    const readDelay = currentTextLength * 15 + 2200; // Type duration + reading pause

    const timer = setTimeout(() => {
      if (phaseIndex < phases.length - 1) {
        setPhaseIndex(prev => prev + 1);
      } else {
        // End of phases: Start Synthesis and Reveal Verdict
        setIsPlaying(false);
        triggerDeliberationSynthesis();
      }
    }, readDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, phaseIndex, phases, triggerDeliberationSynthesis]);

  const currentPhase = phases[phaseIndex];
  const activeAgentStatuses = currentPhase ? currentPhase.statusUpdates : {};

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
              onClick={() => {
                if (phaseIndex < phases.length - 1) {
                  setPhaseIndex(prev => prev + 1);
                } else {
                  triggerDeliberationSynthesis();
                }
              }}
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
              title="Next Agent report"
            >
              <FastForward size={12} />
            </button>
            <button
              onClick={() => {
                setPhaseIndex(0);
                setIsPlaying(true);
                setDeliberationProgress(0);
              }}
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
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 600, color: isSpeaking ? 'var(--primary)' : '#fff' }}>{agent.name}</h5>
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
              {agents.map((agent) => {
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
        {currentPhase && (
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
