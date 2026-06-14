import { useState } from 'react';
import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { LandingScreen } from './components/LandingScreen';
import { ConnectScreen } from './components/ConnectScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { PortfolioScreen } from './components/PortfolioScreen';
import { WatchlistScreen } from './components/WatchlistScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BoardroomScreen } from './components/BoardroomScreen';
import { VerdictReveal } from './components/VerdictReveal';

const AnalyzeRoute = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ticker = searchParams.get('q') || '';
  
  const [verdictActive, setVerdictActive] = useState(false);
  const [verdict, setVerdict] = useState<'BUY' | 'HOLD' | 'SELL'>('BUY');
  const [confidence, setConfidence] = useState(86);
  const [factors, setFactors] = useState<{ name: string; score: number }[]>([]);
  const [summaryText, setSummaryText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <BoardroomScreen
        ticker={ticker}
        onVerdictReached={handleVerdictReached}
        onSwitchToMonitoring={() => navigate('/watchlist')}
        onBackToLanding={() => navigate('/')}
      />
      
      <VerdictReveal
        isActive={verdictActive}
        ticker={ticker}
        verdict={verdict}
        confidence={confidence}
        factors={factors}
        summaryText={summaryText}
        threadId={threadId}
        onRestart={() => setVerdictActive(false)}
      />
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* Landing page has no navbar */}
      <Route path="/" element={<LandingScreen onAnalyze={(ticker) => navigate(`/analyze?q=${encodeURIComponent(ticker)}`)} />} />
      <Route path="/connect" element={<ConnectScreen onAnalyze={(ticker) => navigate(`/analyze?q=${encodeURIComponent(ticker)}`)} />} />
      
      {/* Dashboard pages have the Top Navbar */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/analyze" element={<AnalyzeRoute />} />
        <Route path="/portfolio" element={<PortfolioScreen />} />
        <Route path="/watchlist" element={<WatchlistScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  );
}

export default App;
