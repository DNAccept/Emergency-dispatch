import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const App = ({ token }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Responder States
  const [responderLocation, setResponderLocation] = useState({ lat: 5.6030, lng: -0.1880 });
  const [activeIncident, setActiveIncident] = useState({ type: 'Medical', lat: 5.6120, lng: -0.1780 });
  
  const jwt = token || localStorage.getItem('jwt');

  useEffect(() => {
    if (jwt) {
      fetch('http://localhost:3001/auth/profile', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
    }
  }, [jwt]);

  useEffect(() => {
    const fetchVehicles = () => {
      fetch('http://localhost:3003/vehicles/available', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      .then(res => res.json())
      .then(data => {
        setVehicles(Array.isArray(data) ? data : (data.vehicles || []));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    };
    if (jwt) fetchVehicles();
    const interval = setInterval(fetchVehicles, 3000); 
    return () => clearInterval(interval);
  }, [jwt]);

  // GPS Transmitter mock
  useEffect(() => {
    if (!profile) return;
    const role = profile.role || profile.user?.role;
    if (role === 'RESPONDER') {
      const transmitter = setInterval(() => {
        // Move slowly towards the incident
        setResponderLocation(curr => ({
          lat: curr.lat + (activeIncident.lat - curr.lat) * 0.1,
          lng: curr.lng + (activeIncident.lng - curr.lng) * 0.1
        }));
      }, 4000);
      return () => clearInterval(transmitter);
    }
  }, [profile, activeIncident]);

  const role = profile?.role || profile?.user?.role;
  const isResponder = role === 'RESPONDER';
  const showDispatchMap = role === 'SYSTEM_ADMIN' || role === 'DISPATCHER';

  // Fallback to Dispatch Map if no specific role or unhandled
  const isDispatchView = showDispatchMap || !isResponder;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', color: 'white' }}>
      
      {isDispatchView && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>Dispatch & Tracker Map</h2>
            <div style={{ background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
              Active Units: <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{vehicles.length}</span>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '400px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 0 }}>
            <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {vehicles.map(v => {
                const lat = v.current_lat || v.latitude;
                const lng = v.current_long || v.longitude;
                if (!lat || !lng) return null;
                return (
                  <Marker key={v.vehicle_id || v._id || Math.random()} position={[lat, lng]}>
                    <Popup>
                      <strong>{v.unit_name || v.type || 'Unit'}</strong><br />
                      Service: {v.service_type || 'Responder'}<br />
                      Available: {v.is_available ? 'Yes' : 'No'}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin' }}>
            {loading ? <p>Tracking vehicles...</p> : vehicles.map(v => (
              <div key={v.vehicle_id || v._id || Math.random()} style={{ minWidth: '200px', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{v.unit_name || v.type || 'Unit ' + (v.vehicle_id || v._id).toString().substring(0,4)}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Type: {v.service_type}<br/>
                  Loc: [{parseFloat(v.current_lat || v.latitude).toFixed(4)}, {parseFloat(v.current_long || v.longitude).toFixed(4)}]
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isResponder && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Responder Navigation</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>NEW ASSIGNMENT</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>{activeIncident.type} Emergency</p>
              <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loc: {activeIncident.lat.toFixed(4)}, {activeIncident.lng.toFixed(4)}</p>
            </div>
            <button className="btn btn-primary" style={{ background: 'var(--secondary)' }}>Acknowledge</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <span>Live GPS Transmitter:</span>
            <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Active 🟢</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>Your Loc: {responderLocation.lat.toFixed(4)}, {responderLocation.lng.toFixed(4)}</p>

          <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', marginTop: '1rem', position: 'relative', zIndex: 0 }}>
            <MapContainer center={[activeIncident.lat, activeIncident.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[activeIncident.lat, activeIncident.lng]}>
                <Popup>Emergency Destination</Popup>
              </Marker>
              <Marker position={[responderLocation.lat, responderLocation.lng]}>
                <Popup>Your Location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
