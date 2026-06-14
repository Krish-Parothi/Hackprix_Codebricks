import React from 'react';
import { Bell, Play, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockWatchlist = [
  { ticker: 'NVDA', price: 125.40, change: 2.5, lastAnalyzed: '2 days ago', delta: '+4.2%' },
  { ticker: 'TSLA', price: 178.20, change: -1.2, lastAnalyzed: '1 week ago', delta: '-5.1%' },
  { ticker: 'TATAMOTORS', price: 980.50, change: 0.8, lastAnalyzed: 'Yesterday', delta: '+1.0%' },
];

export const WatchlistScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Watchlist Monitor</h1>
        <button className="btn-cyber" style={{ padding: '8px 16px', fontSize: '11px' }}>+ ADD SYMBOL</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px' }}>TICKER</th>
              <th style={{ padding: '12px 8px' }}>LTP</th>
              <th style={{ padding: '12px 8px' }}>DAY CHANGE</th>
              <th style={{ padding: '12px 8px' }}>LAST ANALYZED</th>
              <th style={{ padding: '12px 8px' }}>DELTA SINCE ANALYSIS</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {mockWatchlist.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '16px 8px', fontWeight: 600, color: '#fff' }}>{item.ticker}</td>
                <td style={{ padding: '16px 8px', fontFamily: 'var(--font-mono)' }}>${item.price.toFixed(2)}</td>
                <td style={{ padding: '16px 8px', color: item.change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </td>
                <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{item.lastAnalyzed}</td>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: item.delta.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
                    {item.delta.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {item.delta}
                  </div>
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Set Alert">
                      <Bell size={16} />
                    </button>
                    <button 
                      onClick={() => navigate(`/analyze?q=${item.ticker}`)}
                      style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid var(--primary)', borderRadius: '4px', padding: '4px 8px', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                    >
                      <Play size={12} /> RE-ANALYZE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
