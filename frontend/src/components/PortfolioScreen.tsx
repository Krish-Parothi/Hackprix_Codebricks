import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const mockHoldings = [
  { ticker: 'RELIANCE', qty: 150, avg: 2450.5, current: 2890.0, pnl: 65925 },
  { ticker: 'HDFCBANK', qty: 300, avg: 1550.0, current: 1420.5, pnl: -38850 },
  { ticker: 'TCS', qty: 50, avg: 3600.0, current: 4100.0, pnl: 25000 },
  { ticker: 'INFY', qty: 100, avg: 1400.0, current: 1650.0, pnl: 25000 },
];

const COLORS = ['#00d4ff', '#ff3366', '#ffd166', '#06d6a0'];

export const PortfolioScreen: React.FC = () => {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Portfolio Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Left Column: Holdings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>CURRENT HOLDINGS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>TICKER</th>
                  <th style={{ padding: '12px 8px' }}>QTY</th>
                  <th style={{ padding: '12px 8px' }}>AVG PRICE</th>
                  <th style={{ padding: '12px 8px' }}>LTP</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>P&L</th>
                </tr>
              </thead>
              <tbody>
                {mockHoldings.map((h, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--primary)' }}>{h.ticker}</td>
                    <td style={{ padding: '12px 8px' }}>{h.qty}</td>
                    <td style={{ padding: '12px 8px' }}>₹{h.avg.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px' }}>₹{h.current.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', color: h.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>AI REBALANCING SUGGESTIONS</h3>
              <RefreshCw size={16} color="var(--primary)" />
            </div>
            <div style={{ padding: '16px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <ShieldAlert size={18} color="var(--danger)" style={{ marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>Reduce HDFCBANK Exposure</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Your portfolio is heavily skewed towards financials. AI suggests cutting HDFCBANK exposure by 15% due to recent margin compressions detected in the earnings call.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Allocation */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>ALLOCATION</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockHoldings.map(h => ({ name: h.ticker, value: h.qty * h.current }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockHoldings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{ background: 'rgba(8,12,28,0.9)', border: '1px solid var(--primary)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {mockHoldings.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                  <span>{h.ticker}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
