import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Activity, Cpu, Shield, Globe } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface LandingScreenProps {
  onAnalyze: (company: string) => void;
}

const examples = ['NVDA', 'AAPL', 'MSFT', 'RELIANCE', 'TCS', 'TSLA', 'GOOGL'];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onAnalyze }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [authUserLabel, setAuthUserLabel] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsOtp, setSmsOtp] = useState('');
  const [smsStep, setSmsStep] = useState<'phone' | 'code'>('phone');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetAuthFlow = () => {
    setAuthStatus('');
    setPhoneNumber('');
    setSmsOtp('');
    setSmsStep('phone');
  };

  const suggestions = useMemo(() => {
   if (searchValue.trim().length === 0) {
     return [];
   }

   return examples.filter(ex =>
     ex.toLowerCase().includes(searchValue.toLowerCase()) &&
     ex.toLowerCase() !== searchValue.toLowerCase()
   );
  }, [searchValue]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setAuthUserLabel(data.session?.user.email ?? data.session?.user.id ?? null);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserLabel(session?.user.email ?? session?.user.id ?? null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Particle background simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles: green/cyan particles moving upwards/downwards representing stock tickers
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      glow: boolean;
    }

    const particles: Particle[] = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.1, // Drift upwards
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? '#00d4ff' : '#14f195', // Cyan or Green
        alpha: Math.random() * 0.5 + 0.2,
        glow: Math.random() > 0.8,
      });
    }

    const draw = () => {
      ctx.fillStyle = '#050816';
      ctx.fillRect(0, 0, width, height);

      // Render radial glow in background
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, width / 1.5
      );
      gradient.addColorStop(0, 'rgba(11, 16, 32, 0.6)');
      gradient.addColorStop(0.5, 'rgba(5, 8, 22, 0.9)');
      gradient.addColorStop(1, '#050816');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render grid grid lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        if (p.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
        }

        ctx.fill();
        ctx.restore();

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Reset if goes off screen
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onAnalyze(searchValue.trim().toUpperCase());
    } else {
      onAnalyze('NVIDIA');
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthStatus('');

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthStatus(error.message);
      setAuthLoading(false);
      return;
    }

    setAuthUserLabel(null);
    setIsAuthOpen(false);
    resetAuthFlow();
    setAuthStatus('Signed out.');
    setAuthLoading(false);
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthStatus('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setAuthStatus(error.message);
      setAuthLoading(false);
    }
  };

  const handleSendSmsOtp = async () => {
    setAuthLoading(true);
    setAuthStatus('');

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber.trim(),
    });

    if (error) {
      setAuthStatus(error.message);
      setAuthLoading(false);
      return;
    }

    setSmsStep('code');
    setAuthStatus('Verification code sent by SMS.');
    setAuthLoading(false);
  };

  const handleVerifySmsOtp = async () => {
    setAuthLoading(true);
    setAuthStatus('');

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber.trim(),
      token: smsOtp.trim(),
      type: 'sms',
    });

    if (error) {
      setAuthStatus(error.message);
      setAuthLoading(false);
      return;
    }

    setAuthUserLabel(data.user?.phone ?? data.user?.email ?? data.user?.id ?? phoneNumber);
    setIsAuthOpen(false);
    resetAuthFlow();
    setAuthStatus('SMS sign-in successful.');
    setAuthLoading(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Background Particles */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />

      {/* Decorative cybernetic frames */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        bottom: '20px',
        border: '1px solid rgba(0, 212, 255, 0.08)',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px', borderTop: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '15px', height: '15px', borderTop: '2px solid var(--primary)', borderRight: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '15px', height: '15px', borderBottom: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px', borderBottom: '2px solid var(--primary)', borderRight: '2px solid var(--primary)' }}></div>
      </div>

      {/* Landing Cockpit Info Bar */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', gap: '24px', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
          <Activity size={16} color="var(--primary)" />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--text-muted)' }}>SYSTEM: READY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
            <Cpu size={16} color="var(--success)" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--text-muted)' }}>AGENTS IN COMMITTEE: 7</span>
          </div>
          {authUserLabel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: '1px solid rgba(20, 241, 149, 0.2)',
                borderRadius: '999px',
                background: 'rgba(20, 241, 149, 0.08)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--success)'
              }}>
                {authUserLabel}
              </div>
              <button
                type="button"
                className="btn-cyber"
                style={{ padding: '8px 16px', fontSize: '11px' }}
                onClick={handleSignOut}
                disabled={authLoading}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-cyber btn-cyber-success"
              style={{ padding: '8px 16px', fontSize: '11px' }}
              onClick={() => {
                resetAuthFlow();
                setIsAuthOpen(true);
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Main Form content */}
      <div className="glass-panel" style={{
        position: 'relative',
        zIndex: 2,
        padding: '50px 60px',
        width: '90%',
        maxWidth: '780px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'rgba(5, 8, 22, 0.75)',
        borderColor: 'rgba(0, 212, 255, 0.15)',
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 212, 255, 0.05)',
      }}>
        {/* Futuristic top emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', color: 'var(--primary)' }}>
          <Shield size={24} style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, letterSpacing: '3px' }}>SECURE BOARDROOM CONNECT</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '40px',
          fontWeight: 700,
          letterSpacing: '8px',
          lineHeight: '1.2',
          background: 'linear-gradient(180deg, #ffffff 30%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-display)',
          marginBottom: '5px'
        }}>
          FINPILOT AI
        </h1>
        <h2 style={{
          fontSize: '9px',
          fontFamily: 'var(--font-display)',
          color: 'var(--primary)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '25px',
          textShadow: '0 0 10px rgba(0, 212, 255, 0.4)'
        }}>
          THE AI INVESTMENT COMMITTEE
        </h2>

        {/* Separator line */}
        <div style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.4), transparent)',
          marginBottom: '25px'
        }}></div>

        {/* Subtitle */}
        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          maxWidth: '540px',
          marginBottom: '40px',
          fontWeight: 300,
        }}>
          Building Better Financial Decisions Through Collaborative AI Intelligence.
          Convening an executive-level board of expert financial models to debate and yield high-conviction signals.
        </p>

        {/* Search / Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '560px', position: 'relative', marginBottom: '25px' }}>
          <div className="glass-input-container">
            <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
            <input
              type="text"
              placeholder="Search ticker (e.g. NVIDIA, AAPL, MSFT, RELIANCE, TCS)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ paddingRight: '120px' }}
            />
            <button
              type="submit"
              className="btn-cyber"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 20px',
                fontSize: '11px',
                clipPath: 'polygon(10% 0%, 100% 0%, 100% 70%, 90% 100%, 0% 100%, 0% 30%)',
              }}
            >
              Analyze
            </button>
          </div>

          {/* Autocomplete suggestion drop-down */}
          {suggestions.length > 0 && (
            <div className="glass-panel-heavy" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              zIndex: 10,
              padding: '6px',
              textAlign: 'left'
            }}>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  onClick={() => {
                    setSearchValue(suggestion);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Example items */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>POPULAR SECURED TICKERS:</span>
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onAnalyze(ex)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 212, 255, 0.1)',
                borderRadius: '4px',
                padding: '4px 10px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ position: 'absolute', bottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.5, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={12} color="var(--primary)" />
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>FINPILOT DECISION ENGINES VER 3.5.0</span>
        </div>
      </div>

      {isAuthOpen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 8, 22, 0.72)',
          backdropFilter: 'blur(10px)',
        }}>
          <div className="glass-panel-heavy" style={{
            width: '90%',
            maxWidth: '420px',
            padding: '28px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '2px' }}>
                  SECURE ACCESS
                </div>
                <h3 style={{ fontSize: '22px', marginTop: '4px' }}>Sign In</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetAuthFlow();
                  setIsAuthOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                resetAuthFlow();
                handleGoogleAuth();
              }}
              className="btn-cyber btn-cyber-success"
              style={{
                width: '100%',
                marginBottom: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              disabled={authLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.1-1.4 3.3-5.5 3.3A6.4 6.4 0 1 1 12 5.6c1.8 0 3 .8 3.7 1.4l2.6-2.5A10.1 10.1 0 0 0 12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.3-.2-1.9H12z"/>
              </svg              >
                Continue with Google
              </button>

              <div style={{ marginBottom: '14px', padding: '14px', border: '1px solid var(--border-glass)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '2px', marginBottom: '10px' }}>
                  SMS OTP AUTH
                </div>
                {smsStep === 'phone' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="tel"
                      placeholder="+15551234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendSmsOtp}
                      className="btn-cyber"
                      style={{ width: '100%', padding: '12px 16px' }}
                      disabled={authLoading || !phoneNumber.trim()}
                    >
                      Send SMS Code
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter verification code"
                      value={smsOtp}
                      onChange={(e) => setSmsOtp(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsStep('phone');
                          setSmsOtp('');
                          setAuthStatus('');
                        }}
                        className="btn-cyber"
                        style={{ flex: 1, padding: '12px 16px' }}
                        disabled={authLoading}
                      >
                        Change Number
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifySmsOtp}
                        className="btn-cyber btn-cyber-success"
                        style={{ flex: 1, padding: '12px 16px' }}
                        disabled={authLoading || !smsOtp.trim()}
                      >
                        Verify Code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', textAlign: 'center' }}>
                Use Google or mobile SMS OTP to sign in with Supabase.
              </div>
              {authStatus && (
                <div style={{ fontSize: '12px', color: authStatus.toLowerCase().includes('error') ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '12px' }}>
                  {authStatus}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
