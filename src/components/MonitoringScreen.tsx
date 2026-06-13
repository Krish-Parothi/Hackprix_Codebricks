import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Pause, Bell, Plus, Trash2, ArrowLeft, Terminal } from 'lucide-react';

interface WatchlistItem {
  id: string;
  ticker: string;
  price: string;
  change: string;
  isPositive: boolean;
  triggers: {
    rsi: boolean;
    earnings: boolean;
    sentiment: boolean;
  };
}

interface MonitoringScreenProps {
  onBackToBoardroom: () => void;
}

export const MonitoringScreen: React.FC<MonitoringScreenProps> = ({ onBackToBoardroom }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { id: '1', ticker: 'NVDA', price: '$124.85', change: '+2.4%', isPositive: true, triggers: { rsi: true, earnings: true, sentiment: false } },
    { id: '2', ticker: 'AAPL', price: '$178.20', change: '-0.8%', isPositive: false, triggers: { rsi: false, earnings: true, sentiment: true } },
    { id: '3', ticker: 'MSFT', price: '$415.50', change: '+1.1%', isPositive: true, triggers: { rsi: true, earnings: false, sentiment: true } },
  ]);
  const [newTicker, setNewTicker] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'System: Entering Autonomous Monitoring Protocol (Boardroom After Hours).',
    'Secured: AI Agent Core initialized in idle watchdog mode.',
    'Risk Officer: Active monitoring of portfolios enabled.',
  ]);
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Live simulation of autonomous scans
  useEffect(() => {
    if (!isMonitoringActive) return;

    const agents = ['Market Analyst', 'News Analyst', 'Sentiment Analyst', 'Risk Officer', 'Bull Case AI', 'Bear Case AI'];
    const actions = [
      'scanned social sentiments. Consensus: Bullish.',
      'calculated RSI. Current RSI stands at 44.2 (Neutral).',
      'analyzed 10-Q filing notes. Substantial cash reserves confirmed.',
      'crawled news feed. 14 mentions of macro regulatory shifts.',
      'verified correlation beta against SPY. Steady.',
      'scanned options block activity. Volume spike detected.',
    ];

    const interval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomWatchlist = watchlist[Math.floor(Math.random() * watchlist.length)];

      if (!randomWatchlist) return;

      const time = new Date().toLocaleTimeString();
      const newLog = `[${time}] ${randomAgent} [${randomWatchlist.ticker}]: ${randomAction}`;
      
      setLogs(prev => [...prev.slice(-30), newLog]); // Keep last 30 logs
    }, 4000);

    return () => clearInterval(interval);
  }, [isMonitoringActive, watchlist]);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker) return;

    const formatted = newTicker.trim().toUpperCase();
    if (watchlist.some(w => w.ticker === formatted)) return;

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      ticker: formatted,
      price: `$${(Math.random() * 200 + 50).toFixed(2)}`,
      change: `${(Math.random() > 0.4 ? '+' : '-')}${(Math.random() * 3).toFixed(1)}%`,
      isPositive: Math.random() > 0.4,
      triggers: { rsi: true, earnings: true, sentiment: true }
    };

    setWatchlist(prev => [...prev, newItem]);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] System: Added ${formatted} to AI watchlist.`]);
    setNewTicker('');
  };

  const handleRemoveTicker = (id: string, ticker: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] System: Removed ${ticker} from watchlist.`]);
  };

  const toggleTrigger = (id: string, key: 'rsi' | 'earnings' | 'sentiment') => {
    setWatchlist(prev => prev.map(w => {
      if (w.id === id) {
        const nextTriggers = { ...w.triggers, [key]: !w.triggers[key] };
        setLogs(prevLogs => [
          ...prevLogs,
          `[${new Date().toLocaleTimeString()}] System: Updated alerts for ${w.ticker} [${key.toUpperCase()}: ${nextTriggers[key] ? 'ENABLED' : 'DISABLED'}].`
        ]);
        return { ...w, triggers: nextTriggers };
      }
      return w;
    }));
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'grid',
      gridTemplateRows: '70px 1fr',
      backgroundColor: '#050816',
      color: '#fff',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Glow Backdrops */}
      <div className="glow-bg primary" style={{ top: '20%', left: '30%', filter: 'blur(120px)', opacity: 0.08 }} />
      <div className="glow-bg secondary" style={{ bottom: '20%', right: '20%', filter: 'blur(120px)', opacity: 0.08 }} />

      {/* Header */}
      <div className="glass-panel" style={{
        borderRadius: 0,
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBackToBoardroom}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
          >
            <ArrowLeft size={14} />
            BACK
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--primary)" />
              AUTONOMOUS MONITORING
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>STATUS: AFTER-HOURS SECURE CYCLE</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className="btn-cyber"
            style={{
              padding: '6px 16px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isMonitoringActive ? <Pause size={12} /> : <Play size={12} />}
            {isMonitoringActive ? 'PAUSE MONITORING' : 'RESUME MONITORING'}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{
        padding: '30px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '30px',
        overflow: 'hidden',
        zIndex: 5
      }}>
        {/* Left Side: Watchlist Cockpit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
          {/* Add Ticker Widget */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Watchlist Manager</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure AI agents to run continuous background checks on active tickers.</p>
            </div>
            <form onSubmit={handleAddTicker} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ticker (e.g. TSLA)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '150px'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--primary)',
                  color: '#050816',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                ADD
              </button>
            </form>
          </div>

          {/* Watchlist Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', overflowY: 'auto', paddingRight: '6px' }}>
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 2fr auto',
                  alignItems: 'center',
                  gap: '20px',
                  position: 'relative'
                }}
              >
                {/* Ticker & Price Info */}
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{item.ticker}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{item.price}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: item.isPositive ? 'var(--success)' : 'var(--danger)' }}>
                      {item.change}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isMonitoringActive ? 'var(--success)' : 'var(--warning)',
                      boxShadow: isMonitoringActive ? '0 0 10px var(--success-glow)' : '0 0 10px var(--warning-glow)',
                      animation: 'pulse-ring 2s infinite ease-in-out'
                    }} />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {isMonitoringActive ? 'SCANNING' : 'PAUSED'}
                    </span>
                  </div>
                </div>

                {/* AI Agents Watch Conditions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* RSI Trigger */}
                  <button
                    onClick={() => toggleTrigger(item.id, 'rsi')}
                    style={{
                      background: item.triggers.rsi ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${item.triggers.rsi ? 'var(--primary)' : 'var(--border-glass)'}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: item.triggers.rsi ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Bell size={10} />
                    RSI &lt; 40
                  </button>

                  {/* Earnings Trigger */}
                  <button
                    onClick={() => toggleTrigger(item.id, 'earnings')}
                    style={{
                      background: item.triggers.earnings ? 'rgba(20, 241, 149, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${item.triggers.earnings ? 'var(--success)' : 'var(--border-glass)'}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: item.triggers.earnings ? 'var(--success)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Bell size={10} />
                    EARNINGS
                  </button>

                  {/* Sentiment Trigger */}
                  <button
                    onClick={() => toggleTrigger(item.id, 'sentiment')}
                    style={{
                      background: item.triggers.sentiment ? 'rgba(255, 93, 115, 0.1)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${item.triggers.sentiment ? 'var(--danger)' : 'var(--border-glass)'}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: item.triggers.sentiment ? 'var(--danger)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Bell size={10} />
                    BEARISH DROP
                  </button>
                </div>

                {/* Remove Widget */}
                <div>
                  <button
                    onClick={() => handleRemoveTicker(item.id, item.ticker)}
                    style={{
                      background: 'rgba(255,93,115,0.05)',
                      border: '1px solid rgba(255,93,115,0.1)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,93,115,0.1)';
                      e.currentTarget.style.borderColor = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,93,115,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,93,115,0.1)';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Agent Surveillance Terminal */}
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateRows: '50px 1fr',
          padding: '20px',
          overflow: 'hidden',
          borderColor: 'rgba(0,212,255,0.15)',
          background: 'rgba(8,12,28,0.9)'
        }}>
          {/* Console Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
            <Terminal size={16} color="var(--primary)" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '1px' }}>
              AGENT SURVEILLANCE FEED
            </span>
          </div>

          {/* Console Output */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingTop: '15px',
            lineHeight: '1.5'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{
                borderBottom: '1px solid rgba(255,255,255,0.01)',
                paddingBottom: '4px',
                color: log.includes('System:') 
                  ? 'var(--warning)' 
                  : log.includes('RSI') 
                    ? 'var(--primary)' 
                    : 'var(--text-secondary)'
              }}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
