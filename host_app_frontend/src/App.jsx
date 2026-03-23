import React, { Suspense, useState, useEffect } from 'react';
import './index.css';
import openIcon from './assets/icons/open.svg';
import closedIcon from './assets/icons/closed.svg';

const AdminApp = React.lazy(() => import('admin_app/AdminApp'));
const IncidentApp = React.lazy(() => import('incident_app/IncidentApp'));
const DispatchApp = React.lazy(() => import('dispatch_app/DispatchApp'));
const AnalyticsApp = React.lazy(() => import('analytics_app/AnalyticsApp'));

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('jwt', data.accessToken);
        setToken(data.accessToken);
        setError('');
      } else {
        setError(data.message || data.error || 'Login failed: Check credentials');
      }
    } catch (err) {
      setError('Connection to Auth Service (Port 3001) failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
  };

  const [activeModule, setActiveModule] = useState('incident');

  if (!token) {
    return (
      <div className="glass-panel" style={{ maxWidth: '550px', margin: '15vh auto', padding: '3.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Login</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            style={{ padding: '1.25rem', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            required
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', paddingRight: '3rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', boxSizing: 'border-box' }}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              <img src={showPassword ? openIcon : closedIcon} alt="Toggle Visibility" style={{ width: '26px', height: '26px', filter: 'invert(0.8)' }} />
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1.25rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Fixed Sticky Nav Bar */}
      <nav style={{
        flexShrink: 0,
        height: '60px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        zIndex: 1000,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        <h3 style={{ margin: 0, marginRight: 'auto', color: 'white' }}>Emergency System</h3>
        
        <div style={{ display: 'flex', height: '100%', alignItems: 'stretch' }}>
           <button onClick={() => setActiveModule('admin')} style={{ cursor: 'pointer', backgroundColor: activeModule === 'admin' ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', padding: '0 1.2rem', color: 'white', textDecoration: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s', fontSize: '1rem' }}>User Management</button>
           <button onClick={() => setActiveModule('incident')} style={{ cursor: 'pointer', backgroundColor: activeModule === 'incident' ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', padding: '0 1.2rem', color: 'white', textDecoration: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s', fontSize: '1rem' }}>Incidents</button>
           <button onClick={() => setActiveModule('dispatch')} style={{ cursor: 'pointer', backgroundColor: activeModule === 'dispatch' ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', padding: '0 1.2rem', color: 'white', textDecoration: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s', fontSize: '1rem' }}>Dispatch</button>
           <button onClick={() => setActiveModule('analytics')} style={{ cursor: 'pointer', backgroundColor: activeModule === 'analytics' ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', padding: '0 1.2rem', color: 'white', textDecoration: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s', fontSize: '1rem' }}>Analytics</button>
           <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', height: '100%', fontSize: '1rem' }}>Logout</button>
        </div>
      </nav>

      {/* Main Expanded Body Area */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeModule === 'admin' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Suspense fallback={<div style={{ padding: '2rem', color: 'white' }}>Loading Admin Module...</div>}>
              <AdminApp token={token} />
            </Suspense>
          </div>
        )}

        {activeModule === 'incident' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<div style={{ padding: '2rem', color: 'white' }}>Loading Incident Module...</div>}>
              <IncidentApp token={token} />
            </Suspense>
          </div>
        )}

        {activeModule === 'dispatch' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<div style={{ padding: '2rem', color: 'white' }}>Loading Dispatch Module...</div>}>
              <DispatchApp token={token} />
            </Suspense>
          </div>
        )}

        {activeModule === 'analytics' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Suspense fallback={<div style={{ padding: '2rem', color: 'white' }}>Loading Analytics Module...</div>}>
              <AnalyticsApp token={token} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
