import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Presentation, PieChart, Activity, Clock, Settings, Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout: React.FC = () => {
  const [showDoors, setShowDoors] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowDoors(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#050816', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      
      {/* Sci-Fi Door Opening Animation */}
      {showDoors && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, display: 'flex', pointerEvents: 'none' }}>
          
          {/* Laser Core */}
          <div className="laser-core" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '4px', height: '100%', background: '#fff', zIndex: 100000, animation: 'laserPowerUp 1.5s cubic-bezier(0.7, 0, 0.3, 1) forwards' }} />

          <div style={{ flex: 1, background: 'linear-gradient(90deg, #02040a 0%, #0a0f1e 100%)', borderRight: '2px solid rgba(0, 212, 255, 0.8)', boxShadow: '10px 0 50px rgba(0, 212, 255, 0.4)', animation: 'slideOpenLeft 1s cubic-bezier(0.8, 0, 0.2, 1) 0.8s forwards', position: 'relative', overflow: 'hidden' }}>
             {/* Hex Texture */}
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
             <div className="glitch-text" style={{ position: 'absolute', top: '50%', right: '40px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '4px', fontWeight: 700, textShadow: '0 0 10px var(--primary)' }}>SYSTEM.UNLOCK</div>
          </div>
          <div style={{ flex: 1, background: 'linear-gradient(270deg, #02040a 0%, #0a0f1e 100%)', borderLeft: '2px solid rgba(0, 212, 255, 0.8)', boxShadow: '-10px 0 50px rgba(0, 212, 255, 0.4)', animation: 'slideOpenRight 1s cubic-bezier(0.8, 0, 0.2, 1) 0.8s forwards', position: 'relative', overflow: 'hidden' }}>
             {/* Hex Texture */}
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
             <div className="glitch-text" style={{ position: 'absolute', top: '50%', left: '40px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '4px', fontWeight: 700, textShadow: '0 0 10px var(--primary)' }}>ACCESS.GRANTED</div>
          </div>
        </div>
      )}
      
      {/* Top Navbar */}
      <header style={{ 
        height: '70px', 
        borderBottom: '1px solid var(--border-glass)', 
        background: 'rgba(8, 12, 28, 0.95)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '32px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={24} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 5px var(--primary-glow))' }} />
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: 'var(--primary)', letterSpacing: '2px', margin: 0 }}>FINPILOT</h2>
        </div>
        
        {/* Navigation Links */}
        <nav style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
          <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/analyze" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            <Presentation size={16} /> Analysis Boardroom
          </NavLink>
          <NavLink to="/portfolio" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            <PieChart size={16} /> Portfolio
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            <Clock size={16} /> Reports
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            <Settings size={16} /> Settings
          </NavLink>
        </nav>

        {/* User Profile / Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STATUS: <span style={{ color: 'var(--success)' }}>ONLINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{user?.user_metadata?.full_name || 'Terminal User'}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={16} color="#fff" />
              )}
            </div>
            <button 
              onClick={signOut}
              title="Logout"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', color: 'var(--danger)', marginLeft: '8px', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>

      <style>{`
        .navbar-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-mono);
          height: 100%;
          position: relative;
          transition: all 0.3s;
        }
        .navbar-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          transform-origin: center;
          box-shadow: 0 -2px 10px rgba(0, 212, 255, 0.5);
        }
        .navbar-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }
        .navbar-link.active {
          color: var(--primary);
          background: linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.08) 100%);
        }
        .navbar-link.active::after {
          transform: scaleX(1);
        }
        @keyframes slideOpenLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); display: none; }
        }
        @keyframes slideOpenRight {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); display: none; }
        }
        @keyframes laserPowerUp {
          0% { box-shadow: 0 0 0 rgba(0, 212, 255, 0); opacity: 0; }
          20% { box-shadow: 0 0 50px rgba(0, 212, 255, 1); opacity: 1; }
          50% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.8); opacity: 0.8; }
          80% { box-shadow: 0 0 100px rgba(0, 212, 255, 1); opacity: 1; transform: translateX(-50%) scaleX(2); }
          100% { box-shadow: 0 0 0 rgba(0, 212, 255, 0); opacity: 0; transform: translateX(-50%) scaleX(0); }
        }
        .glitch-text {
          animation: textGlitch 0.8s steps(2, start) forwards;
        }
        @keyframes textGlitch {
          0% { opacity: 0; transform: scale(0.9); }
          20% { opacity: 1; transform: scale(1.1); }
          40% { opacity: 0; transform: scale(0.95); }
          60% { opacity: 1; transform: scale(1.05); }
          80% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
