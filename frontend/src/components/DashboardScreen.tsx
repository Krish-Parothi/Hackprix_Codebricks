import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Zap, Shield, Loader2, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA FOR CHARTS/FEED ---
const allocationData = [
  { name: 'Equity', value: 65, color: '#00d4ff' },
  { name: 'Debt', value: 25, color: '#8b5cf6' },
  { name: 'Cash', value: 10, color: '#22c55e' }
];

const agentFeed = [
  { agent: 'Market Analyst', color: '#3b82f6', text: 'NVDA analyzed · Risk: 7.4', time: 'Just now' },
  { agent: 'News Crawler', color: '#f59e0b', text: 'Sentiment: Bullish · 14 articles', time: '2m ago' },
  { agent: 'Technical', color: '#8b5cf6', text: 'RELIANCE MACD crossover detected', time: '5m ago' },
  { agent: 'Chairperson', color: '#00d4ff', text: 'AAPL verdict finalized: HOLD', time: '18m ago' },
];

// --- COMPONENTS ---
const CountUp: React.FC<{ end: number; decimals?: number; prefix?: string; suffix?: string }> = ({ end, decimals = 0, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const startTime = performance.now();
    
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end]);
  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

interface LiveStock {
  ticker: string;
  price: number;
  change: number;
}

interface PortfolioStats {
  total_value: number;
  day_pl: number;
  risk_score: number;
  sharpe: number;
  beta: number;
}

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  // Live Data States
  const [isLoading, setIsLoading] = useState(true);
  const [liveWatchlist, setLiveWatchlist] = useState<LiveStock[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    total_value: 1250000, day_pl: 14500, risk_score: 6.4, sharpe: 1.85, beta: 1.12
  });

  // Fetch Live Data
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await fetch('/api/dashboard_data');
        if (res.ok) {
          const data = await res.json();
          setLiveWatchlist(data.watchlist);
          setPortfolioStats(data.portfolio);
        }
      } catch (err) {
        console.error("Failed to fetch live data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveData();
  }, []);

  // Mouse tracking effect for all glass cards
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.glass-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAnalyze = () => {
    if (query.trim()) {
      navigate(`/analyze?q=${encodeURIComponent(query)}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: 'calc(100vh - 70px)', background: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>
        <Loader2 size={48} className="spin" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '18px', letterSpacing: '2px', animation: 'pulse 1.5s infinite' }}>INITIALIZING SECURE LIVE FEED...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>Fetching real-time market data from yfinance</p>
        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hedge-fund-dashboard" style={{
      height: 'calc(100vh - 70px)',
      background: '#0a0f1e',
      color: '#fff',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-main)'
    }}>
      {/* Animated Perspective Grid Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
        transformOrigin: 'top center',
        zIndex: 0, pointerEvents: 'none'
      }} />

      {/* Live Ticker Marquee */}
      <div style={{
        width: '100%', height: '36px', background: 'var(--primary)', color: '#0a0f1e',
        display: 'flex', alignItems: 'center', overflow: 'hidden', zIndex: 10,
        fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '1px'
      }}>
        <div className="marquee-content" style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 25s linear infinite' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '48px', paddingRight: '48px' }}>
              {liveWatchlist.map(stock => (
                <span key={stock.ticker}>
                  {stock.ticker}: ${stock.price.toFixed(2)} {stock.change >= 0 ? '▲' : '▼'} {stock.change > 0 ? '+' : ''}{stock.change}%
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Clean Spacious Grid Layout */}
      <div style={{
        flex: 1, padding: '40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', zIndex: 5,
        maxWidth: '1600px', margin: '0 auto', width: '100%'
      }}>
        
        {/* LEFT COLUMN: Portfolio Stats & Analyze */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInUp 0.5s ease-out' }}>
          
          {/* 4 Stat Cards in 2x2 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Total Value */}
            <div className="glass-card">
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>TOTAL PORTFOLIO VALUE</div>
              <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginTop: '12px' }}>
                <CountUp prefix="₹" end={portfolioStats.total_value} />
              </div>
            </div>
            
            {/* Day P&L */}
            <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>DAY P&L (LIVE MARK-TO-MARKET)</div>
              <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 700, color: portfolioStats.day_pl >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {portfolioStats.day_pl >= 0 ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                <CountUp prefix={portfolioStats.day_pl >= 0 ? "+₹" : "-₹"} end={Math.abs(portfolioStats.day_pl)} />
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div className="glass-card">
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>SHARPE RATIO</div>
              <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', marginTop: '12px' }}>
                <CountUp end={portfolioStats.sharpe} decimals={2} />
              </div>
            </div>

            {/* Portfolio Risk Score */}
            <div className="glass-card">
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>SYSTEMIC RISK SCORE</div>
              <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--warning)', marginTop: '12px' }}>
                <CountUp end={portfolioStats.risk_score} decimals={1} /> <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 10</span>
              </div>
            </div>
          </div>

          {/* Allocation Donut (Wider & Cleaner) */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '24px 40px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '1px', marginBottom: '16px' }}>PORTFOLIO ALLOCATION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allocationData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: d.color, boxShadow: `0 0 10px ${d.color}` }} /> 
                    <span style={{ color: '#fff' }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-muted)' }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: '200px', height: '200px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} innerRadius="70%" outerRadius="90%" paddingAngle={8} dataKey="value" stroke="none">
                    {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.9)', border: '1px solid var(--primary)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <Shield size={32} color="var(--primary)" />
              </div>
            </div>
          </div>

          {/* Quick Analyze Bar */}
          <div className="glass-card" style={{ 
            padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '24px',
            border: '1px solid var(--primary)', boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)'
          }}>
            <Zap size={28} color="var(--primary)" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="I have ₹1 lakh, should I buy NVIDIA?"
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', fontFamily: 'var(--font-mono)', outline: 'none' }}
            />
            <button onClick={handleAnalyze} className="analyze-btn-charging" style={{ 
              background: 'var(--primary)', color: '#0a0f1e', border: 'none', padding: '16px 40px', borderRadius: '8px',
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
            }}>
              ANALYZE NOW <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Watchlist & Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeInUp 0.5s ease-out 0.2s backwards' }}>
          
          {/* Live Watchlist */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '1px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <span>LIVE WATCHLIST (YFINANCE)</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>REAL-TIME DATA</span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <tbody>
                {liveWatchlist.map((item) => (
                  <tr key={item.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '20px 0', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{item.ticker}</td>
                    <td style={{ padding: '20px 0', fontFamily: 'var(--font-display)', fontWeight: 600, textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <span style={{ 
                        background: item.change >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                        color: item.change >= 0 ? 'var(--success)' : 'var(--danger)', 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600
                      }}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                      <button onClick={() => navigate(`/analyze?q=${item.ticker}`)} style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        RE-ANALYZE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agent Feed */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '300px' }}>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '24px' }}>AGENT ACTIVITY FEED</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '8px' }}>
              {agentFeed.map((feed, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: feed.color, marginTop: '6px', boxShadow: `0 0 12px ${feed.color}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.5' }}><span style={{ color: feed.color, fontWeight: 600 }}>{feed.agent}</span> → {feed.text}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '6px' }}>{feed.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .glass-card {
          position: relative;
          background: rgba(10, 15, 30, 0.5);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 212, 255, 0.1);
          border-radius: 20px;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s, box-shadow 0.3s;
          overflow: hidden;
        }
        .glass-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          background: radial-gradient(
            800px circle at var(--mouse-x, 0) var(--mouse-y, 0),
            rgba(0, 212, 255, 0.08),
            transparent 40%
          );
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 0;
        }
        .glass-card > * {
          position: relative;
          z-index: 1;
        }
        .glass-card:hover::before {
          opacity: 1;
        }
        .glass-card:hover {
          border-color: rgba(0, 212, 255, 0.3);
          box-shadow: 0 15px 50px rgba(0, 212, 255, 0.1), inset 0 0 0 1px rgba(0, 212, 255, 0.1);
          transform: translateY(-4px);
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .analyze-btn-charging {
          position: relative;
          overflow: hidden;
        }
        .analyze-btn-charging::before {
          content: '';
          position: absolute;
          top: 0; left: 0; height: 100%; width: 0%;
          background: rgba(255,255,255,0.25);
          transition: width 0.3s ease;
        }
        .analyze-btn-charging:hover::before {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
