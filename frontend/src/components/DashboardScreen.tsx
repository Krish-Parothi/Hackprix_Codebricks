import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Activity, Zap, Clock, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const allocationData = [
  { name: 'Equity', value: 65, color: '#00d4ff' },
  { name: 'Debt', value: 25, color: '#8b5cf6' },
  { name: 'Cash', value: 10, color: '#22c55e' }
];

const sectorData = [
  { name: 'IT', change: 2.4, color: '#10b981' },
  { name: 'Banking', change: -1.2, color: '#ef4444' },
  { name: 'Auto', change: 1.8, color: '#10b981' },
  { name: 'Pharma', change: 0.5, color: '#059669' },
  { name: 'Energy', change: -0.4, color: '#f87171' },
  { name: 'FMCG', change: -2.1, color: '#dc2626' },
  { name: 'Metal', change: 3.2, color: '#047857' },
  { name: 'Infra', change: 1.1, color: '#34d399' },
  { name: 'Defence', change: 4.5, color: '#059669' },
];

const agentFeed = [
  { agent: 'Market Analyst', color: '#3b82f6', text: 'NVDA analyzed · Risk: 7.4', time: 'Just now' },
  { agent: 'News Crawler', color: '#f59e0b', text: 'Sentiment: Bullish · 14 articles', time: '2m ago' },
  { agent: 'Technical', color: '#8b5cf6', text: 'RELIANCE MACD crossover detected', time: '5m ago' },
  { agent: 'Systemic Risk', color: '#ef4444', text: 'Global volatility spike warning', time: '12m ago' },
  { agent: 'Chairperson', color: '#00d4ff', text: 'AAPL verdict finalized: HOLD', time: '18m ago' },
];

const watchlist = [
  { ticker: 'NVDA', price: 125.40, change: 2.5, score: 88, alert: 120.00 },
  { ticker: 'RELIANCE', price: 2950.15, change: -0.8, score: 65, alert: 2900.00 },
  { ticker: 'AAPL', price: 189.20, change: 1.2, score: 72, alert: 185.00 },
  { ticker: 'TSLA', price: 175.50, change: -3.4, score: 45, alert: 170.00 },
];

const events = [
  { title: 'NVDA Q3 Earnings', date: 'Oct 24', urgency: 'red', days: 2 },
  { title: 'F&O Expiry', date: 'Oct 26', urgency: 'amber', days: 4 },
  { title: 'RBI Policy Review', date: 'Nov 05', urgency: 'grey', days: 14 },
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
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end]);
  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

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

      {/* Ticker Marquee */}
      <div style={{
        width: '100%', height: '32px', background: 'var(--primary)', color: '#0a0f1e',
        display: 'flex', alignItems: 'center', overflow: 'hidden', zIndex: 10,
        fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px'
      }}>
        <div className="marquee-content" style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '48px', paddingRight: '48px' }}>
              <span>NIFTY50: 24,500.15 ▲ +0.8%</span>
              <span>SENSEX: 80,120.40 ▲ +0.7%</span>
              <span>USD/INR: 83.45 ▼ -0.1%</span>
              <span>NASDAQ: 16,800.50 ▲ +1.2%</span>
              <span>BTC/USD: $64,200 ▲ +2.5%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{
        flex: 1, padding: '24px', display: 'grid', gridTemplateRows: 'auto 1fr 1fr auto', gap: '16px', zIndex: 5,
        maxWidth: '1800px', margin: '0 auto', width: '100%'
      }}>
        
        {/* ROW 1: 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', animation: 'fadeInUp 0.5s ease-out' }}>
          {/* Total Value */}
          <div className="glass-card">
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TOTAL VALUE</div>
            <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>
              <CountUp prefix="₹" end={1250000} />
            </div>
          </div>
          
          {/* Day P&L */}
          <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DAY P&L</div>
            <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--success)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpRight size={24} /> <CountUp prefix="+₹" end={14500} />
            </div>
            {/* Sparkline */}
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30px' }} preserveAspectRatio="none">
              <path d="M0,30 L20,20 L40,25 L60,10 L80,15 L100,5 L100,30 Z" fill="rgba(34, 197, 94, 0.1)" />
              <path d="M0,30 L20,20 L40,25 L60,10 L80,15 L100,5" fill="none" stroke="var(--success)" strokeWidth="2" />
            </svg>
          </div>

          {/* Risk Score Arc */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PORTFOLIO RISK SCORE</div>
              <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--warning)', marginTop: '8px' }}>
                <CountUp end={6.4} decimals={1} /> <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 10</span>
              </div>
            </div>
            <div style={{ width: '60px', height: '60px', position: 'relative' }}>
              {/* CSS Arc Gauge */}
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '6px solid rgba(255,255,255,0.1)', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(-45deg)' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', border: '6px solid var(--warning)', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(15deg)' }} />
            </div>
          </div>

          {/* Sharpe vs Beta */}
          <div className="glass-card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SHARPE RATIO</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginTop: '4px' }}><CountUp end={1.85} decimals={2} /></div>
            </div>
            <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>NIFTY BETA</div>
              <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginTop: '4px' }}><CountUp end={1.12} decimals={2} /></div>
            </div>
          </div>
        </div>

        {/* ROW 2: Donut, Heatmap, Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '4fr 5fr 3fr', gap: '16px', animation: 'fadeInUp 0.5s ease-out 0.15s backwards' }}>
          
          {/* Allocation Donut */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>PORTFOLIO ALLOCATION</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                    {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.9)', border: '1px solid var(--primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <Shield size={24} color="var(--primary)" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
              {allocationData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} /> {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Sector Heatmap */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px' }}>SECTOR HEATMAP</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', flex: 1 }}>
              {sectorData.map(sector => (
                <div key={sector.name} className="heatmap-tile" style={{
                  background: sector.color, borderRadius: '4px', padding: '12px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', opacity: 0.85
                }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{sector.name}</div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', marginTop: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {sector.change > 0 ? '+' : ''}{sector.change}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Feed */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px' }}>AGENT ACTIVITY FEED</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
              {agentFeed.map((feed, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: feed.color, marginTop: '4px', boxShadow: `0 0 8px ${feed.color}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#fff', lineHeight: '1.4' }}><span style={{ color: feed.color, fontWeight: 600 }}>{feed.agent}</span> → {feed.text}</div>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>{feed.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: Watchlist, Events */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', animation: 'fadeInUp 0.5s ease-out 0.3s backwards' }}>
          
          {/* Active Watchlist */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>ACTIVE WATCHLIST</span>
              <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>View All</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{item.ticker}</td>
                    <td style={{ padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 600 }}>₹{item.price.toFixed(2)}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{ background: item.change > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: item.change > 0 ? 'var(--success)' : 'var(--danger)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', width: '100px' }}>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.score}%`, height: '100%', background: item.score > 70 ? 'var(--success)' : item.score > 40 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <button onClick={() => navigate(`/analyze?q=${item.ticker}`)} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                        RE-ANALYZE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upcoming Events */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '16px' }}>UPCOMING EVENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${ev.urgency === 'red' ? 'var(--danger)' : ev.urgency === 'amber' ? 'var(--warning)' : 'var(--text-muted)'}` }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{ev.title}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}><Clock size={10} style={{ display: 'inline', marginRight: '4px' }}/>{ev.date}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: ev.urgency === 'red' ? 'var(--danger)' : ev.urgency === 'amber' ? 'var(--warning)' : '#fff' }}>
                    IN {ev.days} DAYS
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ROW 4: Quick Analyze Bar */}
        <div className="glass-card" style={{ 
          marginTop: '8px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px',
          border: '1px solid var(--primary)', boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
          animation: 'fadeInUp 0.5s ease-out 0.45s backwards'
        }}>
          <Zap size={24} color="var(--primary)" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="I have ₹1 lakh, should I buy NVIDIA?"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontFamily: 'var(--font-mono)', outline: 'none' }}
          />
          
          <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            {['NVDA', 'RELIANCE', 'TCS'].map(t => (
              <span key={t} onClick={() => setQuery(t)} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {t}
              </span>
            ))}
          </div>

          <button onClick={handleAnalyze} className="analyze-btn-charging" style={{ 
            background: 'var(--primary)', color: '#0a0f1e', border: 'none', padding: '12px 32px', borderRadius: '4px',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ANALYZE <ArrowRight size={16} />
          </button>
        </div>

      </div>

      <style>{`
        .glass-card {
          position: relative;
          background: rgba(10, 15, 30, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 212, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s, box-shadow 0.3s;
          overflow: hidden;
        }
        /* Mouse hover flashlight effect */
        .glass-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          background: radial-gradient(
            600px circle at var(--mouse-x, 0) var(--mouse-y, 0),
            rgba(0, 212, 255, 0.1),
            transparent 40%
          );
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: 0;
        }
        /* Inner content container to stay above the hover glow */
        .glass-card > * {
          position: relative;
          z-index: 1;
        }
        .glass-card:hover::before {
          opacity: 1;
        }
        .glass-card:hover {
          border-color: rgba(0, 212, 255, 0.4);
          box-shadow: 0 10px 40px rgba(0, 212, 255, 0.15), inset 0 0 0 1px rgba(0, 212, 255, 0.1);
          transform: translateY(-4px);
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .heatmap-tile:hover {
          transform: scale(1.05);
          opacity: 1 !important;
          z-index: 10;
          box-shadow: 0 0 15px rgba(255,255,255,0.2);
        }
        .analyze-btn-charging {
          position: relative;
          overflow: hidden;
        }
        .analyze-btn-charging::before {
          content: '';
          position: absolute;
          top: 0; left: 0; height: 100%; width: 0%;
          background: rgba(255,255,255,0.2);
          transition: width 0.3s ease;
        }
        .analyze-btn-charging:hover::before {
          width: 100%;
        }
      `}</style>
    </div>
  );
};
