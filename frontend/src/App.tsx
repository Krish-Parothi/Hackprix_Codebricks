import { useState, useEffect } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { BoardroomScreen } from './components/BoardroomScreen';
import { VerdictReveal } from './components/VerdictReveal';
import { MonitoringScreen } from './components/MonitoringScreen';
import { Shield } from 'lucide-react';

type ViewType = 'landing' | 'boardroom' | 'monitoring';

function App() {
  const [view, setView] = useState<ViewType>('landing');
  const [ticker, setTicker] = useState('NVIDIA');
  
  // Transition state
  const [isDoorAnimating, setIsDoorAnimating] = useState(false);
  const [isDoorClosed, setIsDoorClosed] = useState(true);

  // Verdict state
  const [verdictActive, setVerdictActive] = useState(false);
  const [verdict, setVerdict] = useState<'BUY' | 'HOLD' | 'SELL'>('BUY');
  const [confidence, setConfidence] = useState(86);
  const [factors, setFactors] = useState<{ name: string; score: number }[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  // Initial load transition: open the doors to reveal landing page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDoorClosed(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Cinematic view-transition doors animation
  const handleTransitionTo = (nextView: ViewType, selectedTicker?: string) => {
    setIsDoorAnimating(true);
    setIsDoorClosed(true); // Close the doors

    if (selectedTicker) {
      setTicker(selectedTicker);
    }

    // After doors close (1.2s), switch view behind doors
    setTimeout(() => {
      setView(nextView);
      setVerdictActive(false); // Reset verdict state

      // Open the doors again
      setTimeout(() => {
        setIsDoorClosed(false);
        // End animation status
        setTimeout(() => {
          setIsDoorAnimating(false);
        }, 1200);
      }, 300);
    }, 1200);
  };

  const handleVerdictReached = (
    rec: 'BUY' | 'HOLD' | 'SELL',
    conf: number,
    factList: { name: string; score: number }[],
    sumText: string,
    threadIdStr?: string
  ) => {
    setVerdict(rec);
    setConfidence(conf);
    setFactors(factList);
    setSummaryText(sumText);
    setVerdictActive(true);
    if (threadIdStr) setThreadId(threadIdStr);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#050816', overflow: 'hidden' }}>
      
      {/* Active screen rendering */}
      {view === 'landing' && (
        <LandingScreen onAnalyze={(tk) => handleTransitionTo('boardroom', tk)} />
      )}

      {view === 'boardroom' && (
        <BoardroomScreen
          ticker={ticker}
          onVerdictReached={handleVerdictReached}
          onSwitchToMonitoring={() => handleTransitionTo('monitoring')}
          onBackToLanding={() => handleTransitionTo('landing')}
        />
      )}

      {view === 'monitoring' && (
        <MonitoringScreen onBackToBoardroom={() => handleTransitionTo('boardroom')} />
      )}

      {/* Overlapping Verdict Reveal Dialog */}
      <VerdictReveal
        isActive={verdictActive}
        ticker={ticker}
        verdict={verdict}
        confidence={confidence}
        factors={factors}
        summaryText={summaryText}
        threadId={threadId}
        onRestart={() => handleTransitionTo('landing')}
      />

      {/* Cinematic Boardroom Transition Doors */}
      <div className={`door-container ${!isDoorClosed ? 'door-open' : ''}`}>
        <div className="door-left">
          <div className="door-logo">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px var(--primary-glow)',
              background: 'rgba(5, 8, 22, 0.8)'
            }}>
              <Shield size={40} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              color: 'var(--primary)',
              letterSpacing: '4px',
              textShadow: '0 0 10px var(--primary-glow)'
            }}>
              FINPILOT SECURE LINK
            </h2>
            <div style={{
              width: '120px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), transparent)'
            }} />
          </div>
        </div>
        <div className="door-right">
          <div className="door-logo" style={{ opacity: 0 }}>
            {/* Kept symmetric for visual alignment but invisible */}
            <div style={{ width: '80px', height: '80px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
