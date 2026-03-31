import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import eyeOpen from './assets/icons/open.svg';
import eyeClosed from './assets/icons/closed.svg';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

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

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const App = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN', managed_station: '' });
  const [activeSubTab, setActiveSubTab] = useState('users'); // users | fleet | staff
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState({ vehicle_id: '', service_type: 'Hospital', unit_name: '', parking_station: '', current_lat: 5.6037, current_long: -0.1870, status: 'READY' });
  const [users, setUsers] = useState([]);
  const jwt = token || localStorage.getItem('jwt');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Persistent Resources
  const [stations, setStations] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [stationStats, setStationStats] = useState({ beds: 0, ambulances: 0, fire_trucks: 0, readiness: 'High' });
  const [newStaff, setNewStaff] = useState({ name: '', role: '', status: 'Available' });

  useEffect(() => {
    if (jwt) {
      fetch('https://auth-service-spk6.onrender.com/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    }
  }, [jwt]);

  const role = profile?.role || profile?.user?.role;
  const managedStation = profile?.managed_station || profile?.user?.managed_station;
  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const isPoliceAdmin = role === 'POLICE_ADMIN';
  const isFireAdmin = role === 'FIRE_ADMIN';
  const isSystemAdmin = role === 'SYSTEM_ADMIN';

  const fetchData = async () => {
    if (!jwt) return;
    try {
      // Vehicles
      const vRes = await fetch('https://dispatch-service-v690.onrender.com/vehicles/', { headers: { 'Authorization': `Bearer ${jwt}` } });
      const vData = await vRes.json();
      if (Array.isArray(vData)) setVehicles(vData);

      // Stations & Personnel (Analytics Service)
      const analyticsUrl = 'https://analytics-service-9yox.onrender.com/analytics';
      
      const sRes = await fetch(`${analyticsUrl}/stations`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      const sData = await sRes.json();
      if (Array.isArray(sData)) {
        setStations(sData);
        if (managedStation) {
          const myStation = sData.find(s => s.name === managedStation);
          if (myStation) setStationStats({ beds: myStation.beds, ambulances: myStation.ambulances, fire_trucks: myStation.fire_trucks, readiness: myStation.readiness_level });
        }
      }

      const pQuery = managedStation ? `?station_name=${encodeURIComponent(managedStation)}` : '';
      const pRes = await fetch(`${analyticsUrl}/personnel${pQuery}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      const pData = await pRes.json();
      if (Array.isArray(pData)) setPersonnel(pData);

      if (isSystemAdmin) {
        const uRes = await fetch('https://auth-service-spk6.onrender.com/auth/users', { headers: { 'Authorization': `Bearer ${jwt}` } });
        const uData = await uRes.json();
        if (Array.isArray(uData)) setUsers(uData);
      }
    } catch (err) { console.error('Data fetch error:', err); }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [jwt, managedStation]);

  const handleUpdateStation = async (updates) => {
    if (!managedStation) return;
    const newStats = { ...stationStats, ...updates };
    setStationStats(newStats);
    try {
      await fetch('https://analytics-service-9yox.onrender.com/analytics/stations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          name: managedStation,
          service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire',
          ...newStats,
          readiness_level: newStats.readiness
        })
      });
    } catch (err) { console.error(err); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !managedStation) return;
    try {
      await fetch('https://analytics-service-9yox.onrender.com/analytics/personnel/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          ...newStaff,
          station_name: managedStation,
          service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire'
        })
      });
      setNewStaff({ name: '', role: '', status: 'Available' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRemoveStaff = async (id) => {
    try {
      await fetch(`https://analytics-service-9yox.onrender.com/analytics/personnel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      fetchData();
    } catch (err) { console.error(err); }
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
        setRegisterForm({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN', managed_station: '' });
        fetchData();
      } else {
        const d = await res.json();
        setRegisterError(d.message || d.error || 'Registration failed');
      }
    } catch { setRegisterError('Network error'); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://dispatch-service-v690.onrender.com/vehicles/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(vehicleForm)
      });
      if (res.ok) {
        setVehicleForm({ vehicle_id: '', service_type: 'Hospital', unit_name: '', parking_station: '', current_lat: 5.6037, current_long: -0.1870, status: 'READY' });
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateVehicleStatus = async (id, status) => {
    try {
      await fetch(`https://dispatch-service-v690.onrender.com/vehicles/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRemoveVehicle = async (id) => {
    if (!window.confirm(`Are you sure you want to decommission unit ${id}?`)) return;
    try {
      const res = await fetch(`https://dispatch-service-v690.onrender.com/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Profile Header */}
      <div className="section-header">
        <div>
          <div className="section-title"><span>Manage</span> Operations</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 4 }}>
            {role && <RoleBadge role={role} />}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{managedStation || 'Global Command'}</span>
          </div>
        </div>
        {profile && !profile.error && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.04em' }}>{profile.name || profile.user?.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{profile.email || profile.user?.email}</div>
          </div>
        )}
      </div>

      {/* Hospital/Police/Fire Admin Panels */}
      {(isHospitalAdmin || isPoliceAdmin || isFireAdmin) && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, background: 'var(--secondary)', borderRadius: '50%', display: 'inline-block' }} />
            {managedStation} Resources
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {isHospitalAdmin && (
               <>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1rem' }}>
                  <div className="stat-card-label">Available Beds</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleUpdateStation({ beds: Math.max(0, stationStats.beds - 1) })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>−</button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--secondary)', fontWeight: 700 }}>{stationStats.beds}</span>
                    <button onClick={() => handleUpdateStation({ beds: stationStats.beds + 1 })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>+</button>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1rem' }}>
                  <div className="stat-card-label">Ambulances Ready</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleUpdateStation({ ambulances: Math.max(0, stationStats.ambulances - 1) })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>−</button>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--warning)', fontWeight: 700 }}>{stationStats.ambulances}</span>
                    <button onClick={() => handleUpdateStation({ ambulances: stationStats.ambulances + 1 })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>+</button>
                  </div>
                </div>
               </>
            )}
            {isFireAdmin && (
               <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1rem' }}>
                 <div className="stat-card-label">Available Trucks</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                   <button onClick={() => handleUpdateStation({ fire_trucks: Math.max(0, stationStats.fire_trucks - 1) })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>−</button>
                   <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--fire-red)', fontWeight: 700 }}>{stationStats.fire_trucks}</span>
                   <button onClick={() => handleUpdateStation({ fire_trucks: stationStats.fire_trucks + 1 })} className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}>+</button>
                 </div>
               </div>
            )}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1rem' }}>
               <div className="stat-card-label">Readiness Level</div>
               <select value={stationStats.readiness} onChange={e => handleUpdateStation({ readiness: e.target.value })} style={{ marginTop: '0.75rem', width: '100%', background: 'rgba(0,0,0,0.4)', color: stationStats.readiness === 'High' ? 'var(--secondary)' : 'var(--warning)' }}>
                 <option value="High" style={{ color: 'black' }}>High</option>
                 <option value="Moderate" style={{ color: 'black' }}>Moderate</option>
                 <option value="Low" style={{ color: 'black' }}>Low</option>
               </select>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Staff Directory</div>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            {personnel.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>No staff registered.</div>}
            {personnel.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderBottom: i < personnel.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'Available' ? 'var(--secondary)' : 'var(--warning)' }} />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-bright)' }}>{p.name}</span>
                    <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.role}</span>
                  </div>
                </div>
                <button onClick={() => handleRemoveStaff(p._id)} className="btn btn-ghost" style={{ fontSize: '0.65rem', color: 'var(--danger)', padding: '0.15rem 0.4rem' }}>REMOVE</button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 2 }}><input placeholder="Staff Full Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><input placeholder="Role" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} required /></div>
            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>+ Register Staff</button>
          </form>
        </div>
      )}

      {/* System Admin Panel */}
      {isSystemAdmin && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {['users', 'fleet', 'resources'].map(tab => (
              <button key={tab} onClick={() => setActiveSubTab(tab)} className="btn" style={{ flex: 1, background: activeSubTab === tab ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.04)', color: activeSubTab === tab ? 'var(--primary)' : 'var(--text-muted)', border: `1px solid ${activeSubTab === tab ? 'rgba(255,69,0,0.35)' : 'rgba(255,255,255,0.08)'}`, fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.7rem', borderRadius: '2px' }}>
                {tab}
              </button>
            ))}
          </div>

          {activeSubTab === 'resources' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="stat-card">
                 <div className="stat-card-label">Total Beds (National)</div>
                 <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>{stations.reduce((acc, s) => acc + (s.beds || 0), 0)}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-card-label">Active Personnel</div>
                 <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{personnel.length}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-card-label">Fleet Readiness</div>
                 <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{Math.round((vehicles.filter(v => v.status === 'READY').length / (vehicles.length || 1)) * 100)}%</div>
              </div>

              <div style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>National Facilities Registry</div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Station Name</th><th>Service</th><th>Staff</th><th>Capacity</th><th>Status</th></tr></thead>
                    <tbody>
                      {stations.map(s => {
                        const staffCount = personnel.filter(p => p.station_name === s.name).length;
                        return (
                          <tr key={s._id}>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td><span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }}>{s.service_type}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{staffCount} Personnel</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                              {s.beds ? `${s.beds} Beds` : s.fire_trucks ? `${s.fire_trucks} Trucks` : s.ambulances ? `${s.ambulances} Ambulances` : '—'}
                            </td>
                            <td><span style={{ color: s.readiness_level === 'High' ? 'var(--secondary)' : 'var(--warning)', fontWeight: 600 }}>{s.readiness_level}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'users' && !showRegister && (
            <div>
               <button onClick={() => setShowRegister(true)} className="btn btn-secondary" style={{ marginBottom: '1.25rem' }}>+ Register New Administrator</button>
               <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Station</th><th>Joined</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.managed_station || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>{new Date(u.created_at).toLocaleDateString('en-GB').toUpperCase()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'users' && showRegister && (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1.5rem' }}>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label>Full Name</label><input placeholder="e.g. Kofi Mensah" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} required /></div>
                  <div><label>Email</label><input type="email" placeholder="user@ghana.gov.gh" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label>Password</label>
                    <input type={showPassword ? 'text' : 'password'} value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required />
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
                {['HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN'].includes(registerForm.role) && (
                  <div>
                    <label>Station / Facility Managed</label>
                    <input placeholder="e.g. Korle Bu Hospital" value={registerForm.managed_station} onChange={e => setRegisterForm({ ...registerForm, managed_station: e.target.value })} required />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register User</button>
                  <button type="button" onClick={() => setShowRegister(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === 'fleet' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Commissioning Form */}
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '1rem' }}>Commission New Response Unit</div>
                  <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                       <div><label>Vehicle Number</label><input placeholder="e.g. GV-101" value={vehicleForm.vehicle_id} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_id: e.target.value })} required /></div>
                       <div><label>Vehicle Name</label><input placeholder="e.g. Rescue One" value={vehicleForm.unit_name} onChange={e => setVehicleForm({ ...vehicleForm, unit_name: e.target.value })} required /></div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                       <div><label>Parking Station</label><input placeholder="e.g. Accra Central" value={vehicleForm.parking_station} onChange={e => setVehicleForm({ ...vehicleForm, parking_station: e.target.value })} required /></div>
                       <div>
                         <label>Service Type</label>
                         <select value={vehicleForm.service_type} onChange={e => setVehicleForm({ ...vehicleForm, service_type: e.target.value })}>
                            <option value="Hospital" style={{ color: 'black' }}>Medical (Ambulance)</option>
                            <option value="Police" style={{ color: 'black' }}>Police (Patrol)</option>
                            <option value="Fire" style={{ color: 'black' }}>Fire (Truck)</option>
                         </select>
                       </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                        <div><label>Station Latitude</label><input value={vehicleForm.current_lat.toFixed(6)} readOnly /></div>
                        <div><label>Station Longitude</label><input value={vehicleForm.current_long.toFixed(6)} readOnly /></div>
                     </div>
                     <button type="submit" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>＋ Commission into Fleet</button>
                  </form>
                </div>
                
                {/* Station Map Picker */}
                <div style={{ height: 350, position: 'relative', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.6rem', fontSize: '0.65rem', border: '1px solid var(--secondary)', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Click map to assign parking station location
                    </div>
                    <MapContainer center={[5.6037, -0.1870]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      <LocationPicker position={[vehicleForm.current_lat, vehicleForm.current_long]} setPosition={(p) => setVehicleForm({...vehicleForm, current_lat: p[0], current_long: p[1]})} />
                    </MapContainer>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>No. Plate</th><th>Vehicle Name</th><th>Parking Station</th><th>Service</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.vehicle_id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{v.vehicle_id}</td>
                        <td style={{ fontWeight: 500 }}>{v.unit_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.parking_station}</td>
                        <td>
                           <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: v.service_type === 'Fire' ? 'rgba(255,69,0,0.1)' : v.service_type === 'Police' ? 'rgba(26,111,255,0.1)' : 'rgba(0,212,170,0.1)', color: v.service_type === 'Fire' ? '#ff6a3d' : v.service_type === 'Police' ? '#5599ff' : '#00d4aa' }}>
                             {v.service_type}
                           </span>
                        </td>
                        <td>
                          <select 
                            value={v.status} 
                            onChange={(e) => handleUpdateVehicleStatus(v.vehicle_id, e.target.value)}
                            style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', padding: '0.15rem 0.3rem', color: v.status === 'READY' ? 'var(--secondary)' : v.status === 'FAULTY' ? 'var(--danger)' : 'var(--warning)' }}
                          >
                            {['READY', 'FAULTY', 'PENDING', 'DISPATCHED'].map(st => <option key={st} value={st} style={{ color: 'black' }}>{st}</option>)}
                          </select>
                        </td>
                        <td><button onClick={() => handleRemoveVehicle(v.vehicle_id)} className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>Decommission</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
