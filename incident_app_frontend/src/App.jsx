import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

const INCIDENT_CONFIG = {
  Medical:  { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',  border: 'rgba(0,212,170,0.3)',  icon: '🏥', label: 'Medical Emergency' },
  Fire:     { color: '#ff4500', bg: 'rgba(255,69,0,0.1)',   border: 'rgba(255,69,0,0.3)',   icon: '🔥', label: 'Fire' },
  Crime:    { color: '#1a6fff', bg: 'rgba(26,111,255,0.1)', border: 'rgba(26,111,255,0.3)', icon: '🚔', label: 'Crime / Robbery' },
  Traffic:  { color: '#ffb800', bg: 'rgba(255,184,0,0.1)',  border: 'rgba(255,184,0,0.3)',  icon: '🚗', label: 'Traffic Accident' },
};

const STATUS_COLORS = {
  CREATED: 'var(--warning)', DISPATCHED: 'var(--police-blue)', 'IN_PROGRESS': 'var(--primary)', RESOLVED: 'var(--secondary)'
};

function MapClickHandler({ setDraftLocation }) {
  useMapEvents({ click(e) { setDraftLocation({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 8px ${color}"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
}

const App = ({ token }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draftLocation, setDraftLocation] = useState(null);
  const [draftType, setDraftType] = useState('Medical');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftCitizen, setDraftCitizen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const jwt = token || localStorage.getItem('jwt');

  const fetchIncidents = () => {
    fetch('http://localhost:3002/incidents/open', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(d => { setIncidents(Array.isArray(d) ? d : (d.incidents || [])); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (jwt) fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [jwt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draftLocation) { alert('Click on the map to set location.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:3002/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ type: draftType, latitude: draftLocation.lat, longitude: draftLocation.lng, notes: draftNotes, citizen_name: draftCitizen })
      });
      if (res.ok) {
        setShowForm(false); setDraftLocation(null); setDraftNotes(''); setDraftCitizen('');
        fetchIncidents();
      } else { alert('Failed to submit incident'); }
    } catch { alert('Connection error'); }
    finally { setSubmitting(false); }
  };

  const cfg = INCIDENT_CONFIG[draftType] || INCIDENT_CONFIG.Medical;
  const openCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', color: 'white' }}>
      {/* Header */}
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn"
            style={{ background: showForm ? 'rgba(255,51,51,0.12)' : 'rgba(255,69,0,0.15)', color: showForm ? 'var(--danger)' : 'var(--primary)', border: `1px solid ${showForm ? 'rgba(255,51,51,0.3)' : 'rgba(255,69,0,0.35)'}`, fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {showForm ? '✕ Cancel' : '⚠ Report Emergency'}
          </button>
        </div>
      </div>

      {/* Report Form */}
      {showForm && (
        <div style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '3px', padding: '1.25rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: cfg.color, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{cfg.icon}</span> New Incident Report — Click the map to pin location
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label>Caller Name</label>
                <input placeholder="Citizen's name" value={draftCitizen} onChange={e => setDraftCitizen(e.target.value)} />
              </div>
              <div>
                <label>Incident Type</label>
                <select value={draftType} onChange={e => setDraftType(e.target.value)}>
                  {Object.entries(INCIDENT_CONFIG).map(([k, v]) => (
                    <option key={k} value={k} style={{ color: 'black' }}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>GPS Coordinates</label>
                <input readOnly value={draftLocation ? `${draftLocation.lat.toFixed(5)}, ${draftLocation.lng.toFixed(5)}` : 'Awaiting map click...'} style={{ color: draftLocation ? cfg.color : 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label>Additional Notes</label>
                <input placeholder="Brief description..." value={draftNotes} onChange={e => setDraftNotes(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={submitting || !draftLocation} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', opacity: !draftLocation ? 0.5 : 1 }}>
              {submitting ? 'Submitting...' : '→ Submit Report'}
            </button>
          </form>
        </div>
      )}

      {/* Map + Sidebar layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', minHeight: 500 }}>
        {/* Map */}
        <div style={{ borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 0 }}>
          <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {showForm && <MapClickHandler setDraftLocation={setDraftLocation} />}
            {incidents.map(inc => {
              const c = INCIDENT_CONFIG[inc.type] || INCIDENT_CONFIG.Medical;
              return (
                <Marker key={inc.incident_id || inc.id || Math.random()} position={[inc.latitude, inc.longitude]} icon={createColoredIcon(c.color)} eventHandlers={{ click: () => setSelectedIncident(inc) }}>
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                      <strong style={{ color: c.color }}>{c.icon} {inc.type} Incident</strong><br />
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>Status: {inc.status}</span><br />
                      <span style={{ color: '#666', fontSize: '0.8rem' }}>{new Date(inc.reported_at || Date.now()).toLocaleString()}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {draftLocation && showForm && (
              <Marker position={[draftLocation.lat, draftLocation.lng]} icon={createColoredIcon(cfg.color)}>
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
            const c = INCIDENT_CONFIG[inc.type] || INCIDENT_CONFIG.Medical;
            const statusColor = STATUS_COLORS[inc.status] || 'var(--text-muted)';
            const isSelected = selectedIncident?.incident_id === inc.incident_id;
            return (
              <div key={inc.incident_id || inc.id} onClick={() => setSelectedIncident(isSelected ? null : inc)}
                style={{ background: isSelected ? `${c.bg}` : 'rgba(0,0,0,0.25)', border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.05)'}`, borderLeft: `3px solid ${c.color}`, borderRadius: '2px', padding: '0.6rem 0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.color }}>{c.icon} {inc.type}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: statusColor }}>{inc.status}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {parseFloat(inc.latitude).toFixed(4)}, {parseFloat(inc.longitude).toFixed(4)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {new Date(inc.reported_at || Date.now()).toLocaleTimeString()}
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
