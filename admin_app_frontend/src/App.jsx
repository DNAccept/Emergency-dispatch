import React, { useState, useEffect } from 'react';
import eyeOpen from './assets/icons/open.svg';
import eyeClosed from './assets/icons/closed.svg';

const ROLE_COLORS = {
  SYSTEM_ADMIN: { bg: 'rgba(255,69,0,0.1)', color: '#ff8c5a', border: 'rgba(255,69,0,0.3)' },
  HOSPITAL_ADMIN: { bg: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: 'rgba(0,212,170,0.3)' },
  POLICE_ADMIN: { bg: 'rgba(26,111,255,0.1)', color: '#5599ff', border: 'rgba(26,111,255,0.3)' },
  FIRE_ADMIN: { bg: 'rgba(255,69,0,0.12)', color: '#ff6a3d', border: 'rgba(255,69,0,0.35)' },
  GOVT_EXECUTIVE: { bg: 'rgba(255,184,0,0.1)', color: '#ffb800', border: 'rgba(255,184,0,0.3)' },
  AMBULANCE_DRIVER: { bg: 'rgba(0,212,170,0.08)', color: '#40d9b8', border: 'rgba(0,212,170,0.25)' },
};

function RoleBadge({ role }) {
  const style = ROLE_COLORS[role] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '2px', background: style.bg, color: style.color, border: `1px solid ${style.border}`, letterSpacing: '0.05em' }}>
      {role?.replace(/_/g, ' ')}
    </span>
  );
}

const App = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');

  const [beds, setBeds] = useState(45);
  const [ambulances, setAmbulances] = useState(12);
  const [personnel, setPersonnel] = useState([{ id: 1, name: 'Dr. Sarah Smith', role: 'Trauma Surgeon', status: 'On Call' }]);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', status: 'Available' });

  const [officers, setOfficers] = useState([{ id: 1, name: 'Officer Jenkins', rank: 'Patrol', status: 'On Duty' }]);
  const [newOfficer, setNewOfficer] = useState({ name: '', rank: '', status: 'On Duty' });

  const [fireStats, setFireStats] = useState({ trucks: 4, activeFires: 1, readiness: 'High' });

  const jwt = token || localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      fetch('https://auth-service-spk6.onrender.com/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    }
  }, [jwt]);

  const role = profile?.role || profile?.user?.role;
  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const isPoliceAdmin = role === 'POLICE_ADMIN';
  const isFireAdmin = role === 'FIRE_ADMIN';
  const isSystemAdmin = role === 'SYSTEM_ADMIN';

  const fetchUsers = () => {
    if (jwt && isSystemAdmin) {
      setUsersLoading(users.length === 0);
      fetch('https://auth-service-spk6.onrender.com/auth/users', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setUsers(d); setUsersLoading(false); })
        .catch(() => setUsersLoading(false));
    }
  };

  useEffect(() => {
    fetchUsers();
    // Regular polling for real-time updates
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [jwt, isSystemAdmin]);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (newStaff.name) { setPersonnel([...personnel, { ...newStaff, id: Date.now() }]); setNewStaff({ name: '', role: '', status: 'Available' }); }
  };

  const handleAddOfficer = (e) => {
    e.preventDefault();
    if (newOfficer.name) { setOfficers([...officers, { ...newOfficer, id: Date.now() }]); setNewOfficer({ name: '', rank: '', status: 'On Duty' }); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(''); setRegisterSuccess('');
    try {
      const res = await fetch('https://auth-service-spk6.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(registerForm)
      });
      if (res.ok) {
        setRegisterSuccess(`User "${registerForm.name}" registered successfully.`);
        setRegisterForm({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });
        fetchUsers(); // Update list in real-time
      } else {
        const d = await res.json();
        setRegisterError(d.message || d.error || 'Registration failed');
      }
    } catch { setRegisterError('Network error'); }
  };

  const sectionRow = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: color || 'var(--text-main)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Profile Header */}
      <div className="section-header">
        <div>
          <div className="section-title">User <span>Management</span></div>
          {role && <div style={{ marginTop: 4 }}><RoleBadge role={role} /></div>}
        </div>
        {profile && !profile.error && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.04em' }}>{profile.name || profile.user?.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{profile.email || profile.user?.email}</div>
          </div>
        )}
      </div>

      {/* Hospital Admin Panel */}
      {isHospitalAdmin && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, background: 'var(--secondary)', borderRadius: '50%', display: 'inline-block' }} />
            Hospital Capacity Control
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {[['Available Beds', beds, setBeds, 'var(--secondary)'], ['Ambulances Ready', ambulances, setAmbulances, 'var(--warning)']].map(([lbl, val, setter, color]) => (
              <div key={lbl} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1rem' }}>
                <div className="stat-card-label">{lbl}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setter(Math.max(0, val - 1))} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '1.1rem' }}>−</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{val}</span>
                  <button onClick={() => setter(val + 1)} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '1.1rem' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Medical Personnel</div>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
            {personnel.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', borderBottom: i < personnel.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.name}</span>
                  <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.role}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: p.status === 'Available' ? 'var(--secondary)' : 'var(--warning)' }}>{p.status}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}><input placeholder="Staff Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><input placeholder="Role (e.g. Nurse)" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} required /></div>
            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
          </form>
        </div>
      )}

      {/* Police Admin Panel */}
      {isPoliceAdmin && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--police-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, background: 'var(--police-blue)', borderRadius: '50%', display: 'inline-block' }} />
            Officers Roll Call
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
            {officers.map((o, i) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', borderBottom: i < officers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{o.name}</span>
                  <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.rank}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: o.status === 'On Duty' ? 'var(--secondary)' : 'var(--text-muted)' }}>{o.status}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddOfficer} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}><input placeholder="Officer Name" value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><input placeholder="Rank / Title" value={newOfficer.rank} onChange={e => setNewOfficer({ ...newOfficer, rank: e.target.value })} required /></div>
            <button type="submit" className="btn" style={{ background: 'rgba(26,111,255,0.15)', color: '#5599ff', border: '1px solid rgba(26,111,255,0.3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 1rem', borderRadius: '2px', cursor: 'pointer' }}>+ Add</button>
          </form>
        </div>
      )}

      {/* Fire Admin Panel */}
      {isFireAdmin && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fire-red)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, background: 'var(--fire-red)', borderRadius: '50%', display: 'inline-block' }} />
            Fire Station Readiness
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: 'rgba(255,69,0,0.06)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '3px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Available Fire Trucks</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => setFireStats({ ...fireStats, trucks: Math.max(0, fireStats.trucks - 1) })} className="btn btn-ghost" style={{ padding: '0.25rem 0.65rem' }}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', color: '#ff8c5a', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{fireStats.trucks}</span>
                <button onClick={() => setFireStats({ ...fireStats, trucks: fireStats.trucks + 1 })} className="btn btn-ghost" style={{ padding: '0.25rem 0.65rem' }}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: 'rgba(255,69,0,0.06)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '3px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Station Readiness Level</span>
              <select value={fireStats.readiness} onChange={e => setFireStats({ ...fireStats, readiness: e.target.value })} style={{ width: 'auto', background: 'rgba(0,0,0,0.4)', color: fireStats.readiness === 'High' ? 'var(--secondary)' : fireStats.readiness === 'Low' ? 'var(--danger)' : 'var(--warning)' }}>
                <option value="High" style={{ color: 'black' }}>High</option>
                <option value="Moderate" style={{ color: 'black' }}>Moderate</option>
                <option value="Low" style={{ color: 'black' }}>Low</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.25rem', width: '100%', background: 'var(--fire-red)', borderColor: 'rgba(255,69,0,0.4)' }}>📢 Broadcast Status Update</button>
        </div>
      )}

      {/* System Admin Panel */}
      {isSystemAdmin && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button onClick={() => setShowRegister(false)} className="btn" style={{ flex: 1, background: !showRegister ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.04)', color: !showRegister ? 'var(--primary)' : 'var(--text-muted)', border: `1px solid ${!showRegister ? 'rgba(255,69,0,0.35)' : 'rgba(255,255,255,0.08)'}`, fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.15s' }}>
              ⊞ All Users
            </button>
            <button onClick={() => setShowRegister(true)} className="btn" style={{ flex: 1, background: showRegister ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.04)', color: showRegister ? 'var(--primary)' : 'var(--text-muted)', border: `1px solid ${showRegister ? 'rgba(255,69,0,0.35)' : 'rgba(255,255,255,0.08)'}`, fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.15s' }}>
              + Register User
            </button>
          </div>

          {showRegister && (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>New User Registration</div>
              {registerSuccess && <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderLeft: '3px solid var(--secondary)', padding: '0.7rem 1rem', marginBottom: '1rem', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--secondary)' }}>✓ {registerSuccess}</div>}
              {registerError && <div style={{ background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.25)', borderLeft: '3px solid var(--danger)', padding: '0.7rem 1rem', marginBottom: '1rem', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ff8080' }}>⚠ {registerError}</div>}
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label>Full Name</label><input placeholder="e.g. Kofi Mensah" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} required /></div>
                  <div><label>Email</label><input type="email" placeholder="user@ghana.gov.gh" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••••••" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required style={{ paddingRight: '2.8rem' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <img src={showPassword ? eyeClosed : eyeOpen} alt="toggle" style={{ width: 17, height: 17, filter: 'invert(0.5)' }} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label>Role</label>
                    <select value={registerForm.role} onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}>
                      {['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN','GOVT_EXECUTIVE','AMBULANCE_DRIVER'].map(r => (
                        <option key={r} value={r} style={{ color: 'black' }}>{r.replace(/_/g,' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register User</button>
                  <button type="button" onClick={() => setShowRegister(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {!showRegister && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                System Directory — {users.length} Users
              </div>
              {usersLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Loading...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.user_id}>
                          <td style={{ fontWeight: 500 }}>{u.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td><RoleBadge role={u.role} /></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>{new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '2rem' }}>No users found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
