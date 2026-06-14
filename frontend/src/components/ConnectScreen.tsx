import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, Cpu, Shield, Globe } from 'lucide-react';

interface ConnectScreenProps {
  onAnalyze: (company: string) => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onAnalyze }) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [agentCount, setAgentCount] = useState(0);

  const examples = ['NVDA', 'AAPL', 'MSFT', 'RELIANCE', 'TCS', 'TSLA', 'GOOGL'];

  // Number counting animation for agents
  useEffect(() => {
    let current = 0;
    const target = 7;
    const interval = setInterval(() => {
      current += 1;
      setAgentCount(current);
      if (current >= target) {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Handle auto-complete suggestions
  useEffect(() => {
    if (searchValue.trim().length > 0) {
      const filtered = examples.filter(ex => 
        ex.toLowerCase().includes(searchValue.toLowerCase()) && 
        ex.toLowerCase() !== searchValue.toLowerCase()
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchValue]);

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
        color: Math.random() > 0.5 ? '#00d4ff' : '#00a8cc', // Cyan/Teal
        alpha: Math.random() * 0.5 + 0.2,
        glow: Math.random() > 0.8,
      });
    }

    const draw = () => {
      // Dark navy background
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, width, height);

      // Render radial glow in background
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, width / 1.5
      );
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
      gradient.addColorStop(0.5, 'rgba(10, 15, 30, 0.9)');
      gradient.addColorStop(1, '#0a0f1e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render faint cyan grid lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 60;
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

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Background Particles */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />

      {/* Landing Cockpit Info Bar (Top Left) */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', gap: '24px', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-dot-pulse"></div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--success)' }}>SYSTEM: READY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
          <Cpu size={16} color="var(--primary)" />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', color: 'var(--text-muted)' }}>
            AGENTS IN COMMITTEE: {agentCount}
          </span>
        </div>
      </div>

      {/* Main Form content (Perfectly Centered) */}
      <div className="glass-panel" style={{
        position: 'relative',
        zIndex: 2,
        padding: '48px',
        width: '100%',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'rgba(10, 15, 30, 0.85)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 212, 255, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Scanline Overlay */}
        <div className="scanline-overlay"></div>

        {/* Decorative cybernetic corner brackets (Inside the card) */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '2px solid var(--primary)', borderRight: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '2px solid var(--primary)', borderRight: '2px solid var(--primary)' }}></div>

        {/* Futuristic top emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--primary)' }}>
          <Shield size={24} className="pulse-glow-icon" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, letterSpacing: '3px' }}>SECURE BOARDROOM CONNECT</span>
        </div>

        {/* Title with Glitch Effect */}
        <h1 className="glitch-text" style={{
          fontSize: '44px',
          fontWeight: 700,
          letterSpacing: '8px',
          lineHeight: '1.2',
          background: 'linear-gradient(180deg, #ffffff 30%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-display)',
          marginBottom: '8px',
          position: 'relative'
        }}>
          FINPILOT AI
        </h1>

        <h2 className="letter-spacing-anim" style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--primary)',
          textTransform: 'uppercase',
          marginBottom: '32px',
          textShadow: '0 0 10px rgba(0, 212, 255, 0.4)'
        }}>
          THE AI INVESTMENT COMMITTEE
        </h2>

        {/* Separator line */}
        <div style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)',
          marginBottom: '32px'
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
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '560px', position: 'relative', marginBottom: '32px' }}>
          <div className="glass-input-container">
            <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
            <input
              type="text"
              className="search-input-landing"
              placeholder="Search ticker (e.g. NVIDIA, AAPL, MSFT, RELIANCE, TCS)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ paddingRight: '120px', fontFamily: 'var(--font-mono)', fontSize: '13px', transition: 'all 0.3s' }}
            />
            <button
              type="submit"
              className="btn-cyber btn-charge"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '8px 24px',
                fontSize: '11px',
                clipPath: 'polygon(10% 0%, 100% 0%, 100% 70%, 90% 100%, 0% 100%, 0% 30%)',
              }}
            >
              ANALYZE
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
                    setSuggestions([]);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '13px',
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>POPULAR SECURED TICKERS:</span>
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onAnalyze(ex)}
              className="chip-landing"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(0, 212, 255, 0.1)',
                borderRadius: '4px',
                padding: '6px 12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
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
    </div>
  );
};
