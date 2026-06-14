import React, { useState } from 'react';
import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
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
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import FloatingChatAssistant from './components/FloatingChatAssistant';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0f1e', color: '#00d4ff' }}>
        <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,212,255,0.3)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

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

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/connect" element={<ConnectScreen onAnalyze={(ticker) => navigate(`/analyze?q=${encodeURIComponent(ticker)}`)} />} />
      
      {/* Protected Dashboard pages */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
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

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <FloatingChatAssistant />
    </AuthProvider>
  );
}

export default App;
