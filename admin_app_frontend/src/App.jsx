import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
};

function RoleBadge({ role }) {
  const style = ROLE_COLORS[role] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '2px', background: style.bg, color: style.color, border: `1px solid ${style.border}`, letterSpacing: '0.05em' }}>
      {role?.replace(/_/g, ' ')}
    </span>
  );
}

const SearchBox = ({ setDraftLocation }) => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Ghana')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLoc = { lat: parseFloat(lat), lng: parseFloat(lon) };
        map.flyTo([newLoc.lat, newLoc.lng], 16, { duration: 1.5 });
        if (setDraftLocation) setDraftLocation([newLoc.lat, newLoc.lng]);
      }
    } catch (err) { console.error('Search failed:', err); }
    finally { setSearching(false); }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, width: '200px' }}>
      <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.8)', padding: '0.3rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <input 
          placeholder="Locate Station..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          onKeyDown={onKeyDown}
          style={{ flex: 1, fontSize: '0.65rem', padding: '0.2rem', background: 'transparent', border: 'none', color: 'white' }} 
        />
        <button 
          type="button" 
          onClick={handleSearch} 
          disabled={searching} 
          style={{ background: '#ff4500', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.6rem' }}
        >
          {searching ? '...' : '🔍'}
        </button>
      </div>
    </div>
  );
};

function LocationPicker({ position, setPosition }) {
  useMapEvents({ click(e) { setPosition([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} /> : null;
}

const App = ({ token }) => {
  const [profile, setProfile] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN', managed_station: '' });
  const [activeSubTab, setActiveSubTab] = useState('users'); 
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState({ vehicle_id: '', service_type: 'Hospital', unit_name: '', parking_station: '', current_lat: 5.6037, current_long: -0.1870, status: 'READY' });
  const [users, setUsers] = useState([]);
  const jwt = token || localStorage.getItem('jwt');

  // Persistent Resources
  const [stations, setStations] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [stationStats, setStationStats] = useState({ beds: 0, total_beds: 0, ambulances: 0, fire_trucks: 0, readiness: 'High' });
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
      const vRes = await fetch('https://dispatch-service-v690.onrender.com/vehicles/', { headers: { 'Authorization': `Bearer ${jwt}` } });
      const vData = await vRes.json();
      if (Array.isArray(vData)) setVehicles(vData);

      const analyticsUrl = 'https://analytics-service-9yox.onrender.com/analytics';
      const sRes = await fetch(`${analyticsUrl}/stations`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      const sData = await sRes.json();
      if (Array.isArray(sData)) {
        setStations(sData);
        if (managedStation) {
          const myStation = sData.find(s => s.name === managedStation);
          if (myStation) setStationStats({ beds: myStation.beds || 0, total_beds: myStation.total_beds || 0, ambulances: myStation.ambulances || 0, fire_trucks: myStation.fire_trucks || 0, readiness: myStation.readiness_level || 'High' });
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
    try {
      const res = await fetch('https://auth-service-spk6.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(registerForm)
      });
      if (res.ok) {
        setRegisterForm({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN', managed_station: '' });
        setShowRegister(false);
        fetchData();
      }
    } catch { console.error('Network error'); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const finalVehicle = {
      ...vehicleForm,
      parking_station: managedStation || vehicleForm.parking_station,
      service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : isFireAdmin ? 'Fire' : vehicleForm.service_type
    };

    if (!finalVehicle.vehicle_id || !finalVehicle.unit_name) {
      alert('Please fill in all fields.'); return;
    }

    try {
      const res = await fetch('https://dispatch-service-v690.onrender.com/vehicles/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(finalVehicle)
      });
      if (res.ok) {
        alert('Response Unit commissioned successfully!');
        setVehicleForm({ vehicle_id: '', service_type: 'Hospital', unit_name: '', parking_station: '', current_lat: 5.6037, current_long: -0.1870, status: 'READY' });
        fetchData();
      } else {
        const d = await res.json();
        alert(`Commissioning failed: ${d.message || d.error || 'Server error'}`);
      }
    } catch (err) { alert('Network error connecting to dispatch service.'); }
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
       await fetch(`https://dispatch-service-v690.onrender.com/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      fetchData();
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Resource Stats */}
          <div>
            <div className="section-sub-label">{managedStation} Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {isHospitalAdmin && (
                 <>
                  <div className="stat-card">
                    <div className="stat-card-label">Total Beds</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => handleUpdateStation({ total_beds: Math.max(0, stationStats.total_beds - 1) })} className="btn btn-ghost">-</button>
                      <span className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{stationStats.total_beds}</span>
                      <button type="button" onClick={() => handleUpdateStation({ total_beds: stationStats.total_beds + 1 })} className="btn btn-ghost">+</button>
                    </div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '2px solid var(--secondary)' }}>
                    <div className="stat-card-label">Available Beds</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => handleUpdateStation({ beds: Math.max(0, stationStats.beds - 1) })} className="btn btn-ghost">-</button>
                      <span className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>{stationStats.beds}</span>
                      <button type="button" onClick={() => handleUpdateStation({ beds: stationStats.beds + 1 })} className="btn btn-ghost">+</button>
                    </div>
                  </div>
                 </>
              )}
              <div className="stat-card">
                 <div className="stat-card-label">Station Readiness</div>
                 <select value={stationStats.readiness} onChange={e => handleUpdateStation({ readiness: e.target.value })} style={{ marginTop: '0.5rem', width: '100%', background: 'rgba(0,0,0,0.3)', color: stationStats.readiness === 'High' ? 'var(--secondary)' : 'var(--warning)' }}>
                   <option value="High" style={{ color: 'black' }}>High</option>
                   <option value="Moderate" style={{ color: 'black' }}>Moderate</option>
                   <option value="Low" style={{ color: 'black' }}>Low</option>
                 </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Personnel Management */}
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '1.25rem' }}>
              <div className="section-sub-label">Personnel Directory</div>
              <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: '1rem' }}>
                {personnel.map(p => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.role}</div>
                    </div>
                    <button onClick={() => handleRemoveStaff(p._id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem' }}>✕</button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '0.5rem' }}>
                <input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                <input placeholder="Role" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }}>+</button>
              </form>
            </div>

            {/* Vehicle Management */}
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '1.25rem' }}>
              <div className="section-sub-label">Register Response Unit</div>
              <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input placeholder="Plate No." value={vehicleForm.vehicle_id} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_id: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                  <input placeholder="Unit Name" value={vehicleForm.unit_name} onChange={e => setVehicleForm({ ...vehicleForm, unit_name: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                </div>
                
                {/* Map picker for coordinates */}
                <div style={{ height: 180, borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                  <MapContainer center={[5.6037, -0.1870]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <SearchBox setDraftLocation={(p) => setVehicleForm({...vehicleForm, current_lat: p[0], current_long: p[1]})} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <LocationPicker position={[vehicleForm.current_lat, vehicleForm.current_long]} setPosition={(p) => setVehicleForm({...vehicleForm, current_lat: p[0], current_long: p[1]})} />
                  </MapContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <span>Lat: {vehicleForm.current_lat.toFixed(6)}</span>
                  <span>Long: {vehicleForm.current_long.toFixed(6)}</span>
                </div>
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }}>+ Commission Unit</button>
              </form>
            </div>
          </div>

          {/* Unit List */}
          <div style={{ marginTop: '1rem' }}>
             <div className="section-sub-label">Station Units</div>
             <table style={{ fontSize: '0.8rem' }}>
               <thead><tr><th>Plate</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead>
               <tbody>
                 {vehicles.filter(v => v.parking_station === managedStation).map(v => (
                   <tr key={v.vehicle_id}>
                     <td>{v.vehicle_id}</td>
                     <td>{v.unit_name}</td>
                     <td>
                        <select value={v.status} onChange={(e) => handleUpdateVehicleStatus(v.vehicle_id, e.target.value)} style={{ padding: '0.1rem', fontSize: '0.7rem', background: 'transparent' }}>
                           {['READY', 'FAULTY', 'PENDING'].map(s => <option key={s} value={s} style={{ color: 'black' }}>{s}</option>)}
                        </select>
                     </td>
                     <td><button onClick={() => handleRemoveVehicle(v.vehicle_id)} style={{ color: 'var(--danger)', padding: 0, background: 'none' }}>Remove</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* System Admin Panel */}
      {isSystemAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['users', 'fleet', 'resources'].map(tab => (
              <button key={tab} onClick={() => setActiveSubTab(tab)} className="btn" style={{ flex: 1, background: activeSubTab === tab ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.04)', color: activeSubTab === tab ? 'var(--primary)' : 'var(--text-muted)' }}>{tab}</button>
            ))}
          </div>

          {activeSubTab === 'resources' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="stat-card">
                 <div className="stat-card-label">Total Beds (Global)</div>
                 <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>{stations.reduce((acc, s) => acc + (s.total_beds || 0), 0)}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-card-label">Active Staff</div>
                 <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{personnel.length}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-card-label">Fleet Readiness</div>
                 <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{Math.round((vehicles.filter(v => v.status === 'READY').length / (vehicles.length || 1)) * 100)}%</div>
              </div>

              <div style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
                <div className="section-sub-label">National Registry</div>
                <table>
                  <thead><tr><th>Station</th><th>Service</th><th>Staff</th><th>Beds (Avail/Total)</th></tr></thead>
                  <tbody>
                    {stations.map(s => (
                      <tr key={s._id}>
                        <td>{s.name}</td>
                        <td style={{ fontSize: '0.7rem' }}>{s.service_type}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{personnel.filter(p => p.station_name === s.name).length}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{s.beds || 0} / {s.total_beds || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'users' && (
            <div>
               <button onClick={() => setShowRegister(!showRegister)} className="btn btn-secondary">{showRegister ? 'Cancel' : '+ New Admin'}</button>
               {showRegister && (
                 <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
                   <input placeholder="Name" value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} required />
                   <input placeholder="Email" value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required />
                   <input type="password" placeholder="Password" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required />
                   <select value={registerForm.role} onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}>
                      {['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN'].map(r => <option key={r} value={r} style={{ color: 'black' }}>{r}</option>)}
                   </select>
                   <input placeholder="Station Name" value={registerForm.managed_station} onChange={e => setRegisterForm({ ...registerForm, managed_station: e.target.value })} />
                   <button type="submit" className="btn btn-primary">Register</button>
                 </form>
               )}
               <table style={{ marginTop: '1rem' }}>
                 <thead><tr><th>Name</th><th>Role</th><th>Station</th></tr></thead>
                 <tbody>
                   {users.map(u => (
                     <tr key={u.user_id}>
                       <td>{u.name}</td>
                       <td><RoleBadge role={u.role} /></td>
                       <td>{u.managed_station || '—'}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}

          {activeSubTab === 'fleet' && (
             <div style={{ height: 400, borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', marginBottom: '1.5rem' }}>
                <MapContainer center={[5.6037, -0.1870]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <SearchBox />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  {vehicles.map(v => (
                    <Marker key={v.vehicle_id} position={[v.current_lat, v.current_long]}>
                      <Popup>Unit: {v.unit_name} ({v.status})</Popup>
                    </Marker>
                  ))}
                </MapContainer>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
