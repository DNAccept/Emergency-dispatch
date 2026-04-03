import React, { useState, useEffect } from 'react';

const ANALYTICS_URL = 'https://analytics-service-hreo.onrender.com';
const DISPATCH_URL  = 'https://dispatch-service-tjgl.onrender.com';
const AUTH_URL      = 'https://auth-service-spk6.onrender.com';

// ── Colours ───────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  Medical: { color: '#00d4aa', icon: '🏥' },
  Fire:    { color: '#ff4500', icon: '🔥' },
  Crime:   { color: '#1a6fff', icon: '🚔' },
  Traffic: { color: '#ffb800', icon: '🚗' },
};
const SERVICE_CFG = {
  Hospital: { color: '#00d4aa', emoji: '🚑' },
  Police:   { color: '#1a6fff', emoji: '🚓' },
  Fire:     { color: '#ff4500', emoji: '🚒' },
};
const STATUS_COLOR = {
  DISPATCHED:            '#1a6fff',
  ON_SCENE:              '#ffb800',
  RETURNING:             '#ff8c00',
  READY:                 '#00d4aa',
  HOSPITAL_DROP_COMPLETE:'#9b59b6',
};

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`, height: '100%', background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function formatSecs(secs) {
  if (secs == null) return '—';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// ── App ───────────────────────────────────────────────────────────────────────
const App = ({ token }) => {
  const [activeTab, setActiveTab]       = useState('overview');
  const [profile,   setProfile]         = useState(null);
  const [vehicles,  setVehicles]        = useState([]);
  const [hospitals, setHospitals]       = useState([]);
  const [responseTimes, setRT]          = useState(null);
  const [activity,  setActivity]        = useState([]);
  const [typeBreakdown, setTypeBreak]   = useState({});
  const [loading,   setLoading]         = useState(true);
  const jwt = token || localStorage.getItem('jwt');

  const fetchAll = async () => {
    if (!jwt) return;
    try {
      const headers = { Authorization: `Bearer ${jwt}` };

      const [vRes, hRes, rtRes, actRes, tbRes] = await Promise.allSettled([
        fetch(`${DISPATCH_URL}/vehicles/`,                              { headers }),
        fetch(`${ANALYTICS_URL}/analytics/hospitals`,                  { headers }),
        fetch(`${ANALYTICS_URL}/analytics/response-times`,             { headers }),
        fetch(`${ANALYTICS_URL}/analytics/dispatch-activity`,          { headers }),
        fetch(`${ANALYTICS_URL}/analytics/incident-type-breakdown`,    { headers }),
      ]);

      if (vRes.status === 'fulfilled') {
        const d = await vRes.value.json();
        if (Array.isArray(d)) setVehicles(d);
      }
      if (hRes.status === 'fulfilled' && hRes.value.ok) {
        const d = await hRes.value.json();
        if (Array.isArray(d)) setHospitals(d);
      }
      if (rtRes.status === 'fulfilled' && rtRes.value.ok) {
        const d = await rtRes.value.json();
        setRT(d);
      }
      if (actRes.status === 'fulfilled' && actRes.value.ok) {
        const d = await actRes.value.json();
        if (Array.isArray(d)) setActivity(d);
      }
      if (tbRes.status === 'fulfilled' && tbRes.value.ok) {
        const d = await tbRes.value.json();
        if (d && typeof d === 'object') setTypeBreak(d);
      }
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    if (!jwt) return;
    fetch(`${AUTH_URL}/auth/profile`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json()).then(d => setProfile(d)).catch(() => {});
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [jwt]);

  // Derived
  const role          = profile?.role || profile?.user?.role;
  const managedStation= profile?.managed_station || profile?.user?.managed_station;
  const isGovt        = role === 'GOVT_EXECUTIVE' || role === 'SYSTEM_ADMIN';
  const isHospAdmin   = role === 'HOSPITAL_ADMIN';

  const ready     = vehicles.filter(v => v.status === 'READY').length;
  const deployed  = vehicles.filter(v => ['DISPATCHED','ON_SCENE','HOSPITAL_DROP','RETURNING'].includes(v.status)).length;
  const utilPct   = vehicles.length > 0 ? Math.round((deployed / vehicles.length) * 100) : 0;

  const avgSecs   = responseTimes?.average_response_time_secs ?? null;
  const byService = responseTimes?.by_service_type || {};
  const totalOSE  = responseTimes?.total_on_scene_events ?? 0;

  // Type breakdown — merge live data with config for display order
  const typeEntries = ['Medical','Fire','Crime','Traffic'].map(t => ({
    type: t, count: typeBreakdown[t] || 0, ...TYPE_CFG[t]
  }));
  const maxTypeCount = Math.max(...typeEntries.map(t => t.count), 1);

  const tabs = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'activity',  label: 'Activity'  },
    { id: 'types',     label: 'By Type'   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Analytics <span>Console</span></div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            LIVE OPERATIONAL METRICS
          </div>
        </div>
        <span className="badge badge-live">Live</span>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
        {[
          {
            label: 'Avg Response',
            value: loading ? '—' : (avgSecs != null ? formatSecs(avgSecs) : 'No Data'),
            color: avgSecs != null ? 'var(--primary)' : 'var(--text-dim)',
            sub: avgSecs != null ? `${totalOSE} response${totalOSE !== 1 ? 's' : ''} recorded` : 'Dispatch a unit to record',
            icon: '⏱'
          },
          {
            label: 'Fleet Size',
            value: loading ? '—' : vehicles.length,
            color: 'var(--text-main)',
            sub: `${ready} ready · ${deployed} deployed`,
            icon: '🚗'
          },
          {
            label: 'Utilization',
            value: loading ? '—' : `${utilPct}%`,
            color: utilPct > 70 ? 'var(--warning)' : 'var(--secondary)',
            sub: `${deployed} active units`,
            icon: '📡'
          },
          {
            label: 'Incidents Logged',
            value: loading ? '—' : (Object.values(typeBreakdown).reduce((s, v) => s + v, 0) || '—'),
            color: 'var(--text-main)',
            sub: 'Since last reset',
            icon: '🔴'
          },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{k.icon}</span>
            <div>
              <div className="stat-card-label">{k.label}</div>
              <div className="stat-card-value" style={{ fontSize: '1.35rem', color: k.color }}>{k.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 2 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.15rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '0.5rem 1rem', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'transparent', color: activeTab === t.id ? 'var(--text-main)' : 'var(--text-muted)',
            cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

          {/* Response time by service */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Avg Response by Service
            </div>
            {['Hospital','Police','Fire'].map(svc => {
              const avg = byService[svc];
              const cfg = SERVICE_CFG[svc];
              return (
                <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{svc}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: avg != null ? cfg.color : 'var(--text-dim)' }}>
                    {avg != null ? formatSecs(avg) : 'No data'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fleet availability */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Fleet Availability
            </div>
            {['Hospital','Police','Fire'].map(svc => {
              const total = vehicles.filter(v => v.service_type === svc).length;
              const rdy   = vehicles.filter(v => v.service_type === svc && v.status === 'READY').length;
              const cfg   = SERVICE_CFG[svc];
              return (
                <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{svc}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: cfg.color }}>
                    {rdy}/{total} Ready
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hospital capacity */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Hospital Capacity
            </div>
            {hospitals.map(h => {
              const pct = h.total_beds > 0 ? h.occupied_beds / h.total_beds : 0;
              return (
                <div key={h.name} style={{ padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{h.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: pct > 0.8 ? 'var(--warning)' : 'var(--secondary)' }}>
                      {h.occupied_beds}/{h.total_beds}
                    </span>
                  </div>
                  <MiniBar value={h.occupied_beds} max={h.total_beds} color={pct > 0.8 ? 'var(--warning)' : 'var(--secondary)'} />
                </div>
              );
            })}
            {hospitals.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.75rem 0' }}>No hospital data</div>}
          </div>

          {/* Hospital admin bed control */}
          {isHospAdmin && managedStation && (
            <div style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 3, padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                Station Control: {managedStation}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Update Bed Occupancy</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="range" min="0"
                  max={hospitals.find(h => h.name === managedStation)?.total_beds || 200}
                  value={hospitals.find(h => h.name === managedStation)?.occupied_beds || 0}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value);
                    try {
                      await fetch(`${ANALYTICS_URL}/analytics/hospitals/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                        body: JSON.stringify({ name: managedStation, occupied_beds: val })
                      });
                      fetchAll();
                    } catch {}
                  }}
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {hospitals.find(h => h.name === managedStation)?.occupied_beds || 0} Beds
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Dispatch Activity Log
            </span>
            <span className="badge badge-live">Live</span>
          </div>

          {activity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              No dispatch events recorded yet.<br />
              <span style={{ opacity: 0.6 }}>Events appear here when vehicles are dispatched to incidents.</span>
            </div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  {['Time','Unit','Service','Incident Type','Status','Response Time'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map((e, i) => {
                  const ts   = new Date(e.timestamp);
                  const scfg = SERVICE_CFG[e.service_type];
                  const tcfg = TYPE_CFG[e.incident_type];
                  const sColor = STATUS_COLOR[e.new_status] || 'var(--text-muted)';
                  return (
                    <tr key={e._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {ts.toLocaleTimeString('en-US', { hour12: false })}
                        <div style={{ fontSize: '0.58rem', opacity: 0.6 }}>{ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600 }}>
                        {scfg && <span style={{ marginRight: 4 }}>{scfg.emoji}</span>}
                        {e.unit_name || e.vehicle_id || '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: scfg?.color || 'var(--text-muted)' }}>
                        {e.service_type || '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {e.incident_type ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '0.67rem', padding: '0.15rem 0.5rem', borderRadius: 2, background: `${tcfg?.color || '#fff'}18`, color: tcfg?.color || '#fff', border: `1px solid ${tcfg?.color || '#fff'}30` }}>
                            {tcfg?.icon} {e.incident_type}
                          </span>
                        ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: sColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sColor, display: 'inline-block', flexShrink: 0 }} />
                          {e.new_status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: e.response_time_secs != null ? 'var(--primary)' : 'var(--text-dim)' }}>
                        {e.response_time_secs != null ? formatSecs(e.response_time_secs) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── BY TYPE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {typeEntries.map(t => (
              <div key={t.type} style={{ background: `${t.color}0a`, border: `1px solid ${t.color}25`, borderTop: `2px solid ${t.color}`, borderRadius: 3, padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{t.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{t.type}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: t.count > 0 ? t.color : 'var(--text-dim)', lineHeight: 1, marginTop: '0.25rem' }}>{t.count}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 4 }}>dispatches recorded</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, padding: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Dispatch Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {typeEntries.map(t => (
                <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', minWidth: 90, color: 'var(--text-muted)' }}>{t.icon} {t.type}</div>
                  <MiniBar value={t.count} max={maxTypeCount} color={t.color} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: t.count > 0 ? t.color : 'var(--text-dim)', minWidth: 30, textAlign: 'right' }}>{t.count}</div>
                </div>
              ))}
            </div>
            {Object.keys(typeBreakdown).length === 0 && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                No dispatch data recorded yet. Incidents will appear here as they are dispatched.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
