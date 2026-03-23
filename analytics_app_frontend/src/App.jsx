import React, { useState, useEffect } from 'react';

const App = ({ token }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const jwt = token || localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      // Fetch Profile for Role Based Analytics
      fetch('http://localhost:3001/auth/profile', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));

      // Fetch Analytics
      fetch('http://localhost:3004/analytics/response-times', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [jwt]);

  const role = profile?.role || profile?.user?.role;
  const isGovt = role === 'GOVT_EXECUTIVE';
  const isPoliceAdmin = role === 'POLICE_ADMIN';
  const isSystemAdmin = role === 'SYSTEM_ADMIN';

  // If no role logic, default to basic stats
  const showExecutive = isGovt || isSystemAdmin;
  const showStation = isPoliceAdmin;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Analytics Module</h2>
        {showExecutive && <span style={{ background: '#7c3aed', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Executive View</span>}
        {showStation && <span style={{ background: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Station View</span>}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>{showStation ? 'Station Performance' : 'National System Performance'}</h3>
        
        {loading ? <p>Loading metrics...</p> : (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {showStation && (
              <>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Your Station Avg Response:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem' }}>7m 42s</span>
                </div>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Officers Deployed Today:</span>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem' }}>14</span>
                </div>
              </>
            )}

            {(showExecutive || !showStation) && (
              <>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Avg target response time:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {metrics?.average_response_time || metrics?.avgTime || '245s'}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Total incidents today:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {metrics?.total_incidents || metrics?.count || '12'}
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Fleet Utilization:</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {metrics?.utilization || '64%'}
                  </span>
                </div>
              </>
            )}

            {showExecutive && (
              <div style={{ background: '#4c1d9520', border: '1px solid #7c3aed50', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#a78bfa' }}>Regional Aggregation</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>North District:</span> <span style={{fontWeight: 'bold'}}>High (45%)</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>South District:</span> <span style={{fontWeight: 'bold'}}>Medium (30%)</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}><span>East District:</span> <span style={{fontWeight: 'bold'}}>Low (25%)</span></div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!showExecutive && (
        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', background: showStation ? '#3b82f6' : 'var(--primary)' }}>View Full Station Report</button>
      )}
    </div>
  );
};
export default App;
