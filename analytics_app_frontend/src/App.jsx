import React, { useState, useEffect } from 'react';

const REGION_DATA = [
  { name: 'Greater Accra', value: 45, color: 'var(--primary)' },
  { name: 'Ashanti',        value: 30, color: 'var(--police-blue)' },
  { name: 'Western',        value: 25, color: 'var(--secondary)' },
  { name: 'Eastern',        value: 18, color: 'var(--warning)' },
  { name: 'Northern',       value: 12, color: '#9c6bff' },
];

const TYPE_DATA = [
  { type: 'Medical', count: 42, color: '#00d4aa', icon: '🏥' },
  { type: 'Crime',   count: 27, color: '#1a6fff', icon: '🚔' },
  { type: 'Fire',    count: 15, color: '#ff4500', icon: '🔥' },
  { type: 'Traffic', count: 22, color: '#ffb800', icon: '🚗' },
];

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '1px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

const App = ({ token }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [vehicles, setVehicles] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [updatingHosp, setUpdatingHosp] = useState(false);
  const jwt = token || localStorage.getItem('jwt');

  const fetchData = () => {
    if (!jwt) return;
    fetch('https://analytics-service-hreo.onrender.com/analytics/response-times', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json()).then(d => { setMetrics(d); setLoading(false); }).catch(() => setLoading(false));
    
    fetch('https://dispatch-service-tjgl.onrender.com/vehicles/', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setVehicles(d); }).catch(console.error);

    fetch('https://analytics-service-hreo.onrender.com/analytics/hospitals', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setHospitals(d); }).catch(console.error);
  };

  useEffect(() => {
    if (!jwt) return;
    fetch('https://auth-service-spk6.onrender.com/auth/profile', { headers: { 'Authorization': `Bearer ${jwt}` } })
      .then(r => r.json()).then(d => setProfile(d)).catch(console.error);
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [jwt]);

  const role = profile?.role || profile?.user?.role;
  const managedStation = profile?.managed_station || profile?.user?.managed_station;
  const isGovt = role === 'GOVT_EXECUTIVE' || role === 'SYSTEM_ADMIN';
  const isPolice = role === 'POLICE_ADMIN';
  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';

  const fleetAvailable = vehicles.filter(v => v.is_available).length;
  const healthAvailable = vehicles.filter(v => v.is_available && v.service_type === 'Hospital').length;
  const fireAvailable = vehicles.filter(v => v.is_available && v.service_type === 'Fire').length;
  const policeAvailable = vehicles.filter(v => v.is_available && v.service_type === 'Police').length;

  const utilization = vehicles.length > 0 ? `${Math.round(((vehicles.length - fleetAvailable) / vehicles.length) * 100)}%` : '0%';
  const avgTime = metrics?.average_response_time || metrics?.avgTime || '4m 05s';
  const totalIncidents = metrics?.total_incidents || metrics?.count || 106;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'regions', label: 'By Region' },
    { id: 'types', label: 'By Type' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <div className="section-title">Analytics <span>Console</span></div>
          <div style={{ marginTop: 4 }}>
            {isGovt && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '2px', background: 'rgba(255,184,0,0.1)', color: 'var(--warning)', border: '1px solid rgba(255,184,0,0.3)' }}>EXECUTIVE VIEW</span>}
            {isPolice && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '2px', background: 'rgba(26,111,255,0.1)', color: 'var(--police-blue)', border: '1px solid rgba(26,111,255,0.3)' }}>STATION VIEW</span>}
          </div>
        </div>
        <span className="badge badge-live">Live Data</span>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Avg Response', value: loading ? '—' : avgTime, color: 'var(--primary)', sub: 'Target: <5m' },
          { label: 'Total Incidents', value: loading ? '—' : totalIncidents, color: 'var(--text-main)', sub: 'Last 30 days' },
          { label: 'Fleet Utilization', value: loading ? '—' : utilization, color: 'var(--secondary)', sub: 'Active units' },
          { label: 'Resolved Rate', value: loading ? '—' : '87%', color: 'var(--secondary)', sub: 'This month' },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card">
            <div className="stat-card-label">{kpi.label}</div>
            <div className="stat-card-value" style={{ color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: 'none', borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent', background: 'transparent', color: activeTab === t.id ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Station performance (police) */}
          {isPolice && (
            <div style={{ background: 'rgba(26,111,255,0.05)', border: '1px solid rgba(26,111,255,0.15)', borderRadius: '3px', padding: '1rem', gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--police-blue)', marginBottom: '0.75rem' }}>Your Station Performance</div>
              {[['Station Avg Response', '7m 42s', 'var(--police-blue)'], ['Officers Deployed Today', '14', 'var(--text-main)'], ['Incidents Handled', '8', 'var(--text-main)']].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Executive / General */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Fleet Availability</div>
            {[
              ['Hospital Units', `${healthAvailable} Ready`, 'var(--secondary)'],
              ['Police Units', `${policeAvailable} Ready`, 'var(--police-blue)'],
              ['Fire Units', `${fireAvailable} Ready`, '#ff4500']
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', padding: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Hospital Capacity</div>
            {hospitals.map(h => (
              <div key={h.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{h.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: (h.occupied_beds / h.total_beds) > 0.8 ? 'var(--warning)' : 'var(--secondary)' }}>
                  {h.occupied_beds} / {h.total_beds}
                </span>
              </div>
            ))}
            {hospitals.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>No hospital data available</div>}
          </div>
        </div>
      )}

      {/* Hospital Admin Control */}
      {activeTab === 'overview' && isHospitalAdmin && managedStation && (
        <div style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '3px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--secondary)', marginBottom: '1rem' }}>
             Station Control: {managedStation}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Update Bed Occupancy</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <input 
                      type="range" 
                      min="0" 
                      max={hospitals.find(h => h.name === managedStation)?.total_beds || 200} 
                      value={hospitals.find(h => h.name === managedStation)?.occupied_beds || 0}
                      onChange={async (e) => {
                         const val = parseInt(e.target.value);
                         try {
                            await fetch('https://analytics-service-hreo.onrender.com/analytics/hospitals/update', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                               body: JSON.stringify({ name: managedStation, occupied_beds: val })
                            });
                            fetchData();
                         } catch (err) { console.error(err); }
                      }}
                      style={{ flex: 1 }}
                   />
                   <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontWeight: 600 }}>
                      {hospitals.find(h => h.name === managedStation)?.occupied_beds || 0} Beds Occupied
                   </span>
                </div>
             </div>
             <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
             <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                Updates will reflect on the national metrics instantly.
             </div>
          </div>
        </div>
      )}

      {activeTab === 'regions' && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>Incident Distribution by Region</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {REGION_DATA.map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', minWidth: 130, color: 'var(--text-muted)' }}>{r.name}</div>
                <MiniBar value={r.value} max={50} color={r.color} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: r.color, minWidth: 36, textAlign: 'right' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'types' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {TYPE_DATA.map(t => (
            <div key={t.type} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.color}25`, borderTop: `2px solid ${t.color}`, borderRadius: '3px', padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{t.type}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: t.color, lineHeight: 1, marginTop: '0.25rem' }}>{t.count}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>incidents logged</div>
            </div>
          ))}
        </div>
      )}

      {!isGovt && activeTab === 'overview' && (
        <button className="btn" style={{ background: 'rgba(255,69,0,0.1)', color: 'var(--primary)', border: '1px solid rgba(255,69,0,0.25)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.65rem', borderRadius: '2px', cursor: 'pointer', width: '100%' }}>
          → View Full Report
        </button>
      )}
    </div>
  );
};

export default App;
