import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const HEALTH_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNSAxNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNNywxQzYuNCwxLDYsMS40LDYsMlY0SDJDMS40LDYsMSw2LjQsMSw3VjhjMCwwLjYsMC40LDEsMSwxaDR2NGMwLDAuNiwwLjQsMSwxLDFoMWMwLjYsMCwxLTAuNCwxLTFWOWg0YzAuNiwwLDEtMC40LDEtMVY3YzAtMC42LTAuNC0xLTEtMUg5VjJjMC0wLjYsMC40LTEsMS0xSDd6Ii8+PC9zdmc+';
const POLICE_SVG = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmZmZmIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjguNTgxIDIwLjU0NGMwIDMuMzY5LTIuNzg5IDMuMzY5LTQuMjkyIDMuMzY5aC0xLjg3NHYtNi4zNjloMi4zNTVjMS4zMTcgMCAzLjgxMSAwIDMuODExIDN6bTE0LjM5Ni0zLjM2M2MuMjc4LTMuNDI4IDEuMjcxLTYuNTc0IDMuMDIzLTkuNDU4bC02LjcxOS02LjcyM2MtMi4xMjMgMS44MjgtNC41MzkgMi44NC03LjI3OSAzLjAxOS0yLjUwOS4yMjctNC44OTEtLjI1LTcuMTI3LTEuNDM0LTIuMzAxIDEuMTQ2LTQuNjcxIDEuNjI1LTcuMTQyIDEuNDM0LTIuNTU2LS4yMjktNC44NjItMS4xMzUtNi45MjgtMi43NDFsLTYuNzM4IDYuNzJjMS42NTcgMi45MjUgMi41OCA1Ljk4NyAyLjc2MiA5LjE4My4wODYgMS40NzItLjMzNCAzLjQ5OC0xLjI3NiA2LjExNy0uNDkzIDEuNDUyLS44NjYgMi43MTItMS4xMiAzLjc2NC0uMjM1IDEuMDQ1LS4zODIgMS44OTUtLjQzMSAyLjUzMS0uMDM1IDIuNzkxLjc0OCA1LjMxMSAyLjM1MyA3LjU1IDEuMjU0IDEuNjM1IDMuMzIyIDMuNDQwIDYuMTk0IDUuNDE1IDMuMTQyIDEuNiA1LjU3NCAyLjYzOSA3LjI3NyAzLjA4MWwxLjQxMi42NTZjLjQ0NC4yMTQuOTIwLjQyMSAxLjQxNy42NDcgMS4wNzEuNjQyIDEuODI0IDEuMzM5IDIuMjIgMi4wNTcuNDg2LS43NzcgMS4yNTUtMS40NTYgMi4yNzctMi4wNTcuNzIyLS4zMTQgMS4zMzMtLjU4OCAxLjgyMy0uODI4LjQ5LS4yMTUuODU1LS4zNzcgMS4wNjctLjQ3Ni4zNjMtLjE4MS44NC0uMzg3IDEuNDE3LS42MTUuNTgzLS4yMjkgMS4zMDItLjUxIDIuMTYxLS44MiAxLjY2LS41ODkgMi44NjgtMS4xNDQgMy42MzYtMS42NDYgMi43ODUtMS45NzUgNC44MjEtMy43NTAgNi4xMTctNS4zMzkgMS42NjItMi4yNDkgMi40NjktNC43ODAgMi40MzItNy42MjYtLjA5OC0xLjI3NC0uNjM3LTMuMzEzLTEuNjE2LTYuMDkxLS45MzQtMi43MDQtMS4zNDgtNC44MDQtMS4yMTItNi4zMnptLTEyLjM1IDkuMjFjLTEuNTk1IDEuMDQ0LTMuNzg4IDEuMDQ0LTQuOTMzIDEuMDQ0aC0zLjE0NXY4LjYwNmgtNC43Mjl2LTIyLjA3Nmg2LjcxM2MzLjEyIDAgNS43MjkuMjAxIDcuNTQxIDIuNDEwIDEuMTMxIDEuNDA2IDEuMzIyIDMuMDAzIDEuMzIyIDQuMTM4LS4wMDIgMi41NzEtMS4wNjEgNC43NDEtMi43NjkgNS44Nzh6Ii8+PC9zdmc+';
const FIRE_SVG   = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTciIHZpZXdCb3g9IjAgLTAuNSAxNyAxNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMywxNC4wNDcgTDIuNjc0LDE0LjA0NyBDMi4zMDMsMTQuMDQ3IDIsMTQuNTA0IDIsMTUuMDY2IEwyLDE1Ljk1OSBMOS45ODYsMTUuOTU5IEw5Ljk4NywxNS45NTkgTDkuOTg3LDE1LjA2NiBDOS45ODcsMTQuNTAzIDkuNjg0LDE0LjA0NyA5LjMxMywxNC4wNDcgTDguOTU2LDE0LjA0NyBMOC45NTYsNiBMMyw2IEwzLDE0LjA0NyBaIiAvPjxwYXRoIGQ9Ik0yLDQgTDIsNC45NDIgTDEwLDUgTDEwLDQgTDIsNCBaIiAvPjxwYXRoIGQ9Ik01LDEuMTQxNzI0NjggQzMuODUyMTM0NjIsMS40MTIxOTY2NyAzLjAzMSwyLjEzNTA3NjcxIDMuMDMxLDIuOTg0IEw4Ljk2OSwyLjk4NCBDOC45NjksMi4xMzA0OTY2NyA4LjEzODM1NjcsMS40MDQ0MDAyOSA2Ljk4MSwxLjEzNzM4NjU1IEw2Ljk4MSwwIEw1LDAgTDUsMS4xNDE3MjQ2OCBaIiAvPjxwYXRoIGQ9Ik0xLDggTDEsNyBMMS45NDcsNyBMMS45NDcsOCBMMS45NzQsOCBMMS45NzQsOC45NyBMMS45NDcsOC45NyBMMS45NDcsOS45MDggTDEsOS45MDggTDEsOC45NyBMMCw4Ljk3IEwwLDggTDEsOCBaIiAvPjxwYXRoIGQ9Ik0xMC45NTMsOC45MzggTDEwLjk1Myw5LjkwNiBMMTAsOS45MDYgTDEwLDcgTDEwLjk1Myw3IEwxMC45NTMsOCBMMTEuOTQyLDggTDExLjk0Miw4LjkzOCBMMTAuOTUzLDguOTM4IFoiIC8+PC9nPjwvc3ZnPg==';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

function createVehicleIcon(type, available) {
  const colors = { AMBULANCE: '#00d4aa', POLICE: '#1a6fff', FIRE: '#ff4500' };
  const icons  = { AMBULANCE: HEALTH_SVG, POLICE: POLICE_SVG, FIRE: FIRE_SVG };
  const c = colors[type] || '#888';
  const icon = icons[type] || HEALTH_SVG;
  const opacity = available ? 1 : 0.4;
  return L.divIcon({
    className: '',
    html: `
      <div style="width:28px;height:28px;background:#1a1d21;border:2px solid ${c};border-radius:50%;box-shadow:0 0 10px ${c};display:flex;align-items:center;justify-content:center;opacity:${opacity}">
        <img src="${icon}" style="width:16px;height:16px" />
      </div>
    `,
    iconSize: [28, 28], iconAnchor: [14, 14]
  });
}

const SERVICE_CONFIG = {
  AMBULANCE: { color: '#00d4aa', icon: HEALTH_SVG, label: 'Ambulance' },
  POLICE:    { color: '#1a6fff', icon: POLICE_SVG, label: 'Police' },
  FIRE:      { color: '#ff4500', icon: FIRE_SVG,   label: 'Fire' },
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
      fetch('https://auth-service-spk6.onrender.com/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    }
  }, [jwt]);

  useEffect(() => {
    const fetchVehicles = () => {
      fetch('https://dispatch-service-tjgl.onrender.com/vehicles/available', { headers: { 'Authorization': `Bearer ${jwt}` } })
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
                <button key={f} onClick={() => setFilter(f)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.85rem', border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.08)'}`, borderRadius: '2px', background: active ? `${cfg ? cfg.color + '18' : 'rgba(255,255,255,0.08)'}` : 'transparent', color: active ? (cfg?.color || 'var(--text-main)') : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.12s' }}>
                  {cfg?.icon && <img src={cfg.icon} style={{ width: 14, height: 14 }} />}{f}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: cfg.color, fontWeight: 700 }}>
                          <img src={cfg.icon} style={{ width: 16, height: 16 }} /> {v.unit_name || v.type || 'Unit'}
                        </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cfg.color, marginBottom: '0.4rem' }}>
                    <img src={cfg.icon} style={{ width: 14, height: 14 }} /> {v.unit_name || ('Unit ' + String(v.vehicle_id || v._id || '').substring(0,4))}
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
