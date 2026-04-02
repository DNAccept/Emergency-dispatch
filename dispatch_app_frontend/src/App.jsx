import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

const SearchBox = () => {
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
        map.flyTo([parseFloat(lat), parseFloat(lon)], 14, { duration: 1.5 });
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
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, width: '220px' }}>
      <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.8)', padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <input 
          placeholder="Search Area..." 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          onKeyDown={onKeyDown}
          style={{ flex: 1, fontSize: '0.7rem', padding: '0.2rem', background: 'transparent', border: 'none', color: 'white' }} 
        />
        <button 
          type="button" 
          onClick={handleSearch} 
          disabled={searching} 
          style={{ background: '#1a6fff', color: 'white', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '2px', cursor: 'pointer', fontSize: '0.65rem' }}
        >
          {searching ? '...' : '🔍'}
        </button>
      </div>
    </div>
  );
};

const MapFocuser = ({ selectedId, vehicles }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const v = vehicles.find(x => (x.vehicle_id || x._id) === selectedId);
    if (v) {
      const lat = parseFloat(v.current_lat || v.latitude);
      const lng = parseFloat(v.current_long || v.longitude);
      if (lat && lng) map.flyTo([lat, lng], 15, { duration: 1.5 });
    }
  }, [selectedId, vehicles, map]);
  return null;
};

const HEALTH_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUxIiBoZWlnaHQ9IjE1MSIgdmlld0JveD0iMCAwIDE1MSAxNTEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTcsMUM2LjQsMSw2LDEuNCw2LDJWNEgyQzEuNCw2LDEsNi40LDEsN1Y4YzAsMC42LDAuNCwxLDEsMWg0djRjMCwwLjYsMC40LDEsMSwxaDFjMC42LDAsMS0wLjQsMS0xVjloNGMwLjYsMCwxLTAuNCwxLTFWN2MwLTAuNi0wLjgtMS0xLTFIOVYyYzAtMC42LDAuNC0xLDEtMUg3eiIvPjwvc3ZnPg==';
const POLICE_SVG = 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmZmZmIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjguNTgxIDIwLjU0NGMwIDMuMzY5LTIuNzg5IDMuMzY5LTQuMjkyIDMuMzY5aC0xLjg3NHYtNi4zNjloMi4zNTVjMS4zMTcgMCAzLjgxMSAwIDMuODExIDN6bTE0LjM5Ni0zLjM2M2MuMjc4LTMuNDI4IDEuMjcxLTYuNTc0IDMuMDIzLTkuNDU4bC02LjcxOS02LjcyM2MtMi4xMjMgMS44MjgtNC41MzkgMi44NC03LjI3OSAzLjAxOS0yLjUwOS4yMjctNC44OTEtLjI1LTcuMTI3LTEuNDM0LTIuMzAxIDEuMTQ2LTQuNjcxIDEuNjI1LTcuMTQyIDEuNDM0LTIuNTU2LS4yMjktNC44NjItMS4xMzUtNi45MjgtMi43NDFsLTYuNzM4IDYuNzJjMS42NTcgMi45MjUgMi41OCA1Ljk4NyAyLjc2MiA5LjE4My4wODYgMS40NzItLjMzNCAzLjQ5OC0xLjI3NiA2LjExNy0uNDkzIDEuNDUyLS44NjYgMi43MTUtMS4minAzLjc2NC0uMjM1IDEuMDQ1LS4zODIgMS44OTUtLjQzMSAyLjUzMS0uMDM1IDIuNzkxLjc0OCA1LjMxMSAyLjM1MyA3LjU1IDEuMjU0IDEuNjM1IDMuMzIyIDMuNDQwIDYuMTk0IDUuNDE1IDMuMTQyIDEuNiA1LjU3NCAyLjYzOSA3LjI3NyAzLjA4M1sMS40MTIuNjU2Yy40NDQuMjE0LjkyMC40MjEgMS40MTcuNjQ3IDEuMDcxLjY0MiAxLjgyNCAxLjMzOSAyLjIyIDIuMDU3LjQ4Ni0uNzc3IDEuMjU1LTEuNDU2IDIuMjc3LTIuMDU3LjcyMi0uMzE0IDEuMzMzLS41ODggMS44MjMtLjgyOC40OS0uMjE1Ljg1NS0uMzc3IDEuMDY3LS40NzYuMzYzLS4xODEuODQtLjM4NyAxLjQxNy0uNjE1LjU4My0uMjI5IDEuMzAyLS41MSAyLjE2MS0uODIgMS42Ni0uNTg5IDIuODY4LTEuMTQ0IDMuNjM2LTEuNjQ2IDIuNzg1LTEuOTc1IDQuODIxLTMuNzUwIDYuMTE3LTUuMzM5IDEuNjYyLTIuMjQ5IDIuNDY5LTQuNzgwIDIuNDMyLTcuNjI2LS4wOTgtMS4yNzQtLjYzNy0zLjMxMy0xLjYxNi02LjA5MS0uOTM0LTIuNzA0LTEuMzQ4LTQuODA0LTEuMjEyLTYuMzJ6bS0xMi4zNSA5LjIxYy0xLjU5NSAxLjA0NC0zLjc4OCAxLjA0NC00LjkzMyAxLjA0NGgtMy4xNDV2OC42MDZoLTQuNzI5di0yMi4wNzZoNi43MTNjMy4xMiAwIDUuNzI5LjIwMSA3LjU0MSAyLjQxMCAxLjEzIDEuNDA2IDEuMzIyIDMuMDAzIDEuMzIyIDQuMTM4LS4wMDIgMi41NzEtMS4wNjEgNC43NDEtMi43NjkgNS44Nzh6Ii8+PC9zdmc+';
const FIRE_SVG   = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgLTAuNSAxNyAxNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMywxNC4wNDcgTDIuNjc0LDE0LjA0NyBDMi4zMDMsMTQuMDQ3IDIsMTQuNTA0IDIsMTUuMDY2IEwyLDE1Ljk1OSBMOS45ODYsMTUuOTU5IEw5Ljk4NywxNS45NTkgTDkuOTg3LDE1LjA2NiBDOS45ODcsMTQuNTAzIDkuNjg0LDE0LjA0NyA5LjMxMywxNC4wNDcgTDguOTU2LDE0LjA0NyBMOC45NTYsNiBMMyw2IEwzLDE0LjA0NyBaIiAvPjxwYXRoIGQ9Ik0yLDQgTDIsNC45NDIgTDEwLDUgTDEwLDQgTDIsNCBaIiAvPjxwYXRoIGQ9Ik01LDEuMTQxNzI0NjggQzMuODUyMTM0NjIsMS40MTIxOTY2NyAzLjAzMSwyLjEzNTA3NjcxIDMuMDMxLDIuOTg0IEw4Ljk2OSwyLjk4NCBDOC45NjksMi4xMzA0OTY2NyA4LjEzODM1NjcsMS40MDQ0MDAyOSA2Ljk4MSwxLjEzNzM4NjU1IEw2Ljk4MSwwIEw1LDAgTDUsMS4xNDE3MjQ2OCBaIiAvPjxwYXRoIGQ9Ik0xLDggTDEsNyBMMS45NDcsNyBMMS45NDcsOCBMMS45NzQsOCBMMS45NzQsOC45NyBMMS45NDcsOC45NyBMMS45NDcsOS45MDggTDEsOS45MDggTDEsOC45NyBMMCw4Ljk3IEwwLDggTDEsOCBaIiAvPjxwYXRoIGQ9Ik0xMC45NTMsOC45MzggTDEwLjk1Myw5LjkwNiBMMTAsOS45MDYgTDEwLDcgTDEwLjk1Myw3IEwxMC45NTMsOCBMMTEuOTQyLDggTDExLjk0Miw4LjkzOCBMMTAuOTUzLDguOTM4IFoiIC8+PC9nPjwvc3ZnPg==';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

function createVehicleIcon(type, status, isSelected) {
  const cfg = SERVICE_CONFIG[type] || SERVICE_CONFIG.Hospital;
  const c = cfg.color;
  const emoji = cfg.emoji;
  const size = isSelected ? 34 : 28;
  const glow = isSelected ? `0 0 15px ${c}, 0 0 5px #fff` : `0 0 8px ${c}`;
  let overlay = '', opacity = 1;

  if (status === 'FAULTY') {
    opacity = 0.3;
    overlay = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ff3b30;font-size:${size}px;font-weight:900;text-shadow:0 0 5px #000">✕</div>`;
  } else if (status === 'PENDING') {
    opacity = 0.8;
    overlay = `<div style="position:absolute;bottom:-4px;right:-4px;background:#ffcc00;color:#000;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center;font-size:10px;border:1px solid #000">!</div>`;
  }

  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:#1a1d21;border:2px solid ${isSelected ? '#fff' : c};border-radius:50%;box-shadow:${glow};display:flex;align-items:center;justify-content:center;opacity:${opacity};position:relative">
            <span style="font-size:16px">${emoji}</span>${overlay}</div>`,
    iconSize: [size, size], iconAnchor: [size/2, size/2]
  });
}

function createColoredIcon(types) {
  const tArray = Array.isArray(types) ? types : (typeof types === 'string' ? types.split(', ') : ['Medical']);
  const icons = { Medical: HEALTH_SVG, Fire: FIRE_SVG, Crime: POLICE_SVG, Traffic: POLICE_SVG };
  
  const iconHtml = tArray.map(t => {
    const icon = icons[t] || HEALTH_SVG;
    const color = INCIDENT_CONFIG[t]?.color || '#fff';
    return `<div style="width:24px;height:24px;background:#1a1d21;border:2px solid ${color};border-radius:50%;box-shadow:0 0 8px ${color};display:flex;align-items:center;justify-content:center;margin: 0 -4px; z-index: ${tArray.indexOf(t)}">
              <img src="${icon}" style="width:14px;height:14px" />
            </div>`;
  }).join('');

  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;min-width:30px">${iconHtml}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  });
}

const SERVICE_CONFIG = {
  Hospital: { color: '#00d4aa', emoji: '🚑', label: 'Ambulance' },
  Police:   { color: '#1a6fff', emoji: '🚓', label: 'Police' },
  Fire:     { color: '#ff4500', emoji: '🚒', label: 'Fire' },
};

const INCIDENT_CONFIG = {
  Medical:  { color: '#00d4aa' },
  Fire:     { color: '#ff4500' },
  Crime:    { color: '#1a6fff' },
  Traffic:  { color: '#ffb800' },
};

const App = ({ token }) => {
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const jwt = token || localStorage.getItem('jwt');

  const fetchData = async () => {
    if (!jwt) return;
    try {
      const AUTH_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'https://auth-service-spk6.onrender.com';
      const DISPATCH_URL = import.meta.env.VITE_DISPATCH_SERVICE_URL || 'https://dispatch-service-tjgl.onrender.com';
      const INCIDENT_URL = import.meta.env.VITE_INCIDENT_SERVICE_URL || 'https://incident-service-9yox.onrender.com';
      const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'https://analytics-service-hreo.onrender.com';

      const vRes = await fetch(`${DISPATCH_URL}/vehicles/`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      const vData = await vRes.json();
      setVehicles(Array.isArray(vData) ? vData : []);

      const iRes = await fetch(`${INCIDENT_URL}/incidents/open`, { headers: { 'Authorization': `Bearer ${jwt}` } });
      const iData = await iRes.json();
      setIncidents(Array.isArray(iData) ? iData : []);
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    if (jwt) {
      fetch('https://auth-service-spk6.onrender.com/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
        .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
      fetchData();
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [jwt]);

  const filteredVehicles = filter === 'ALL' ? vehicles : vehicles.filter(v => v.service_type === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', color: 'white' }}>
      <div className="section-header">
        <div className="section-title">Tactical <span>Command</span></div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'Hospital', 'Police', 'Fire'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.7rem' }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ height: '600px', background: '#0a0c10', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <MapResizer />
          <SearchBox />
          <MapFocuser selectedId={selectedVehicleId} vehicles={vehicles} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          
          {/* Incidents (Multi-Icon) */}
          {incidents.map(inc => (
            <Marker key={inc.incident_id} position={[inc.latitude, inc.longitude]} icon={createColoredIcon(inc.type)}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: 150 }}>
                  <div style={{ fontWeight: 700 }}>{inc.type} Incident</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Status: {inc.status}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Vehicles */}
          {filteredVehicles.map(v => (
            <Marker key={v.vehicle_id} position={[v.current_lat, v.current_long]} icon={createVehicleIcon(v.service_type, v.status, selectedVehicleId === v.vehicle_id)} eventHandlers={{ click: () => setSelectedVehicleId(v.vehicle_id) }}>
              <Popup>Unit: {v.unit_name} ({v.status})</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Fleet Table */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {filteredVehicles.map(v => (
          <div key={v.vehicle_id} onClick={() => setSelectedVehicleId(v.vehicle_id)} style={{ minWidth: 150, background: 'rgba(0,0,0,0.3)', padding: '0.75rem', border: `1px solid ${selectedVehicleId === v.vehicle_id ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: '4px', cursor: 'pointer' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{v.unit_name}</div>
            <div style={{ fontSize: '0.65rem', color: v.status === 'READY' ? 'var(--secondary)' : 'var(--danger)' }}>{v.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
