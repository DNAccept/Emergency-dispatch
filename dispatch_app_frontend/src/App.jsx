import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

function createVehicleIcon(type, available) {
  const colors = { AMBULANCE: '#00d4aa', POLICE: '#1a6fff', FIRE: '#ff4500' };
  const c = colors[type] || '#888';
  const opacity = available ? 1 : 0.4;
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${c};border:2px solid rgba(255,255,255,0.8);border-radius:3px;box-shadow:0 0 10px ${c};opacity:${opacity}"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8]
  });
}

const SERVICE_CONFIG = {
  AMBULANCE: { color: '#00d4aa', icon: '🚑', label: 'Ambulance' },
  POLICE:    { color: '#1a6fff', icon: '🚔', label: 'Police' },
  FIRE:      { color: '#ff4500', icon: '🚒', label: 'Fire' },
};

const App = ({ token }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [responderLocation, setResponderLocation] = useState({ lat: 5.6030, lng: -0.1880 });
  const [activeIncident] = useState({ type: 'Medical', lat: 5.6120, lng: -0.1780 });
  const [filter, setFilter] = useState('ALL');
  const jwt = token || localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      fetch('http://localhost:3001/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    }
  }, [jwt]);

  useEffect(() => {
    const fetchVehicles = () => {
      fetch('http://localhost:3003/vehicles/available', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json())
        .then(d => { setVehicles(Array.isArray(d) ? d : (d.vehicles || [])); setLoading(false); })
        .catch(() => setLoading(false));
    };
    if (jwt) fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000);
    return () => clearInterval(interval);
  }, [jwt]);

  useEffect(() => {
    if (!profile) return;
    const role = profile.role || profile.user?.role;
    if (role === 'RESPONDER') {
      const t = setInterval(() => {
        setResponderLocation(curr => ({
          lat: curr.lat + (activeIncident.lat - curr.lat) * 0.1,
          lng: curr.lng + (activeIncident.lng - curr.lng) * 0.1
        }));
      }, 4000);
      return () => clearInterval(t);
    }
  }, [profile, activeIncident]);

  const role = profile?.role || profile?.user?.role;
  const isResponder = role === 'RESPONDER';
  const isDispatchView = !isResponder;
  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.service_type === filter);

  const serviceCount = (type) => vehicles.filter(v => v.service_type === type).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', color: 'white' }}>

      {isDispatchView && (
        <>
          <div className="section-header">
            <div className="section-title">Dispatch <span>Tracker</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Live indicator */}
              <span className="badge badge-live">Live Tracking</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '3px', padding: '0.35rem 0.7rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>{serviceCount('AMBULANCE')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Amb</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(26,111,255,0.2)', borderRadius: '3px', padding: '0.35rem 0.7rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--police-blue)' }}>{serviceCount('POLICE')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Police</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '3px', padding: '0.35rem 0.7rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{serviceCount('FIRE')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fire</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'AMBULANCE', 'POLICE', 'FIRE'].map(f => {
              const cfg = f === 'ALL' ? null : SERVICE_CONFIG[f];
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.85rem', border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.08)'}`, borderRadius: '2px', background: active ? `${cfg ? cfg.color + '18' : 'rgba(255,255,255,0.08)'}` : 'transparent', color: active ? (cfg?.color || 'var(--text-main)') : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.12s' }}>
                  {cfg?.icon && <span style={{ marginRight: '0.3rem' }}>{cfg.icon}</span>}{f}
                </button>
              );
            })}
          </div>

          {/* Map */}
          <div style={{ flex: 1, minHeight: 420, borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 0 }}>
            <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filtered.map(v => {
                const lat = v.current_lat || v.latitude;
                const lng = v.current_long || v.longitude;
                if (!lat || !lng) return null;
                const cfg = SERVICE_CONFIG[v.service_type] || SERVICE_CONFIG.AMBULANCE;
                return (
                  <Marker key={v.vehicle_id || v._id || Math.random()} position={[lat, lng]} icon={createVehicleIcon(v.service_type, v.is_available)}>
                    <Popup>
                      <div style={{ fontFamily: 'sans-serif', minWidth: 150 }}>
                        <strong style={{ color: cfg.color }}>{cfg.icon} {v.unit_name || v.type || 'Unit'}</strong><br />
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>Service: {v.service_type}</span><br />
                        <span style={{ color: v.is_available ? '#00d4aa' : '#ff4500', fontSize: '0.8rem' }}>{v.is_available ? '● Available' : '● Deployed'}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Vehicle Cards */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {loading && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Connecting to dispatch...</span>}
            {!loading && filtered.length === 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>No units online</span>}
            {filtered.map(v => {
              const cfg = SERVICE_CONFIG[v.service_type] || { color: '#888', icon: '🚗', label: v.service_type };
              const lat = parseFloat(v.current_lat || v.latitude || 0);
              const lng = parseFloat(v.current_long || v.longitude || 0);
              return (
                <div key={v.vehicle_id || v._id || Math.random()} style={{ minWidth: 180, flexShrink: 0, background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.05)`, borderTop: `2px solid ${cfg.color}`, borderRadius: '3px', padding: '0.75rem 0.9rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cfg.color, marginBottom: '0.4rem' }}>
                    {cfg.icon} {v.unit_name || ('Unit ' + String(v.vehicle_id || v._id || '').substring(0,4))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    <div>{cfg.label}</div>
                    <div>{lat.toFixed(4)}, {lng.toFixed(4)}</div>
                    <div style={{ color: v.is_available ? 'var(--secondary)' : 'var(--primary)' }}>{v.is_available ? '● Available' : '● Deployed'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Responder View */}
      {isResponder && (
        <div>
          <div className="section-header">
            <div className="section-title">Responder <span>Navigation</span></div>
            <span className="badge badge-live">GPS Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '3px', padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Assignment</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{activeIncident.type} Emergency</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {activeIncident.lat.toFixed(4)}, {activeIncident.lng.toFixed(4)}
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Acknowledge</button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Location</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--secondary)' }}>{responderLocation.lat.toFixed(5)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--secondary)' }}>{responderLocation.lng.toFixed(5)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Transmitting every 4s</div>
            </div>
          </div>
          <div style={{ height: 320, borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 0 }}>
            <MapContainer center={[activeIncident.lat, activeIncident.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[activeIncident.lat, activeIncident.lng]}><Popup>🎯 Emergency Destination</Popup></Marker>
              <Marker position={[responderLocation.lat, responderLocation.lng]}><Popup>🚑 Your Location</Popup></Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
