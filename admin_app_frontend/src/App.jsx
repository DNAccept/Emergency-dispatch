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
  RESPONDER: { bg: 'rgba(255,255,255,0.05)', color: '#e0e0e0', border: 'rgba(255,255,255,0.1)' },
  GOVT_EXECUTIVE: { bg: 'rgba(155,89,182,0.1)', color: '#af7ac5', border: 'rgba(155,89,182,0.3)' },
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
  const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'https://auth-service-spk6.onrender.com';
  const DISPATCH_URL = import.meta.env.VITE_DISPATCH_SERVICE_URL || 'https://dispatch-service-tjgl.onrender.com';
  const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'https://analytics-service-hreo.onrender.com';
  const INCIDENT_URL = import.meta.env.VITE_INCIDENT_SERVICE_URL || 'https://incident-service-9yox.onrender.com';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [newStaff, setNewStaff] = useState({ name: '', role: '' });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingStaffForm, setEditingStaffForm] = useState({ name: '', role: '' });
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editStationValue, setEditStationValue] = useState('');

  useEffect(() => {
    if (jwt) {
      fetch(`${AUTH_URL}/auth/profile`, { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    }
  }, [jwt]);

  const role = profile?.role || profile?.user?.role;
  const managedStation = profile?.managed_station || profile?.user?.managed_station;

  // Sync stationStats when the stations API successfully returns data
  useEffect(() => {
    if (managedStation && stations && stations.length > 0) {
      const ms = stations.find(s => s.name === managedStation);
      if (ms) {
        setStationStats(prev => ({
          ...prev,
          beds: ms.beds ?? prev.beds,
          total_beds: ms.total_beds ?? prev.total_beds,
          ambulances: ms.ambulances ?? prev.ambulances,
          fire_trucks: ms.fire_trucks ?? prev.fire_trucks,
          readiness: ms.readiness_level ?? prev.readiness
        }));
      }
    }
  }, [stations, managedStation]);

  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const isPoliceAdmin = role === 'POLICE_ADMIN';
  const isFireAdmin = role === 'FIRE_ADMIN';
  const isSystemAdmin = role === 'SYSTEM_ADMIN';

  const runDiagnostics = async () => {
    const urls = {
      auth: `${AUTH_URL}/health`,
      dispatch: `${DISPATCH_URL}/health`,
      analytics: `${ANALYTICS_URL}/health`,
      incident: `${INCIDENT_URL}/health`
    };
    const results = {};
    for (const [key, url] of Object.entries(urls)) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        // If /health is 404, we try /analytics/health for the Analytics service as a safeguard
        if (key === 'analytics' && r.status === 404) {
          const r2 = await fetch('https://analytics-service-hreo.onrender.com/analytics/health', { signal: AbortSignal.timeout(3000) });
          results[key] = r2.ok ? 'ONLINE' : 'ERROR';
        } else {
          results[key] = r.ok ? 'ONLINE' : 'ERROR';
        }
      } catch { results[key] = 'OFFLINE'; }
    }
    setDiagnostics(results);
  };

  const fetchData = async () => {
    if (!jwt) return;
    
    // Fetch Vehicles
    try {
      const vRes = await fetch(`${DISPATCH_URL}/vehicles/`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      if (vRes.ok) {
        const vData = await vRes.json();
        if (Array.isArray(vData)) setVehicles(vData);
      }
    } catch (err) { console.error('Dispatch API Error:', err); }

    // Fetch Stations
    try {
      const sRes = await fetch(`${ANALYTICS_URL}/analytics/stations`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData)) setStations(sData);
      }
    } catch (err) { console.error('Analytics Stations API Error:', err); }

    // Fetch Personnel
    try {
      const pQuery = isSystemAdmin ? '' : `?station_name=${encodeURIComponent(managedStation)}&service_type=${isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire'}`;
      const pRes = await fetch(`${ANALYTICS_URL}/analytics/personnel${pQuery}`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData)) setPersonnel(pData);
      }
    } catch (err) { console.error('Analytics Personnel API Error:', err); }
      
    // Fetch Users (System Admin Only)
    if (isSystemAdmin) {
      try {
        console.log('System Admin role detected. Fetching full user registry...');
        const uRes = await fetch(`${AUTH_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${jwt}` } });
        if (uRes.ok) {
          const uData = await uRes.json();
          console.log(`Fetched ${uData.length || 0} users from database.`);
          if (Array.isArray(uData)) setUsers(uData);
        }
      } catch (err) { console.error('Auth Users API Error:', err); }
    }
      
    runDiagnostics();
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [jwt, managedStation, isSystemAdmin, isHospitalAdmin, isPoliceAdmin, isFireAdmin]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [diagnostics, setDiagnostics] = useState({ auth: '...', dispatch: '...', analytics: '...', incident: '...' });

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.location.reload();
  };

  const handleUpdateStation = async (updates) => {
    if (!managedStation) return;
    const oldStats = { ...stationStats };
    let newStats = { ...stationStats, ...updates };
    
    if (newStats.beds > newStats.total_beds) {
      newStats.beds = newStats.total_beds;
    }
    
    setStationStats(newStats); 
    setIsSyncing(true);
    try {
      const res = await fetch(`${ANALYTICS_URL}/analytics/stations/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          name: managedStation,
          service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire',
          ...newStats,
          readiness_level: newStats.readiness
        })
      });
      if (!res.ok) throw new Error('Update failed');
      setTimeout(fetchData, 1000);
    } catch (err) { 
      console.error(err); 
      setStationStats(oldStats);
      alert('Failed to update station resources. Reverting changes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !managedStation) return;
    const oldPersonnel = [...personnel];
    const optimisticStaff = { ...newStaff, _id: Date.now().toString(), station_name: managedStation, service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire' };
    
    setPersonnel([...personnel, optimisticStaff]);
    setIsSyncing(true);
    try {
      const res = await fetch(`${ANALYTICS_URL}/analytics/personnel/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          ...newStaff,
          station_name: managedStation,
          service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : 'Fire'
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || d.error || 'Server error');
      }
      setNewStaff({ name: '', role: '', status: 'Available' });
      alert(`Staff member ${newStaff.name} registered successfully!`);
      fetchData();
    } catch (err) { 
      console.error('Personnel Registration Error:', err);
      setPersonnel(oldPersonnel);
      alert(`Failed to register personnel: ${err.message}. Please try again.`); 
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    const oldPersonnel = [...personnel];
    setPersonnel(personnel.filter(p => p._id !== id));
    setIsSyncing(true);
    try {
      const res = await fetch(`${ANALYTICS_URL}/analytics/personnel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Deletion failed');
      fetchData();
    } catch (err) { 
      console.error(err); 
      setPersonnel(oldPersonnel);
      alert('Failed to remove staff member. Reverting changes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditStaffSave = async (id) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${ANALYTICS_URL}/analytics/personnel/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(editingStaffForm)
      });
      if (!res.ok) throw new Error('Edit failed');
      setEditingStaffId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update staff member.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateUserStation = async (userId) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${AUTH_URL}/auth/users/${userId}/station`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ managed_station: editStationValue })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchData();
      } else {
        alert('Failed to update station');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating station');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${AUTH_URL}/auth/register`, {
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
    
    let finalPayload;
    if (isSystemAdmin) {
      if (!vehicleForm.service_type || !vehicleForm.parking_station) {
        alert('System Admin must explicitly select a service type and destination station.');
        return;
      }
      finalPayload = { ...vehicleForm };
    } else {
      finalPayload = {
        ...vehicleForm,
        parking_station: managedStation || vehicleForm.parking_station,
        service_type: isHospitalAdmin ? 'Hospital' : isPoliceAdmin ? 'Police' : isFireAdmin ? 'Fire' : vehicleForm.service_type
      };
    }

    if (!finalPayload.vehicle_id || !finalPayload.unit_name) {
      alert('Please fill in all vehicle identifying fields.'); return;
    }

    try {
      const res = await fetch(`${DISPATCH_URL}/vehicles/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify(finalPayload)
      });
      if (res.ok) {
        alert('Response Unit commissioned successfully!');
        setVehicleForm({ vehicle_id: '', service_type: 'Hospital', unit_name: '', parking_station: '', current_lat: 5.6037, current_long: -0.1870, status: 'READY' });
        fetchData();
      } else {
        const d = await res.json();
        alert(`Commissioning failed: ${d.message || d.error || 'Server error'}`);
      }
    } catch (err) { 
      console.error('Dispatch Registration Error:', err);
      alert(`Network error connecting to dispatch service: ${err.message}. Please check if the service is active.`); 
    }
  };

  const handleUpdateVehicleStatus = async (id, status) => {
    try {
      await fetch(`${DISPATCH_URL}/vehicles/${id}/status`, {
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
       await fetch(`${DISPATCH_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Global Command Header & Diagnostics */}
      <div className="section-header">
        <div>
          <div className="section-title">Command <span>Dashboard</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 4 }}>
            {role && <RoleBadge role={role} />}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{managedStation || 'Global Command'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Tactical Diagnostics */}
          <div style={{ display: 'flex', gap: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {Object.entries(diagnostics).map(([svc, status]) => (
              <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ 
                  width: 6, height: 6, borderRadius: '50%', 
                  background: status === 'ONLINE' ? '#00d4aa' : status === 'ERROR' ? '#ffb800' : '#ff3b30', 
                  boxShadow: status === 'ONLINE' ? '0 0 5px #00d4aa' : 'none' 
                }} />
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{svc}</span>
              </div>
            ))}
          </div>

          {profile && !profile.error && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{profile.name || profile.user?.name}</div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Logout Sessions</button>
            </div>
          )}
        </div>
      </div>

      {/* Hospital/Police/Fire Admin Panels */}
      {(isHospitalAdmin || isPoliceAdmin || isFireAdmin) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Resource Stats */}
          <div>
            <div className="section-sub-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{managedStation} Overview</span>
              {isSyncing && <span style={{ fontSize: '0.65rem', color: 'var(--primary)', animation: 'pulse 1.5s infinite' }}>● Syncing Changes...</span>}
            </div>
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
                      <button type="button" onClick={() => handleUpdateStation({ beds: Math.min(stationStats.total_beds, stationStats.beds + 1) })} className="btn btn-ghost">+</button>
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
                    {editingStaffId === p._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input value={editingStaffForm.name} onChange={e => setEditingStaffForm({...editingStaffForm, name: e.target.value})} style={{ flex: 1, fontSize: '0.75rem', padding: '0.2rem' }} />
                        <input value={editingStaffForm.role} onChange={e => setEditingStaffForm({...editingStaffForm, role: e.target.value})} style={{ flex: 1, fontSize: '0.75rem', padding: '0.2rem' }} />
                        <button onClick={() => handleEditStaffSave(p._id)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 0.4rem', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditingStaffId(null)} style={{ background: 'var(--text-muted)', color: 'white', border: 'none', padding: '0 0.4rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setEditingStaffId(p._id); setEditingStaffForm({ name: p.name, role: p.role }); }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.role}</div>
                        </div>
                        <button onClick={() => handleRemoveStaff(p._id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem' }}>✕</button>
                      </>
                    )}
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
            {(isSystemAdmin ? ['users'] : ['users', 'fleet', 'resources']).map(tab => (
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
                      {['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN', 'RESPONDER', 'GOVT_EXECUTIVE'].map(r => <option key={r} value={r} style={{ color: 'black' }}>{r}</option>)}
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
                        <td>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{u.email}</div>
                        </td>
                        <td><RoleBadge role={u.role} /></td>
                        <td>
                          {editingUser === u.user_id ? (
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <input 
                                value={editStationValue} 
                                onChange={e => setEditStationValue(e.target.value)} 
                                style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem', width: '120px' }}
                              />
                              <button onClick={() => handleUpdateUserStation(u.user_id)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 0.4rem', cursor: 'pointer' }}>✓</button>
                              <button onClick={() => setEditingUser(null)} style={{ background: 'var(--text-muted)', color: 'white', border: 'none', padding: '0 0.4rem', cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{u.managed_station || '—'}</span>
                              <button 
                                onClick={() => { setEditingUser(u.user_id); setEditStationValue(u.managed_station || ''); }} 
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
                              >
                                ✎
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeSubTab === 'fleet' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               <div style={{ height: 400, borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', marginBottom: '1.5rem' }}>
                  <MapContainer center={[5.6037, -0.1870]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <SearchBox />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    {vehicles.map(v => (
                      <Marker key={v.vehicle_id} position={[v.current_lat, v.current_long]}>
                        <Popup>Unit: {v.unit_name} ({v.status})</Popup>
                      </Marker>
                    ))}
                    <LocationPicker position={[vehicleForm.current_lat, vehicleForm.current_long]} setPosition={(p) => setVehicleForm({...vehicleForm, current_lat: p[0], current_long: p[1]})} />
                  </MapContainer>
               </div>

               <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '1.25rem' }}>
                 <div className="section-sub-label">Global Registry: Commission Unit</div>
                 <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                     <input placeholder="Plate No." value={vehicleForm.vehicle_id} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_id: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                     <input placeholder="Unit Name" value={vehicleForm.unit_name} onChange={e => setVehicleForm({ ...vehicleForm, unit_name: e.target.value })} required style={{ fontSize: '0.8rem' }} />
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                     <select value={vehicleForm.service_type} onChange={e => setVehicleForm({ ...vehicleForm, service_type: e.target.value })} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                        {['Hospital', 'Police', 'Fire'].map(s => <option key={s} value={s} style={{ color: 'black' }}>{s}</option>)}
                     </select>
                     
                     <select value={vehicleForm.parking_station} onChange={e => setVehicleForm({ ...vehicleForm, parking_station: e.target.value })} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                        <option value="" disabled style={{ color: 'black' }}>Select Destination Station</option>
                        {stations.filter(s => s.service_type === vehicleForm.service_type).map(s => (
                           <option key={s._id} value={s.name} style={{ color: 'black' }}>{s.name}</option>
                        ))}
                     </select>
                   </div>

                   <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                     <span>Loc Lat: {vehicleForm.current_lat.toFixed(6)}</span>
                     <span>Loc Long: {vehicleForm.current_long.toFixed(6)}</span>
                     <span>(Click map to pinpoint)</span>
                   </div>
                   
                   <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem', marginTop: '0.5rem' }}>+ Commission & Assign Unit</button>
                 </form>

                 <div className="section-sub-label" style={{ marginTop: '1.5rem' }}>Global Vehicle Directory</div>
                 <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                   <table style={{ fontSize: '0.7rem' }}>
                     <thead><tr><th>Plate</th><th>Service</th><th>Station</th><th>Actions</th></tr></thead>
                     <tbody>
                       {vehicles.map(v => (
                         <tr key={v.vehicle_id}>
                           <td>{v.vehicle_id} <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{v.unit_name}</div></td>
                           <td>{v.service_type}</td>
                           <td>{v.parking_station}</td>
                           <td><button onClick={() => handleRemoveVehicle(v.vehicle_id)} style={{ color: 'var(--danger)', padding: 0, background: 'none' }}>Revoke</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
