import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const mockHistory = [
  { id: '1', date: '2026-06-12', ticker: 'NVDA', recommendation: 'BUY', signalScore: 8.5, riskScore: 7.2 },
  { id: '2', date: '2026-06-10', ticker: 'TSLA', recommendation: 'HOLD', signalScore: 5.4, riskScore: 8.9 },
  { id: '3', date: '2026-06-08', ticker: 'HDFCBANK', recommendation: 'BUY', signalScore: 7.8, riskScore: 4.1 },
];

export const HistoryScreen: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Analysis History</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mockHistory.map((item) => (
          <div key={item.id} className="glass-panel" style={{ overflow: 'hidden' }}>
            {/* Header row (clickable) */}
            <div 
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedId === item.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {expandedId === item.id ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{item.ticker}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SIGNAL SCORE</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{item.signalScore}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>RISK SCORE</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>{item.riskScore}</span>
                </div>
                <div style={{ width: '80px', textAlign: 'center', padding: '6px 12px', borderRadius: '4px', background: item.recommendation === 'BUY' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 209, 102, 0.1)', color: item.recommendation === 'BUY' ? 'var(--primary)' : 'var(--warning)', fontWeight: 600, fontSize: '12px' }}>
                  {item.recommendation}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === item.id && (
              <div style={{ padding: '24px', borderTop: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>BULL THESIS (PROS)</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      Strong revenue growth in Q3.
                    </li>
                    <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      MACD indicates bullish crossover.
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>BEAR THESIS (CONS)</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <XCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      High systemic risk due to sector rotation.
                    </li>
                  </ul>
                </div>
                <div style={{ gridColumn: '1 / span 2', marginTop: '12px' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 16px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                    <FileText size={14} /> VIEW FULL JSON REPORT
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
