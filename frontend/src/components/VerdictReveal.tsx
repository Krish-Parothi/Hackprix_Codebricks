import React, { useEffect, useState } from 'react';
import { ShieldCheck, Download, Users, FileText, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface VerdictRevealProps {
  isActive: boolean;
  ticker: string;
  verdict: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  factors: { name: string; score: number }[];
  summaryText: string;
  threadId?: string | null;
  onRestart: () => void;
}

export const VerdictReveal: React.FC<VerdictRevealProps> = ({
  isActive,
  ticker,
  verdict,
  confidence,
  factors,
  summaryText,
  threadId,
  onRestart
}) => {
  const [animateProgress, setAnimateProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setAnimateProgress(confidence);
      }, 300);

      // Play audio summary automatically
      fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summaryText })
      })
      .then(res => res.blob())
      .then(blob => {
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          const audio = new Audio(url);
          audio.play().catch(e => console.log("Audio autoplay prevented", e));
        }
      })
      .catch(err => console.error("Voice synthesis failed", err));

      return () => clearTimeout(timer);
    } else {
      setAnimateProgress(0);
      setAudioUrl(null);
    }
  }, [isActive, confidence, summaryText]);

  if (!isActive) return null;

  // Color mappings
  const colorMap = {
    BUY: { text: 'var(--success)', glow: 'var(--success-glow)', textLight: '#dcfce7' },
    HOLD: { text: 'var(--warning)', glow: 'var(--warning-glow)', textLight: '#fef9c3' },
    SELL: { text: 'var(--danger)', glow: 'var(--danger-glow)', textLight: '#fee2e2' }
  };

  const currentColors = colorMap[verdict] || colorMap.BUY;

  // Calculate circular SVG parameters
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animateProgress / 100) * circumference;

  const handleExport = () => {
    const reportText = `
=========================================
      FINPILOT AI - BOARDROOM MINUTES
=========================================
Session ID: #AI-2026-001
Subject: ${ticker} Valuation & Strategy Deliberation
Timestamp: ${new Date().toLocaleString()}

COMMITTEE RECOMMENDATION: [ ${verdict} ]
Confidence Index: ${confidence}%

SUPPORTING DECISION FACTORS:
${factors.map(f => `- ${f.name}: ${f.score > 0 ? '+' : ''}${f.score}`).join('\n')}

COMMITTEE MINUTES SUMMARY:
${summaryText}

MEMBERS SIGN-OFF:
1. Chairperson AI (Deliberation Synthesis Model v5.2)
2. Market Analyst (Technical Signal Evaluator)
3. News Analyst (NLP Context Crawler)
4. Sentiment Analyst (Social/Institutional Momentum Parser)
5. Risk Officer (Sharpe/Volatility Assessment Module)
6. Bull Case Synthesizer (Opportunity Architect)
7. Bear Case Synthesizer (Structural Risk Evaluator)

=========================================
Generated securely by FinPilot AI Boardroom.
=========================================
`;
    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `FinPilot_Boardroom_Minutes_${ticker}_${verdict}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!threadId) {
      console.error("No thread ID to approve");
      return;
    }
    
    if (action === 'approve') {
      setShowPayment(true);
      return;
    }

    setIsProcessing(true);
    try {
      await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          action: action,
          user_id: 'demo_user'
        })
      });
      onRestart();
    } catch (err) {
      console.error("Failed to reject", err);
    }
    setIsProcessing(false);
  };
  
  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    if (threadId) {
      try {
        await fetch('/api/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            thread_id: threadId,
            action: 'approve',
            user_id: 'demo_user'
          })
        });
      } catch (e) {
        console.error("Failed to approve graph state", e);
      }
    }
    onRestart();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 8, 22, 0.9)',
      backdropFilter: 'blur(10px)',
      animation: 'fade-in-verdict 0.5s ease forwards'
    }}>
      <style>{`
        @keyframes fade-in-verdict {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up-panel {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="glass-panel-heavy" style={{
        width: '90%',
        maxWidth: '750px',
        padding: '40px',
        animation: 'slide-up-panel 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        background: 'rgba(11, 16, 32, 0.95)',
        border: '1px solid rgba(0, 212, 255, 0.25)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(0, 212, 255, 0.1)'
      }}>
        {/* Top bar header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 5px var(--primary-glow))' }} />
            <div>
              <h3 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px' }}>COMMITTEE RESOLUTION</h3>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>SESSION ID: #AI-2026-001</h4>
            </div>
          </div>
          <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', padding: '4px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            SUBJECT: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{ticker}</span>
          </div>
        </div>

        {/* Core Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '35px', alignItems: 'center' }}>
          {/* Left Side: Verdict Decision Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '3px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              FINAL RECOMMENDATION
            </span>
            <span style={{
              fontSize: '64px',
              fontWeight: 900,
              letterSpacing: '4px',
              color: currentColors.text,
              textShadow: `0 0 30px ${currentColors.glow}`,
              fontFamily: 'var(--font-sans)',
              marginBottom: '15px',
              animation: 'heartbeat 1.5s infinite ease-in-out'
            }}>
              {verdict}
            </span>

            {/* Confidence Circle */}
            <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Filled Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={currentColors.text}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.19, 1, 0.22, 1)' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {animateProgress}%
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                  CONFIDENCE
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Contributing Factors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h5 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              PROPORTIONAL DECISION WEIGHTS
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {factors.map((f, idx) => {
                const isPositive = f.score >= 0;
                const pct = Math.min(100, Math.abs(f.score) * 2.5);
                const scoreColor = isPositive ? 'var(--success)' : 'var(--danger)';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: scoreColor, fontWeight: 600 }}>
                        {isPositive ? '+' : ''}{f.score}
                      </span>
                    </div>
                    {/* Bar background */}
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: scoreColor,
                        borderRadius: '3px',
                        transition: 'width 1s cubic-bezier(0.19, 1, 0.22, 1)',
                        boxShadow: `0 0 5px ${scoreColor}`
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Meeting Minutes Summary */}
        <div style={{ marginTop: '25px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText size={16} color="var(--primary)" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '1px' }}>
              EXECUTIVE MINUTES SUMMARY
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {summaryText}
          </p>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isProcessing ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if(!isProcessing) {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if(!isProcessing) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <AlertTriangle size={14} />
            REJECT / HOLD
          </button>

          <button
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className="btn-cyber"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              fontSize: '12px',
              opacity: isProcessing ? 0.5 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckCircle size={14} />
            {isProcessing ? 'PROCESSING...' : 'APPROVE EXECUTION'}
          </button>
        </div>
      </div>
      
      <PaymentModal 
        isOpen={showPayment} 
        ticker={ticker} 
        amountToInvest={1.00} 
        onClose={() => setShowPayment(false)} 
        onPaymentSuccess={handlePaymentSuccess} 
      />
    </div>
  );
};
