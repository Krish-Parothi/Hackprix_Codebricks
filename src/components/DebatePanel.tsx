import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldAlert } from 'lucide-react';

interface DebatePanelProps {
  isActive: boolean;
  revealedPointsCount: number; // 0 to 4
  bullCase: string[];
  bearCase: string[];
}

export const DebatePanel: React.FC<DebatePanelProps> = ({
  isActive,
  revealedPointsCount,
  bullCase,
  bearCase
}) => {
  if (!isActive) return null;

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '850px',
      height: '350px',
      zIndex: 110,
      overflow: 'hidden',
      background: 'rgba(5, 8, 22, 0.95)',
      borderColor: 'rgba(0, 212, 255, 0.25)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 212, 255, 0.1)',
      display: 'grid',
      gridTemplateColumns: '1fr 1px 1fr',
      borderRadius: '16px'
    }}>
      {/* Background spotlights */}
      <div className={`spotlight bull ${revealedPointsCount >= 1 ? 'active' : ''}`} style={{ left: '15%', top: 0 }} />
      <div className={`spotlight bear ${revealedPointsCount >= 2 ? 'active' : ''}`} style={{ right: '15%', top: 0 }} />

      {/* Bull Case Section */}
      <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(20, 241, 149, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: '6px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <div>
            <h3 style={{ fontSize: '8px', fontFamily: 'var(--font-display)', color: 'var(--success)', letterSpacing: '1.5px' }}>EXPERT PANELIST</h3>
            <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}>BULL CASE</h4>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {bullCase.map((point, index) => {
            const isRevealed = revealedPointsCount > index * 2;
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateX(0)' : 'translateX(-20px)',
                  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                  padding: '10px 14px',
                  background: 'rgba(20, 241, 149, 0.03)',
                  borderLeft: '3px solid var(--success)',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                <ArrowUpRight size={16} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {point}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        background: 'linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.2), transparent)',
        height: '100%'
      }}></div>

      {/* Bear Case Section */}
      <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(255, 93, 115, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '6px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={20} color="var(--danger)" />
          </div>
          <div>
            <h3 style={{ fontSize: '8px', fontFamily: 'var(--font-display)', color: 'var(--danger)', letterSpacing: '1.5px' }}>EXPERT PANELIST</h3>
            <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}>BEAR CASE</h4>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {bearCase.map((point, index) => {
            const isRevealed = revealedPointsCount > index * 2 + 1;
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                  padding: '10px 14px',
                  background: 'rgba(255, 93, 115, 0.03)',
                  borderLeft: '3px solid var(--danger)',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                <ArrowDownRight size={16} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {point}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cyber overlay indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-medium)',
        border: '1px solid var(--border-cyan)',
        padding: '4px 12px',
        borderRadius: '10px',
        fontSize: '7px',
        fontFamily: 'var(--font-display)',
        letterSpacing: '1.5px',
        color: 'var(--primary)'
      }}>
        LIVE CORRELATION DEBATE
      </div>
    </div>
  );
};
