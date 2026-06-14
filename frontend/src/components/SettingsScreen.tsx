import React from 'react';

export const SettingsScreen: React.FC = () => {
  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Profile & Settings</h1>

      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Risk Profile */}
        <div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>RISK TOLERANCE</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Conservative</button>
            <button style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'rgba(0, 212, 255, 0.1)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Moderate</button>
            <button style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Aggressive</button>
          </div>
        </div>

        {/* Investment Goals */}
        <div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>PRIMARY GOAL</h3>
          <select style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}>
            <option value="growth">Capital Growth</option>
            <option value="income">Dividend Income</option>
            <option value="hedge">Hedging / Preservation</option>
          </select>
        </div>

        {/* Notifications */}
        <div>
          <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>NOTIFICATIONS</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#fff', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            Email alerts for Watchlist price targets
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#fff', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            Weekly AI Portfolio Rebalancing Suggestions
          </label>
        </div>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-cyber" style={{ padding: '12px 32px' }}>SAVE CHANGES</button>
        </div>
      </div>
    </div>
  );
};
