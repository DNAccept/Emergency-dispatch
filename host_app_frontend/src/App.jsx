import React, { Suspense, useState, useEffect } from 'react';
import './index.css';
import openIcon from './assets/icons/open.svg';
import closedIcon from './assets/icons/closed.svg';

const AdminApp = React.lazy(() => import('admin_app/AdminApp'));
const IncidentApp = React.lazy(() => import('incident_app/IncidentApp'));
const DispatchApp = React.lazy(() => import('dispatch_app/DispatchApp'));
const AnalyticsApp = React.lazy(() => import('analytics_app/AnalyticsApp'));

const MODULES = [
  { id: 'incident', label: 'Incidents', icon: '⚠' },
  { id: 'dispatch', label: 'Dispatch', icon: '📡' },
  { id: 'analytics', label: 'Analytics', icon: '◈' },
  { id: 'admin', label: 'User Mgmt', icon: '⊞' },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString('en-US', { hour12: false })}
      &nbsp;&nbsp;
      <span style={{ opacity: 0.5 }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
    </span>
  );
}

function LoadingScreen({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem', color: 'var(--text-muted)' }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(255,69,0,0.15)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading {label}...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState('incident');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('jwt', data.accessToken);
        setToken(data.accessToken);
      } else {
        setError(data.message || data.error || 'Invalid credentials');
      }
    } catch {
      setError('Auth service unreachable — check Port 3001');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('jwt'); setToken(null); };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,69,0,0.04) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.03) 0%, transparent 70%)' }} />
        </div>
        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '4px', background: 'rgba(255,69,0,0.12)', border: '1px solid rgba(255,69,0,0.3)', marginBottom: '1rem', fontSize: '1.6rem' }}>🚨</div>
            <h1 style={{ fontSize: '1.7rem', letterSpacing: '0.12em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>GHANA<span style={{ color: 'var(--primary)' }}>911</span></h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>National Emergency Dispatch Platform</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%' }} />
              Authorized Personnel Only
            </div>
            {error && (
              <div style={{ background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.25)', borderLeft: '3px solid var(--danger)', padding: '0.75rem 1rem', borderRadius: '2px', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ff8080' }}>
                ⚠ {error}
              </div>
            )}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label>Email Address</label>
                <input type="email" placeholder="operator@ghana.gov.gh" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <img src={showPassword ? closedIcon : openIcon} alt="toggle" style={{ width: 18, height: 18, filter: 'invert(0.5)' }} />
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.85rem', fontSize: '0.9rem', width: '100%' }}>
                {loading ? 'Authenticating...' : 'Access System →'}
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
            GOVT. OF GHANA · MINISTRY OF INTERIOR · RESTRICTED ACCESS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <nav style={{ flexShrink: 0, height: 54, background: 'rgba(6,10,15,0.98)', borderBottom: '1px solid rgba(255,69,0,0.15)', display: 'flex', alignItems: 'stretch', padding: '0 1.5rem 0 0', zIndex: 1000, boxShadow: '0 1px 0 rgba(255,69,0,0.1), 0 4px 20px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), rgba(255,69,0,0.2) 60%, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0 1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)', marginRight: '0.5rem', minWidth: 160 }}>
          <span style={{ fontSize: '1.1rem' }}>🚨</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1, color: 'var(--text-main)' }}>
              Ghana<span style={{ color: 'var(--primary)' }}>911</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>DISPATCH SYSTEM</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActiveModule(m.id)} style={{ cursor: 'pointer', background: activeModule === m.id ? 'rgba(255,69,0,0.1)' : 'transparent', border: 'none', borderBottom: activeModule === m.id ? '2px solid var(--primary)' : '2px solid transparent', padding: '0 1.1rem', color: activeModule === m.id ? 'var(--text-main)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <Clock />
          <button onClick={handleLogout} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(255,51,51,0.1)', color: '#ff8080', border: '1px solid rgba(255,51,51,0.25)', borderRadius: '2px', padding: '0.35rem 0.9rem', cursor: 'pointer', transition: 'all 0.15s' }}>
            Logout ⏻
          </button>
        </div>
      </nav>
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {activeModule === 'admin' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Suspense fallback={<LoadingScreen label="User Management" />}><AdminApp token={token} /></Suspense>
          </div>
        )}
        {activeModule === 'incident' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<LoadingScreen label="Incidents" />}><IncidentApp token={token} /></Suspense>
          </div>
        )}
        {activeModule === 'dispatch' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<LoadingScreen label="Dispatch" />}><DispatchApp token={token} /></Suspense>
          </div>
        )}
        {activeModule === 'analytics' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Suspense fallback={<LoadingScreen label="Analytics" />}><AnalyticsApp token={token} /></Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
