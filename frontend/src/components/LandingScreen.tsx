import React, { useEffect, useRef } from 'react';
import { Shield, Activity, Cpu, ArrowRight, Zap, Globe, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle background simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[] = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.1, // Drift upwards
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animationFrameId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#fff', fontFamily: 'var(--font-main)', overflowX: 'hidden' }}>
      
      {/* Navbar */}
      <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 212, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} color="var(--primary)" />
          <h1 style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '2px' }}>FINPILOT <span style={{ color: 'var(--primary)' }}>AI</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Features</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Agents</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Documentation</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ padding: '80px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
        
        {/* Particle Canvas */}
        <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />
        
        {/* Animated Perspective Grid Background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          transformOrigin: 'top center',
          zIndex: 0, pointerEvents: 'none', opacity: 0.5
        }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(10,15,30,0) 60%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ zIndex: 1, maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '30px', border: '1px solid rgba(0, 212, 255, 0.3)', marginBottom: '40px', boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', letterSpacing: '2px', fontWeight: 600 }}>SYSTEM ONLINE • V3.5 DEPLOYED</span>
          </div>

          <h2 style={{ fontSize: '72px', fontFamily: 'var(--font-main)', fontWeight: 800, lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px', textAlign: 'center' }}>
            The AI Investment <br />
            <span style={{ background: 'linear-gradient(90deg, #fff 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(0,212,255,0.3)' }}>Boardroom is Open.</span>
          </h2>

          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '56px', maxWidth: '650px', margin: '0 auto 56px auto', textAlign: 'center' }}>
            Convene an executive-level board of expert financial models. Watch them debate, analyze real-time data, and yield high-conviction signals for your portfolio.
          </p>

          <button 
            onClick={() => navigate('/dashboard')}
            className="premium-btn"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '16px', 
              padding: '20px 48px', background: 'transparent', color: 'var(--primary)',
              border: '2px solid var(--primary)', borderRadius: '4px', fontSize: '18px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '2px',
              cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
            }}
          >
            <span style={{ zIndex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>ENTER TERMINAL <ArrowRight size={24} /></span>
          </button>
          
          <style>{`
            .premium-btn::before {
              content: '';
              position: absolute;
              top: 0; left: 0; width: 0%; height: 100%;
              background: var(--primary);
              transition: width 0.4s cubic-bezier(0.7, 0, 0.3, 1);
              z-index: 1;
            }
            .premium-btn:hover::before {
              width: 100%;
            }
            .premium-btn:hover span {
              color: #0a0f1e;
            }
            .premium-btn {
              box-shadow: 0 0 20px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.1);
            }
            .premium-btn:hover {
              box-shadow: 0 0 40px rgba(0, 212, 255, 0.6), inset 0 0 0 rgba(0, 212, 255, 0);
              transform: translateY(-2px) scale(1.02);
            }
          `}</style>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '100px', zIndex: 1, maxWidth: '1000px', width: '100%' }}>
          {[
            { icon: <Activity size={24} color="var(--success)" />, title: 'Real-Time Telemetry', desc: 'Live market data streaming directly into the analysis engine.' },
            { icon: <Cpu size={24} color="#8b5cf6" />, title: '7-Agent Committee', desc: 'Specialized LLMs debating bull/bear cases simultaneously.' },
            { icon: <Globe size={24} color="var(--warning)" />, title: 'Global Sentiment', desc: 'Real-time NLP scanning of news and insider transcripts.' }
          ].map((feature, i) => (
            <div key={i} style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'left', transition: 'all 0.3s' }}
                 onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
              <div style={{ marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};
