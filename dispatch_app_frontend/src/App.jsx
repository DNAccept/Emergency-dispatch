import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const defaultCenter = [5.6037, -0.1870];

// ── Config ───────────────────────────────────────────────────────────────────
const SERVICE_CONFIG = {
  Hospital: { color: '#00d4aa', glow: 'rgba(0,212,170,0.5)', emoji: '🚑', label: 'Ambulance',    bg: 'rgba(0,212,170,0.08)',  border: 'rgba(0,212,170,0.25)'  },
  Police:   { color: '#1a6fff', glow: 'rgba(26,111,255,0.5)', emoji: '🚓', label: 'Police Unit', bg: 'rgba(26,111,255,0.08)', border: 'rgba(26,111,255,0.25)' },
  Fire:     { color: '#ff4500', glow: 'rgba(255,69,0,0.5)',   emoji: '🚒', label: 'Fire Unit',   bg: 'rgba(255,69,0,0.08)',   border: 'rgba(255,69,0,0.25)'   },
};

const INCIDENT_CONFIG = {
  Medical: { color: '#00d4aa', icon: '🏥' },
  Fire:    { color: '#ff4500', icon: '🔥' },
  Crime:   { color: '#1a6fff', icon: '🚔' },
  Traffic: { color: '#ffb800', icon: '🚗' },
};

const STATUS_META = {
  READY:         { label: 'Ready',          color: '#00d4aa', dot: '#00d4aa' },
  DISPATCHED:    { label: 'Dispatched',     color: '#1a6fff', dot: '#1a6fff' },
  ON_SCENE:      { label: 'On Scene',       color: '#ffb800', dot: '#ffb800' },
  HOSPITAL_DROP: { label: 'Hospital Drop',  color: '#9b59b6', dot: '#9b59b6' },
  RETURNING:     { label: 'Returning',      color: '#ff8c00', dot: '#ff8c00' },
  FAULTY:        { label: 'Faulty',         color: '#ff3333', dot: '#ff3333' },
  PENDING:       { label: 'Pending',        color: '#aaa',    dot: '#aaa'    },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const MapResizer = () => {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 400); return () => clearTimeout(t); }, [map]);
  return null;
};

const MapFocuser = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 1.2 });
  }, [target, map]);
  return null;
};

const SearchBox = () => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const search = async () => {
    if (!query) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Ghana')}`);
      const d = await r.json();
      if (d[0]) map.flyTo([parseFloat(d[0].lat), parseFloat(d[0].lon)], 14, { duration: 1.5 });
    } catch {}
  };
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 4 }}>
      <input
        value={query} onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && search()}
        placeholder="Search area…"
        style={{ width: 180, fontSize: '0.72rem', padding: '0.35rem 0.6rem', background: 'rgba(6,10,15,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, color: 'white' }}
      />
      <button onClick={search} style={{ background: 'rgba(26,111,255,0.8)', border: 'none', borderRadius: 3, color: '#fff', padding: '0 0.7rem', cursor: 'pointer', fontSize: '0.75rem' }}>🔍</button>
    </div>
  );
};

// inactive = READY / FAULTY / PENDING (no active assignment)
function createVehicleIcon(type, status, selected, inactive) {
  const cfg = SERVICE_CONFIG[type] || SERVICE_CONFIG.Hospital;
  const sm  = STATUS_META[status] || STATUS_META.READY;

  // Inactive units: smaller, no glow, heavily dimmed
  const sz     = selected ? 36 : inactive ? 22 : 28;
  const alpha  = inactive ? 0.25 : (status === 'FAULTY' ? 0.4 : 1);
  const border = selected ? '#ffffff' : inactive ? 'rgba(255,255,255,0.2)' : cfg.color;
  const glow   = inactive ? 'none'
    : selected ? `0 0 18px ${cfg.glow}, 0 0 6px #fff`
    : ['DISPATCHED','RETURNING','HOSPITAL_DROP'].includes(status) ? `0 0 12px ${cfg.glow}`
    : `0 0 6px ${cfg.glow}`;

  const pulse = !inactive && (status === 'ON_SCENE' || status === 'HOSPITAL_DROP')
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${sm.color};opacity:0.5;animation:ping 1.4s ease-out infinite"></div>` : '';

  const badge = !inactive && status === 'FAULTY'
    ? `<div style="position:absolute;bottom:-3px;right:-3px;background:#ff3333;border-radius:50%;width:10px;height:10px;border:1px solid #000;font-size:7px;line-height:10px;text-align:center;color:#fff">✕</div>`
    : !inactive && ['DISPATCHED','HOSPITAL_DROP','RETURNING'].includes(status)
      ? `<div style="position:absolute;bottom:-3px;right:-3px;background:${sm.dot};border-radius:50%;width:8px;height:8px;border:1px solid #000;animation:blink 1s infinite"></div>` : '';

  return L.divIcon({
    className: '',
    html: `<style>
      @keyframes ping { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.8);opacity:0} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    </style>
    <div style="position:relative;width:${sz}px;height:${sz}px;opacity:${alpha}">
      ${pulse}
      <div style="width:${sz}px;height:${sz}px;background:#0d1117;border:2px solid ${border};border-radius:50%;box-shadow:${glow};display:flex;align-items:center;justify-content:center;filter:${inactive ? 'grayscale(0.8)' : 'none'}">
        <span style="font-size:${sz * 0.5}px;line-height:1">${cfg.emoji}</span>
      </div>
      ${badge}
    </div>`,
    iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2]
  });
}

function createIncidentIcon(types) {
  const tArr = Array.isArray(types) ? types : String(types || 'Medical').split(', ');
  const chips = tArr.map(t => {
    const c = INCIDENT_CONFIG[t]?.color || '#fff';
    const icon = INCIDENT_CONFIG[t]?.icon || '⚠';
    return `<div style="width:26px;height:26px;background:#0d1117;border:2px solid ${c};border-radius:50%;box-shadow:0 0 8px ${c};display:flex;align-items:center;justify-content:center;font-size:12px;margin:0 -3px">${icon}</div>`;
  }).join('');
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center">${chips}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  });
}

// ── App ───────────────────────────────────────────────────────────────────────
const App = ({ token }) => {
  const [vehicles,  setVehicles]  = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selected,  setSelected]  = useState(null); // vehicle_id
  const [filter,    setFilter]    = useState('ALL');
  const [mapFocus,  setMapFocus]  = useState(null);
  const [log,       setLog]       = useState([]);   // activity log entries
  const prevStatusRef = useRef({});
  const jwt = token || localStorage.getItem('jwt');

  const DISPATCH_URL = import.meta.env.VITE_DISPATCH_SERVICE_URL || 'https://dispatch-service-tjgl.onrender.com';
  const INCIDENT_URL = import.meta.env.VITE_INCIDENT_SERVICE_URL || 'https://incident-service-9yox.onrender.com';

  const fetchData = async () => {
    if (!jwt) return;
    try {
      const [vRes, iRes] = await Promise.all([
        fetch(`${DISPATCH_URL}/vehicles/`, { headers: { Authorization: `Bearer ${jwt}` } }),
        fetch(`${INCIDENT_URL}/incidents/open`)
      ]);
      const vData = await vRes.json();
      const iData = await iRes.json();
      const vs = Array.isArray(vData) ? vData : [];
      setVehicles(vs);
      setIncidents(Array.isArray(iData) ? iData : []);

      // Activity log — detect status transitions
      vs.forEach(v => {
        const prev = prevStatusRef.current[v.vehicle_id];
        if (prev && prev !== v.status) {
          const sm  = STATUS_META[v.status] || {};
          const cfg = SERVICE_CONFIG[v.service_type] || {};
          setLog(l => [{
            id: `${v.vehicle_id}-${Date.now()}`,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            unit: v.unit_name,
            from: prev,
            to: v.status,
            color: sm.color || '#aaa',
            emoji: cfg.emoji || '🚗'
          }, ...l].slice(0, 30));
        }
        prevStatusRef.current[v.vehicle_id] = v.status;
      });
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 3500);
    return () => clearInterval(iv);
  }, [jwt]);

  const activeStatuses = ['DISPATCHED','ON_SCENE','HOSPITAL_DROP','RETURNING'];

  const handleDeleteVehicle = async (v) => {
    if (!v) return;
    const confirmMsg = `Are you sure you want to decommission unit ${v.unit_name} (${v.vehicle_id})? This action will remove it from the fleet permanently.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${DISPATCH_URL}/vehicles/${v.vehicle_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.ok) {
        setSelected(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Decommissioning failed');
      }
    } catch (err) {
      alert('Network error while decommissioning unit.');
    }
  };

  const handleSelectVehicle = (v) => {
    setSelected(v.vehicle_id);
    setMapFocus([v.current_lat, v.current_long]);
  };

  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.service_type === filter);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const total     = vehicles.length;
  const ready     = vehicles.filter(v => v.status === 'READY').length;
  const active    = vehicles.filter(v => activeStatuses.includes(v.status)).length;
  const faulty    = vehicles.filter(v => v.status === 'FAULTY').length;
  const openInc   = incidents.length;

  const selectedVehicle = vehicles.find(v => v.vehicle_id === selected);
  const sm = selectedVehicle ? (STATUS_META[selectedVehicle.status] || STATUS_META.READY) : null;
  const sc = selectedVehicle ? (SERVICE_CONFIG[selectedVehicle.service_type] || SERVICE_CONFIG.Hospital) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', color: 'white' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-title">Tactical <span>Command</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginTop: 2 }}>
            LIVE FLEET TRACKING · ACCRA METROPOLITAN
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-live">Live</span>
          {['ALL','Hospital','Police','Fire'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.68rem', padding: '0.35rem 0.8rem' }}
            >
              {SERVICE_CONFIG[f] ? `${SERVICE_CONFIG[f].emoji} ${f}` : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
        {[
          { label: 'Fleet Total',     value: total,   color: 'var(--text-main)', icon: '🚗' },
          { label: 'Available',       value: ready,   color: '#00d4aa',          icon: '✅' },
          { label: 'Deployed',        value: active,  color: '#1a6fff',          icon: '📡' },
          { label: 'Faulty',          value: faulty,  color: '#ff3333',          icon: '⚠' },
          { label: 'Active Incidents',value: openInc, color: '#ffb800',          icon: '🔴' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{k.icon}</span>
            <div>
              <div className="stat-card-label" style={{ marginBottom: 2 }}>{k.label}</div>
              <div className="stat-card-value" style={{ fontSize: '1.4rem', color: k.color }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 3-column layout ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0.75rem', minHeight: 0 }}>

        {/* ── MAP ───────────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', background: '#0a0c10', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}>
          <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <MapResizer />
            <SearchBox />
            {mapFocus && <MapFocuser target={mapFocus} />}
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            {/* Incidents */}
            {incidents.map(inc => inc.latitude && inc.longitude ? (
              <Marker
                key={inc.incident_id}
                position={[parseFloat(inc.latitude), parseFloat(inc.longitude)]}
                icon={createIncidentIcon(inc.type)}
              >
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: 140 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{inc.type}</div>
                    <div style={{ fontSize: '0.78rem', color: '#555' }}>Status: {inc.status}</div>
                    <div style={{ fontSize: '0.78rem', color: '#777', marginTop: 2 }}>Unit: {inc.assigned_unit_id || 'Unassigned'}</div>
                  </div>
                </Popup>
              </Marker>
            ) : null)}

            {/* Vehicles + routes */}
            {(() => {
              // Build vehicle_id → incident-type colour map for dispatch lines.
              // assigned_unit_id may be a CSV of vehicle IDs (e.g. "V1, V2").
              const vehicleIncidentColor = {};
              incidents.forEach(inc => {
                if (!inc.assigned_unit_id) return;
                const unitIds = inc.assigned_unit_id.split(',').map(s => s.trim());
                // Derive colour from first incident type in the comma-separated type string
                const firstType = String(inc.type || '').split(',')[0].trim();
                const colour = INCIDENT_CONFIG[firstType]?.color || '#ffffff';
                unitIds.forEach(uid => { vehicleIncidentColor[uid] = colour; });
              });

              const INACTIVE_STATUSES = new Set(['READY', 'FAULTY', 'PENDING']);

              return filtered.map(v => {
                const inactive   = INACTIVE_STATUSES.has(v.status);
                const routeColor = vehicleIncidentColor[v.vehicle_id]
                  || (v.status === 'HOSPITAL_DROP' ? '#9b59b6' // purple for hospital drop
                  : v.status === 'RETURNING'       ? 'rgba(255,255,255,0.4)' // dim white for return
                  : SERVICE_CONFIG[v.service_type]?.color || '#fff');

                return (
                  <React.Fragment key={v.vehicle_id}>
                    {/* Road-following route line — shrinks as vehicle consumes points */}
                    {['DISPATCHED','RETURNING','HOSPITAL_DROP'].includes(v.status) && v.target_route?.length > 0 && (
                      <Polyline
                        positions={[[v.current_lat, v.current_long], ...v.target_route]}
                        color={routeColor}
                        weight={selected === v.vehicle_id ? 4 : 3}
                        opacity={v.status === 'RETURNING' ? 0.35 : (selected === v.vehicle_id ? 0.95 : 0.75)}
                        dashArray={v.status === 'RETURNING' ? '6 9' : v.status === 'HOSPITAL_DROP' ? '3 7' : ''}
                      />
                    )}
                    <Marker
                      position={[v.current_lat, v.current_long]}
                      icon={createVehicleIcon(v.service_type, v.status, selected === v.vehicle_id, inactive)}
                      eventHandlers={{ click: () => handleSelectVehicle(v) }}
                      zIndexOffset={inactive ? -100 : 0}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'sans-serif' }}>
                          <div style={{ fontWeight: 700 }}>{v.unit_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#555' }}>{v.service_type} · {v.status}</div>
                          <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>ID: {v.vehicle_id}</div>
                          {!activeStatuses.includes(v.status) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v); }}
                              style={{ marginTop: 8, width: '100%', background: 'rgba(255,51,51,0.1)', color: '#ff3333', border: '1px solid rgba(255,51,51,0.2)', borderRadius: 2, padding: '0.25rem', fontSize: '0.65rem', cursor: 'pointer' }}
                            >
                              Decommission Unit
                            </button>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              });
            })()}
          </MapContainer>

          {/* Map legend overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(6,10,15,0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '0.5rem 0.75rem' }}>
            {Object.entries(STATUS_META).filter(([k]) => ['READY','DISPATCHED','ON_SCENE','HOSPITAL_DROP','RETURNING','FAULTY'].includes(k)).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot, boxShadow: `0 0 4px ${v.dot}` }} />
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}>

          {/* Selected vehicle panel */}
          {selectedVehicle ? (
            <div style={{ background: `linear-gradient(135deg, ${sc.bg}, rgba(0,0,0,0.4))`, border: `1px solid ${sc.border}`, borderLeft: `3px solid ${sc.color}`, borderRadius: 4, padding: '0.9rem 1rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{sc.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.06em' }}>{selectedVehicle.unit_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>{selectedVehicle.vehicle_id}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', padding: 2 }}>✕</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sm.color, boxShadow: `0 0 6px ${sm.color}`, animation: ['DISPATCHED','HOSPITAL_DROP','RETURNING'].includes(selectedVehicle.status) ? 'blink 1s infinite' : 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: sm.color, letterSpacing: '0.08em' }}>{sm.label}</span>
              </div>

              {[
                ['Service',  selectedVehicle.service_type],
                ['Station', selectedVehicle.parking_station || '—'],
                ['Lat',     selectedVehicle.current_lat?.toFixed(5)],
                ['Long',    selectedVehicle.current_long?.toFixed(5)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{v}</span>
                </div>
              ))}
              
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {activeStatuses.includes(selectedVehicle.status) ? (
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 2 }}>
                    Active units cannot be decommissioned
                  </div>
                ) : (
                  <button 
                    onClick={() => handleDeleteVehicle(selectedVehicle)}
                    style={{ width: '100%', background: 'rgba(255,51,51,0.15)', color: '#ff4444', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 3, padding: '0.5rem', fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => e.target.style.background = 'rgba(255,51,51,0.25)'}
                    onMouseOut={e => e.target.style.background = 'rgba(255,51,51,0.15)'}
                  >
                    DECOMMISSION UNIT
                  </button>
                )}
              </div>
              <style>{`@keyframes blink { 0%,100%{opacity:1}50%{opacity:0.2} }`}</style>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 4, padding: '1.2rem 1rem', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>📡</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>CLICK A UNIT ON THE MAP</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-dim)', opacity: 0.6, marginTop: 4 }}>to view unit details</div>
            </div>
          )}

          {/* Activity log */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Activity Log</span>
              {log.length > 0 && (
                <button onClick={() => setLog([])} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.6rem' }}>Clear</button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
              {log.length === 0 ? (
                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                  Waiting for unit status changes…
                </div>
              ) : log.map(entry => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', animation: 'fadeIn 0.3s ease-out' }}>
                  <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{entry.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.unit}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: '#888' }}>{entry.from}</span>
                      {' → '}
                      <span style={{ color: entry.color }}>{entry.to}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-dim)', flexShrink: 0 }}>{entry.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fleet Table ────────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              No units registered.
            </div>
          ) : filtered.map(v => {
            const s  = STATUS_META[v.status] || STATUS_META.READY;
            const sf = SERVICE_CONFIG[v.service_type] || SERVICE_CONFIG.Hospital;
            const isSelected = selected === v.vehicle_id;
            return (
              <div
                key={v.vehicle_id}
                onClick={() => handleSelectVehicle(v)}
                style={{
                  minWidth: 160,
                  padding: '0.7rem 0.9rem',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                  borderBottom: isSelected ? `2px solid ${sf.color}` : '2px solid transparent',
                  background: isSelected ? sf.bg : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.9rem' }}>{sf.emoji}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.04em' }}>
                    {v.unit_name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, boxShadow: `0 0 4px ${s.dot}`, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: s.color, letterSpacing: '0.06em' }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-dim)', marginTop: 3 }}>
                  {v.parking_station || v.service_type}
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
