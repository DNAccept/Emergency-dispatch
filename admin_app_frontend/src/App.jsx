import React, { useState, useEffect } from 'react';
import eyeOpen from './assets/icons/open.svg';
import eyeClosed from './assets/icons/closed.svg';

const App = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Hospital State
  const [beds, setBeds] = useState(45);
  const [ambulances, setAmbulances] = useState(12);
  const [personnel, setPersonnel] = useState([
    { id: 1, name: 'Dr. Sarah Smith', role: 'Trauma Surgeon', status: 'On Call' }
  ]);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', status: 'Available' });

  // Police State
  const [officers, setOfficers] = useState([
    { id: 1, name: 'Officer Jenkins', rank: 'Patrol', status: 'On Duty' }
  ]);
  const [newOfficer, setNewOfficer] = useState({ name: '', rank: '', status: 'On Duty' });

  // Fire Admin State
  const [fireStats, setFireStats] = useState({ trucks: 4, activeFires: 1, readiness: 'High' });

  const jwt = token || localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      fetch('http://localhost:3001/auth/profile', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
    }
  }, [jwt]);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (newStaff.name) {
      setPersonnel([...personnel, { ...newStaff, id: Date.now() }]);
      setNewStaff({ name: '', role: '', status: 'Available' });
    }
  };

  const handleAddOfficer = (e) => {
    e.preventDefault();
    if (newOfficer.name) {
      setOfficers([...officers, { ...newOfficer, id: Date.now() }]);
      setNewOfficer({ name: '', rank: '', status: 'On Duty' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}` 
        },
        body: JSON.stringify(registerForm)
      });
      if (res.ok) {
        alert('User registered successfully!');
        setShowRegister(false);
        setRegisterForm({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });
      } else {
        const data = await res.json();
        alert('Error: ' + (data.message || data.error));
      }
    } catch (err) {
      alert('Network error registering user');
    }
  };

  const role = profile?.role || profile?.user?.role;
  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const isPoliceAdmin = role === 'POLICE_ADMIN';
  const isFireAdmin = role === 'FIRE_ADMIN';
  const isSystemAdmin = role === 'SYSTEM_ADMIN';

  useEffect(() => {
    if (jwt && isSystemAdmin) {
      setUsersLoading(true);
      fetch('http://localhost:3001/auth/users', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setUsers(data);
        setUsersLoading(false);
      })
      .catch(err => {
        console.error(err);
        setUsersLoading(false);
      });
    }
  }, [jwt, isSystemAdmin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Admin Module</h2>
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Logged User Profile</h3>
          {profile && !profile.error ? (
            <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <p><strong>Name:</strong> {profile.name || profile.user?.name || 'Unknown'}</p>
              <p><strong>Email:</strong> {profile.email || profile.user?.email || 'Unknown'}</p>
              <p><strong>Role:</strong> <span style={{ color: 'var(--secondary)' }}>{role || 'Unknown'}</span></p>
            </div>
          ) : (
            <p style={{ color: 'var(--warning)' }}>{profile?.error || 'Loading profile...'}</p>
          )}
        </div>
      </div>

      {isHospitalAdmin && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Hospital Management</h3>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <h4>Available Beds</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => setBeds(Math.max(0, beds - 1))} className="btn" style={{ background: 'var(--surface)' }}>-</button>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{beds}</span>
                <button onClick={() => setBeds(beds + 1)} className="btn" style={{ background: 'var(--surface)' }}>+</button>
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <h4>Ambulances Ready</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={() => setAmbulances(Math.max(0, ambulances - 1))} className="btn" style={{ background: 'var(--surface)' }}>-</button>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{ambulances}</span>
                <button onClick={() => setAmbulances(ambulances + 1)} className="btn" style={{ background: 'var(--surface)' }}>+</button>
              </div>
            </div>
          </div>
          <h4>Medical Personnel</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
            {personnel.map(p => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                <span><strong>{p.name}</strong> ({p.role})</span>
                <span style={{ color: p.status === 'Available' ? 'var(--secondary)' : 'var(--warning)' }}>{p.status}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <input type="text" placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            <input type="text" placeholder="Role (e.g. Nurse)" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Add</button>
          </form>
        </div>
      )}

      {isPoliceAdmin && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#3b82f6' }}>Police Station Management</h3>
          <h4>Officers Roll Call</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
            {officers.map(o => (
              <li key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                <span><strong>{o.name}</strong> ({o.rank})</span>
                <span style={{ color: o.status === 'On Duty' ? 'var(--secondary)' : 'var(--text-muted)' }}>{o.status}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddOfficer} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <input type="text" placeholder="Officer Name" value={newOfficer.name} onChange={e => setNewOfficer({...newOfficer, name: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            <input type="text" placeholder="Rank/Title" value={newOfficer.rank} onChange={e => setNewOfficer({...newOfficer, rank: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: '#3b82f6' }}>Add Officer</button>
          </form>
        </div>
      )}

      {isFireAdmin && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Fire Station Readiness</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span>Available Fire Trucks:</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button onClick={() => setFireStats({...fireStats, trucks: Math.max(0, fireStats.trucks - 1)})} className="btn" style={{ background: 'var(--surface)', padding: '0 0.5rem' }}>-</button>
                <strong style={{ fontSize: '1.2rem', color: '#fca5a5' }}>{fireStats.trucks}</strong>
                <button onClick={() => setFireStats({...fireStats, trucks: fireStats.trucks + 1})} className="btn" style={{ background: 'var(--surface)', padding: '0 0.5rem' }}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span>Station Readiness Level:</span>
              <select value={fireStats.readiness} onChange={e => setFireStats({...fireStats, readiness: e.target.value})} style={{ background: 'var(--surface)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px' }}>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', background: '#ef4444' }}>Broadcast Status Update</button>
        </div>
      )}

      {isSystemAdmin && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowRegister(false)} className="btn" style={{ flex: 1, background: !showRegister ? 'var(--primary)' : 'var(--surface)', color: 'white', fontWeight: 'bold' }}>Manage Users</button>
          <button onClick={() => setShowRegister(true)} className="btn" style={{ flex: 1, background: showRegister ? 'var(--primary)' : 'var(--surface)', color: 'white', fontWeight: 'bold' }}>Register User</button>
        </div>
      )}

      {isSystemAdmin && showRegister && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Register User</h3>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Name" value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            <input type="email" placeholder="Email" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', boxSizing: 'border-box' }} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <img src={showPassword ? eyeClosed : eyeOpen} alt="Toggle Password" style={{ width: '20px', height: '20px', filter: 'invert(1)' }} />
              </button>
            </div>

            <select value={registerForm.role} onChange={e => setRegisterForm({...registerForm, role: e.target.value})} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
              <option value="SYSTEM_ADMIN" style={{color: 'black'}}>System Admin</option>
              <option value="HOSPITAL_ADMIN" style={{color: 'black'}}>Hospital Admin</option>
              <option value="POLICE_ADMIN" style={{color: 'black'}}>Police Admin</option>
              <option value="FIRE_ADMIN" style={{color: 'black'}}>Fire Admin</option>
              <option value="GOVT_EXECUTIVE" style={{color: 'black'}}>Govt Executive</option>
              <option value="AMBULANCE_DRIVER" style={{color: 'black'}}>Ambulance Driver</option>
            </select>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register</button>
              <button type="button" onClick={() => setShowRegister(false)} className="btn" style={{ flex: 1, background: 'var(--surface)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isSystemAdmin && !showRegister && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)', marginTop: '0.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>System Directory (All Users)</h3>
          {usersLoading ? <p>Loading users...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>{u.name}</td>
                      <td style={{ padding: '0.75rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--secondary)' }}>{u.role}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No users found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export default App;
