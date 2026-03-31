import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const SearchBox = ({ setDraftLocation }) => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Accra, Ghana')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLoc = { lat: parseFloat(lat), lng: parseFloat(lon) };
        map.flyTo([newLoc.lat, newLoc.lng], 16, { duration: 1.5 });
        setDraftLocation(newLoc);
      }
    } catch (err) { console.error('Search failed:', err); }
    finally { setSearching(false); }
  };

  return (
    <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, width: '280px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(6,10,15,0.9)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <input 
          placeholder="Search Area (e.g. Airport Hills)" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="submit" disabled={searching} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.7rem' }}>
          {searching ? '...' : '🔍'}
        </button>
      </form>
    </div>
  );
};


const HEALTH_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNSAxNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNNywxQzYuNCwxLDYsMS40LDYsMlY0SDJDMS40LDYsMSw2LjQsMSw3VjhjMCwwLjYsMC40LDEsMSwxaDR2NGMwLDAuNiwwLjQsMSwxLDFoMWMwLjYsMCwxLTAuNCwxLTFWOWg0YzAuNiwwLDEtMC40LDEtMVY3YzAtMC42LTAuNC0xLTEtMUg5VjJjMC0wLjYsMC40LTEsMS0xSDd6Ii8+PC9zdmc+';
const POLICE_SVG = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmZmZmIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjguNTgxIDIwLjU0NGMwIDMuMzY5LTIuNzg5IDMuMzY5LTQuMjkyIDMuMzY5aC0xLjg3NHYtNi4zNjloMi4zNTVjMS4zMTcgMCAzLjgxMSAwIDMuODExIDN6bTE0LjM5Ni0zLjM2M2MuMjc4LTMuNDI4IDEuMjcxLTYuNTc0IDMuMDIzLTkuNDU4bC02LjcxOS02LjcyM2MtMi4xMjMgMS44MjgtNC41MzkgMi44NC03LjI3OSAzLjAxOS0yLjUwOS4yMjctNC44OTEtLjI1LTcuMTI3LTEuNDM0LTIuMzAxIDEuMTQ2LTQuNjcxIDEuNjI1LTcuMTQyIDEuNDM0LTIuNTU2LS4yMjktNC44NjItMS4xMzUtNi45MjgtMi43NDFsLTYuNzM4IDYuNzJjMS42NTcgMi45MjUgMi41OCA1Ljk4NyAyLjc2MiA5LjE4My4wODYgMS40NzItLjMzNCAzLjQ5OC0xLjI3NiA2LjExNy0uNDkzIDEuNDUyLS44NjYgMi43MTUtMS40MzQgMy43NjQtLjIzNSAxLjA0NS0uMzgyIDEuODk1LS40MzEgMi41MzEtLjAzNSAyLjc5MS43NDggNS4zMTEgMi4zNTMgNy41NSAxLjI1NCAxLjYzNSAzLjMyMiAzLjQ0MCA2LjE5NCA1LjQxNSAzLjE0MiAxLjYgNS41NzQgMi42MzkgNy4yNzcgMy4wODFsMS40MTIuNjU2Yy40NDQuMjE0LjkyMC40MjEgMS40MTcuNjQ3IDEuMDcxLjY0MiAxLjgyNCAxLjMzOSAyLjIyIDIuMDU3LjQ4Ni0uNzc3IDEuMjU1LTEuNDU2IDIuMjc3LTIuMDU3LjcyMi0uMzE0IDEuMzMzLS41ODggMS44MjMtLjgyOC40OS0uMjE1Ljg1NS0uMzc3IDEuMDY3LS40NzYuMzYzLS4xODEuODQtLjM4NyAxLjQxNy0uNjE1LjU4My0uMjI5IDEuMzAyLS41MSAyLjE2MS0uODIgMS42Ni0uNTg5IDIuODY4LTEuMTQ0IDMuNjM2LTEuNjQ2IDIuNzg1LTEuOTc1IDQuODIxLTMuNzUwIDYuMTE3LTUuMzM5IDEuNjYyLTIuMjQ5IDIuNDY5LTQuNzgwIDIuNDMyLTcuNjI2LS4wOTgtMS4yNzQtLjYzNy0zLjMxMy0xLjYxNi02LjA5MS0uOTM0LTIuNzA0LTEuMzQ4LTQuODA0LTEuMjEyLTYuMzJ6bS0xMi4zNSA5LjIxYy0xLjU5NSAxLjA0NC0zLjc4OCAxLjA0NC00LjkzMyAxLjA0NGgtMy4xNDV2OC42MDZoLTQuNzI5di0yMi4wNzZoNi43MTNjMy4xMiAwIDUuNzI5LjIwMSA3LjU0MSAyLjQxMCAxLjEzIDEuNDA2IDEuMzIyIDMuMDAzIDEuMzIyIDQuMTM4LS4wMDIgMi41NzEtMS4wNjEgNC43NDEtMi43NjkgNS44Nzh6Ii8+PC9zdmc+';
const FIRE_SVG   = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgLTAuNSAxNyAxNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMywxNC4wNDcgTDIuNjc0LDE0LjA0NyBDMi4zMDMsMTQuMDQ3IDIsMTQuNTA0IDIsMTUuMDY2IEwyLDE1Ljk1OSBMOS45ODYsMTUuOTU5IEw5Ljk4NywxNS45NTkgTDkuOTg3LDE1LjA2NiBDOS45ODcsMTQuNTAzIDkuNjg0LDE0LjA0NyA5LjMxMywxNC4wNDcgTDguOTU2LDE0LjA0NyBMOC45NTYsNiBMMyw2IEwzLDE0LjA0NyBaIiAvPjxwYXRoIGQ9Ik0yLDQgTDIsNC45NDIgTDEwLDUgTDEwLDQgTDIsNCBaIiAvPjxwYXRoIGQ9Ik01LDEuMTQxNzI0NjggQzMuODUyMTM0NjIsMS40MTIxOTY2NyAzLjAzMSwyLjEzNTA3NjcxIDMuMDMxLDIuOTg0IEw4Ljk2OSwyLjk4NCBDOC45NjksMi4xMzA0OTY2NyA4LjEzODM1NjcsMS40MDQ0MDAyOSA2Ljk4MSwxLjEzNzM4NjU1IEw2Ljk4MSwwIEw1LDAgTDUsMS4xNDE3MjQ2OCBaIiAvPjxwYXRoIGQ9Ik0xLDggTDEsNyBMMS45NDcsNyBMMS45NDcsOCBMMS45NzQsOCBMMS45NzQsOC45NyBMMS45NDcsOC45NyBMMS45NDcsOS45MDggTDEsOS45MDggTDEsOC45NyBMMCw4Ljk3IEwwLDggTDEsOCBaIiAvPjxwYXRoIGQ9Ik0xMC45NTMsOC45MzggTDEwLjk1Myw5LjkwNiBMMTAsOS45MDYgTDEwLDcgTDEwLjk1Myw3IEwxMC45NTMsOCBMMTEuOTQyLDggTDExLjk0Miw4LjkzOCBMMTAuOTUzLDguOTM4IFoiIC8+PC9nPjwvc3ZnPg==';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

const INCIDENT_CONFIG = {
  Medical:  { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',  border: 'rgba(0,212,170,0.3)',  icon: HEALTH_SVG, label: 'Medical Emergency' },
  Fire:     { color: '#ff4500', bg: 'rgba(255,69,0,0.1)',   border: 'rgba(255,69,0,0.3)',   icon: FIRE_SVG,   label: 'Fire' },
  Crime:    { color: '#1a6fff', bg: 'rgba(26,111,255,0.1)', border: 'rgba(26,111,255,0.3)', icon: POLICE_SVG, label: 'Crime / Robbery' },
  Traffic:  { color: '#ffb800', bg: 'rgba(255,184,0,0.1)',  border: 'rgba(255,184,0,0.3)',  icon: POLICE_SVG, label: 'Traffic Accident' },
};

const STATUS_COLORS = {
  CREATED: 'var(--warning)', DISPATCHED: 'var(--police-blue)', 'IN_PROGRESS': 'var(--primary)', RESOLVED: 'var(--secondary)'
};

function MapClickHandler({ setDraftLocation }) {
  useMapEvents({ click(e) { setDraftLocation({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function createColoredIcon(color, type) {
  const icons = { Medical: HEALTH_SVG, Fire: FIRE_SVG, Crime: POLICE_SVG, Traffic: POLICE_SVG };
  const icon = icons[type] || HEALTH_SVG;
  return L.divIcon({
    className: '',
    html: `
      <div style="width:28px;height:28px;background:#1a1d21;border:2px solid ${color};border-radius:50%;box-shadow:0 0 10px ${color};display:flex;align-items:center;justify-content:center">
        <img src="${icon}" style="width:16px;height:16px" />
      </div>
    `,
    iconSize: [28, 28], iconAnchor: [14, 14]
  });
}

const App = ({ token, role: roleProp }) => {
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draftLocation, setDraftLocation] = useState(null);
  const [draftTypes, setDraftTypes] = useState(['Medical']);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftCitizen, setDraftCitizen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const jwt = token || localStorage.getItem('jwt');

  const canReport = roleProp === 'SYSTEM_ADMIN';

  const fetchIncidents = () => {
    fetch('https://incident-service-9yox.onrender.com/incidents/open', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(d => { setIncidents(Array.isArray(d) ? d : (d.incidents || [])); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchVehicles = () => {
    fetch('https://dispatch-service-v690.onrender.com/vehicles/available', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setVehicles(d.filter(v => v.status === 'DISPATCHED' || v.status === 'ON_SCENE')); })
      .catch(console.error);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    if (jwt) {
      fetchIncidents();
      fetchVehicles();
    }
    const interval = setInterval(() => {
      fetchIncidents();
      fetchVehicles();
    }, 4000);
    return () => clearInterval(interval);
  }, [jwt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draftLocation) { alert('Click on the map to set location.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('https://incident-service-9yox.onrender.com/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ types: draftTypes, latitude: draftLocation.lat, longitude: draftLocation.lng, notes: draftNotes, citizen_name: draftCitizen })
      });
      if (res.ok) {
        setShowForm(false); setDraftLocation(null); setDraftNotes(''); setDraftCitizen(''); setDraftTypes(['Medical']);
        fetchIncidents();
      } else { alert('Failed to submit incident'); }
    } catch { alert('Connection error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this incident record?')) return;
    try {
      const res = await fetch(`https://incident-service-9yox.onrender.com/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        fetchIncidents();
        if (selectedIncident?.incident_id === id) setSelectedIncident(null);
      } else { alert('Failed to delete incident'); }
    } catch { alert('Connection error'); }
  };

  const getPrimaryType = (types) => {
    if (!types) return 'Medical';
    const tArray = Array.isArray(types) ? types : String(types).split(', ');
    return tArray[0] || 'Medical';
  };

  const toggleType = (t) => {
    if (draftTypes.includes(t)) {
      if (draftTypes.length > 1) setDraftTypes(draftTypes.filter(x => x !== t));
    } else {
      setDraftTypes([...draftTypes, t]);
    }
  };

  const primaryType = getPrimaryType(draftTypes);
  const cfg = INCIDENT_CONFIG[primaryType] || INCIDENT_CONFIG.Medical;
  const openCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', color: 'white' }}>
      <div className="section-header">
        <div className="section-title">Incident <span>Dashboard</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '3px', padding: '0.4rem 0.9rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{openCount}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>Active</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', padding: '0.4rem 0.9rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{incidents.length}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
            </div>
          </div>
          {canReport ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn"
              style={{ background: showForm ? 'rgba(255,51,51,0.12)' : 'rgba(255,69,0,0.15)', color: showForm ? 'var(--danger)' : 'var(--primary)', border: `1px solid ${showForm ? 'rgba(255,51,51,0.3)' : 'rgba(255,69,0,0.35)'}`, fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {showForm ? '✕ Cancel' : '⚠ Report Emergency'}
            </button>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '2px', padding: '0.4rem 0.9rem' }}>👁 View Only</span>
          )}
        </div>
      </div>

      {canReport && showForm && (
        <div style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '3px', padding: '1.25rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: cfg.color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={cfg.icon} style={{ width: 14, height: 14 }} /> New Incident Report — Click the map to pin location
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2rem', marginBottom: '0.75rem' }}>
              <div>
                <label>Caller Name</label>
                <input placeholder="Citizen's name" value={draftCitizen} onChange={e => setDraftCitizen(e.target.value)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input readOnly value={draftLocation ? `${draftLocation.lat.toFixed(5)}, ${draftLocation.lng.toFixed(5)}` : 'Awaiting map click...'} style={{ color: draftLocation ? cfg.color : 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
                  {draftLocation && <button type="button" onClick={() => setDraftLocation(null)} style={{ background: 'rgba(255,51,51,0.15)', color: 'var(--danger)', border: '1px solid rgba(255,51,51,0.3)', padding: '0.2rem 0.5rem', borderRadius: '2px', fontSize: '0.65rem', cursor: 'pointer' }}>Clear</button>}
                </div>
              </div>
              <div>
                <label>Nature of Emergency (Select All That Apply)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {Object.entries(INCIDENT_CONFIG).map(([k, v]) => {
                    const active = draftTypes.includes(k);
                    return (
                      <button key={k} type="button" onClick={() => toggleType(k)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: active ? v.bg : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? v.color : 'rgba(255,255,255,0.1)'}`, color: active ? v.color : 'var(--text-muted)', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                        {active && '✓'} {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label>Additional Notes</label>
                <textarea placeholder="Brief description of the scene..." value={draftNotes} onChange={e => setDraftNotes(e.target.value)} style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '2px' }} />
              </div>
            </div>
            <button type="submit" disabled={submitting || !draftLocation} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', opacity: !draftLocation ? 0.5 : 1 }}>
              {submitting ? 'Submitting...' : '→ Submit Report'}
            </button>
          </form>
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', minHeight: 500 }}>
        <div style={{ height: '550px', background: '#0a0c10', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)', position: 'relative' }}>
          <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <MapResizer />
            <SearchBox setDraftLocation={setDraftLocation} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
            {showForm && <MapClickHandler setDraftLocation={setDraftLocation} />}
            
            {/* Trail Lines & Responders */}
            {vehicles.map(v => (
              <React.Fragment key={v.vehicle_id}>
                {v.target_route && v.target_route.length > 0 && (
                  <Polyline 
                    positions={[ [v.current_lat, v.current_long], ...v.target_route ]}
                    pathOptions={{ color: v.service_type === 'Fire' ? '#ff4500' : v.service_type === 'Police' ? '#1a6fff' : '#00d4aa', weight: 3, dashArray: '8, 8', opacity: 0.6 }}
                  />
                )}
                <Marker position={[v.current_lat, v.current_long]} icon={L.divIcon({
                  className: '',
                  html: `<div style="width:24px;height:24px;background:#1a1d21;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(255,255,255,0.5)">
                          <span style="font-size:14px">${v.service_type === 'Fire' ? '🚒' : v.service_type === 'Police' ? '🚓' : '🚑'}</span>
                         </div>`,
                  iconSize: [24, 24], iconAnchor: [12, 12]
                })}>
                  <Popup>Unit: {v.unit_name} ({v.status})</Popup>
                </Marker>
              </React.Fragment>
            ))}

            {incidents.map(inc => {
              const types = String(inc.type || 'Medical').split(', ');
              const primary = types[0] || 'Medical';
              const c = INCIDENT_CONFIG[primary] || INCIDENT_CONFIG.Medical;
              return (
                <Marker key={inc.incident_id || inc.id || Math.random()} position={[inc.latitude, inc.longitude]} icon={createColoredIcon(c.color, primary)} eventHandlers={{ click: () => setSelectedIncident(inc) }}>
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: c.color, fontWeight: 700 }}>
                        <img src={c.icon} style={{ width: 16, height: 16 }} /> {inc.type} Incident
                      </div>
                      <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.4rem' }}>Units: {inc.assigned_unit_id || 'None'}</div>
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>Status: {inc.status}</span><br />
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>{new Date(inc.reported_at || Date.now()).toLocaleString()}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {draftLocation && showForm && (
              <Marker position={[draftLocation.lat, draftLocation.lng]} icon={createColoredIcon(cfg.color, primaryType)}>
                <Popup>📍 New Incident Location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Incidents List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', paddingRight: '2px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', flexShrink: 0 }}>
            Live Incidents
          </div>
          {loading && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)', padding: '1rem 0' }}>Loading...</div>}
          {!loading && incidents.length === 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)', padding: '2rem 0', textAlign: 'center' }}>No open incidents</div>
          )}
          {incidents.map(inc => {
            const types = String(inc.type || 'Medical').split(', ');
            const primary = types[0] || 'Medical';
            const c = INCIDENT_CONFIG[primary] || INCIDENT_CONFIG.Medical;
            const statusColor = STATUS_COLORS[inc.status] || 'var(--text-muted)';
            const isSelected = selectedIncident?.incident_id === inc.incident_id;
            return (
              <div key={inc.incident_id || inc.id} onClick={() => setSelectedIncident(isSelected ? null : inc)}
                style={{ background: isSelected ? `${c.bg}` : 'rgba(0,0,0,0.25)', border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.05)'}`, borderLeft: `3px solid ${c.color}`, borderRadius: '2px', padding: '0.6rem 0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.color }}>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {types.map(t => <img key={t} src={INCIDENT_CONFIG[t]?.icon || HEALTH_SVG} style={{ width: 14, height: 14 }} />)}
                    </div>
                    {inc.type}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: statusColor }}>{inc.status}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {parseFloat(inc.latitude).toFixed(4)}, {parseFloat(inc.longitude).toFixed(4)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {new Date(inc.reported_at || Date.now()).toLocaleTimeString()}
                  </div>
                  {canReport && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(inc.incident_id); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,51,51,0.6)', cursor: 'pointer', fontSize: '0.65rem', textDecoration: 'underline', padding: 0 }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
