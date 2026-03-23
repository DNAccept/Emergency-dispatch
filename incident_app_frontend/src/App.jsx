import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const defaultCenter = [5.6037, -0.1870]; // Accra

// Component to handle map clicks for new incidents
function MapClickHandler({ setDraftLocation }) {
  useMapEvents({
    click(e) {
      setDraftLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const App = ({ token }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Incident draft state
  const [showForm, setShowForm] = useState(false);
  const [draftLocation, setDraftLocation] = useState(null);
  const [draftType, setDraftType] = useState('Medical');
  
  const jwt = token || localStorage.getItem('jwt');

  const fetchIncidents = () => {
    fetch('http://localhost:3002/incidents/open', {
      headers: { 'Authorization': `Bearer ${jwt}` }
    })
    .then(res => res.json())
    .then(data => {
      setIncidents(Array.isArray(data) ? data : (data.incidents || []));
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (jwt) fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [jwt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draftLocation) {
      alert('Please click on the map to set an incident location.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3002/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          type: draftType,
          latitude: draftLocation.lat,
          longitude: draftLocation.lng
        })
      });
      if (res.ok) {
        setShowForm(false);
        setDraftLocation(null);
        fetchIncidents();
      } else {
        alert('Failed to report incident');
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Incident Management Dashboard</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ background: showForm ? 'var(--danger)' : 'var(--warning)', color: showForm ? 'white' : 'black', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showForm ? 'Cancel Report' : '+ Report Emergency'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>New Incident Report</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Click anywhere on the map to set the emergency location.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Incident Type</label>
              <select value={draftType} onChange={e => setDraftType(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--surface-border)', borderRadius: '4px', marginTop: '0.5rem' }}>
                <option value="Medical" style={{ color: 'black' }}>Medical</option>
                <option value="Fire" style={{ color: 'black' }}>Fire</option>
                <option value="Crime" style={{ color: 'black' }}>Crime</option>
                <option value="Traffic" style={{ color: 'black' }}>Traffic</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label>Location Coordinates</label>
              <input type="text" readOnly value={draftLocation ? `${draftLocation.lat.toFixed(4)}, ${draftLocation.lng.toFixed(4)}` : 'Awaiting Map Click...'} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--warning)', border: '1px solid var(--surface-border)', borderRadius: '4px', marginTop: '0.5rem' }} />
            </div>
            <button type="submit" style={{ padding: '0.75rem 2rem', height: '46px', borderRadius: '8px', border: 'none', background: 'var(--secondary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Submit Report</button>
          </form>
        </div>
      )}

      {/* Map Container */}
      <div style={{ flex: 1, minHeight: '500px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 0 }}>
        <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showForm && <MapClickHandler setDraftLocation={setDraftLocation} />}
          
          {incidents.map(inc => (
            <Marker key={inc.incident_id || inc.id || Math.random()} position={[inc.latitude, inc.longitude]}>
              <Popup>
                <strong>{inc.type} Incident</strong><br />
                Status: <span style={{ color: '#d97706', fontWeight: 'bold' }}>{inc.status || 'OPEN'}</span><br />
                Reported at: {new Date(inc.reported_at || Date.now()).toLocaleTimeString()}<br />
                {inc.assigned_unit_id && <span>Unit Assigned: {inc.assigned_unit_id}</span>}
              </Popup>
            </Marker>
          ))}

          {draftLocation && showForm && (
            <Marker position={[draftLocation.lat, draftLocation.lng]}>
              <Popup>Draft Incident Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
