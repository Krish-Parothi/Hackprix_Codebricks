import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#fff', fontFamily: 'var(--font-main)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Elements */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(10,15,30,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Navbar Minimal */}
      <nav style={{ padding: '24px 48px', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Shield size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '2px' }}>FINPILOT <span style={{ color: 'var(--primary)' }}>AI</span></h1>
        </div>
      </nav>

      {/* Login Card */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, padding: '24px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '48px',
          width: '100%',
          maxWidth: '450px',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
        }}>
          <Shield size={48} color="var(--primary)" style={{ margin: '0 auto 24px auto', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.5))' }} />
          
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '12px', letterSpacing: '1px' }}>
            Terminal Access
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '40px', lineHeight: '1.5' }}>
            Authenticate to access the AI Investment Boardroom and your secure portfolio.
          </p>

          <button
            onClick={signInWithGoogle}
            className="google-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '16px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <style>{`
            .google-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
            }
            .google-btn:active {
              transform: translateY(0);
            }
          `}</style>
        </div>
      </main>
    </div>
  );
};
