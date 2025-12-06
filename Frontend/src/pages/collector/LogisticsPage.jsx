import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Navigation, CheckCircle, Package, MapPin } from 'lucide-react'; // <--- Added MapPin
import { useAuthStore } from '../../authStore'; 

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000"; 

// --- Fix Leaflet Default Icon Issue ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper: Green Icon for Completed Stops ---
const GreenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Helper: Blue Icon for Driver ---
const DriverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Helper Component to Recenter Map ---
function MapReCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LogisticsPage() {
  const { token } = useAuthStore();
  
  // State
  const [pickups, setPickups] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });

  // Get Auth Headers
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // 1. Get Driver Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Please enable location services to find the best route.");
          // Fallback to Pune center if blocked
          setDriverLocation({ lat: 18.5204, lng: 73.8567 });
        }
      );
    }
  }, []);

  // --- NEW FUNCTION: Fetch Locations Only (No Blue Line) ---
  const handleFetchLocations = async () => {
    if (!driverLocation) {
        alert("Waiting for driver location...");
        return;
    }
    setLoading(true);

    try {
      // Reuse the route endpoint because it contains the lat/lng logic
      const response = await axios.get(
        `${API_BASE_URL}/api/collector/optimize-route`,
        {
          params: { 
            latitude: driverLocation.lat, 
            longitude: driverLocation.lng 
          },
          ...getAuthHeaders()
        }
      );

      const data = response.data;
      
      if (!data.stops || data.stops.length === 0) {
        alert("No scheduled pickups found.");
        setLoading(false);
        return;
      }

      // Set Pickups (Markers)
      setPickups(data.stops);
      
      // CLEAR the blue line (so we only see locations)
      setRouteCoordinates([]); 
      setRouteStats({ distance: 0, duration: 0 });

    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to fetch locations.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Optimized Route (Markers + Blue Line)
  const handleOptimizeRoute = async () => {
    if (!driverLocation) return;
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collector/optimize-route`,
        {
          params: { 
            latitude: driverLocation.lat, 
            longitude: driverLocation.lng 
          },
          ...getAuthHeaders()
        }
      );

      const data = response.data;

      if (!data.stops || data.stops.length === 0) {
        alert("No scheduled pickups found. Waiting for new requests.");
        setLoading(false);
        return;
      }

      // A. Set Optimized Stops
      setPickups(data.stops);

      // B. Process Route Geometry (GeoJSON)
      if (data.route_geometry && data.route_geometry.coordinates) {
        const leafLetCoords = data.route_geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoordinates(leafLetCoords);
      }

      // C. Set Stats
      setRouteStats({
        distance: (data.total_distance / 1000).toFixed(1), // Meters -> KM
        duration: (data.total_duration / 60).toFixed(0)    // Seconds -> Minutes
      });

    } catch (error) {
      console.error("Optimization Error:", error);
      alert(error.response?.data?.detail || "Failed to calculate route.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Mark Pickup as Complete
  const handleCompletePickup = async (id) => {
    if(!window.confirm("Confirm collection of this e-waste?")) return;

    try {
      await axios.post(
        `${API_BASE_URL}/api/collector/pickup/${id}/complete`, 
        {}, 
        getAuthHeaders()
      );
      
      // Update local state to show green check
      setPickups(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'collected' } : p
      ));
      
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      
      {/* --- Sidebar Control Panel --- */}
      <div className="w-full lg:w-1/3 bg-white p-6 shadow-xl z-20 overflow-y-auto border-r border-gray-100">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600"/> Collector Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {driverLocation ? "Ready to optimize." : "Locating driver..."}
          </p>
        </div>

        {/* Stats Card */}
        {routeStats.distance > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-xs text-blue-600 font-bold uppercase">Total Distance</p>
              <p className="text-2xl font-bold text-blue-900">{routeStats.distance} km</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-xs text-green-600 font-bold uppercase">Est. Time</p>
              <p className="text-2xl font-bold text-green-900">{routeStats.duration} min</p>
            </div>
          </div>
        )}

        {/* --- BUTTONS SECTION --- */}
        <div className="flex flex-col gap-3 mb-8">
            {/* Button 1: Fetch Locations Only */}
            <button 
                onClick={handleFetchLocations}
                disabled={loading || !driverLocation}
                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <MapPin className="w-5 h-5" />}
                Fetch Pending Locations
            </button>

            {/* Button 2: Optimize Route */}
            <button 
                onClick={handleOptimizeRoute}
                disabled={loading || !driverLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Navigation className="w-5 h-5" />}
                Find Optimized Route
            </button>
        </div>

        {/* List of Stops */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 border-b pb-2">
            Stops Sequence ({pickups.length})
          </h3>
          
          {pickups.length === 0 ? (
            <p className="text-gray-400 text-center py-8 italic">No active pickups found.</p>
          ) : (
            pickups.map((pickup, index) => (
              <div key={pickup.id} className={`p-4 rounded-xl border transition-all ${pickup.status === 'collected' ? 'bg-green-50 border-green-200 opacity-75' : 'bg-white border-gray-100 hover:border-blue-300 shadow-sm'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${pickup.status === 'collected' ? 'bg-green-200 text-green-800' : 'bg-blue-100 text-blue-700'}`}>
                    {pickup.status === 'collected' ? <CheckCircle className="w-5 h-5"/> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm line-clamp-2">{pickup.address}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: #{pickup.id}</p>
                  </div>
                </div>
                
                {pickup.status !== 'collected' && (
                  <button 
                    onClick={() => handleCompletePickup(pickup.id)}
                    className="mt-3 w-full py-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                  >
                    Mark Collected
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- Map Area --- */}
      <div className="flex-1 relative z-10 bg-gray-100">
        {!driverLocation ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500"/>
            </div>
        ) : (
            <MapContainer 
              center={[driverLocation.lat, driverLocation.lng]} 
              zoom={13} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapReCenter center={[driverLocation.lat, driverLocation.lng]} />

              {/* Driver Marker */}
              <Marker position={[driverLocation.lat, driverLocation.lng]} icon={DriverIcon}>
                <Popup><strong>You are here</strong></Popup>
              </Marker>

              {/* Pickup Markers */}
              {pickups.map((pickup, idx) => (
                <Marker 
                    key={pickup.id} 
                    position={[pickup.lat, pickup.lng]}
                    icon={pickup.status === 'collected' ? GreenIcon : DefaultIcon}
                >
                  <Popup>
                    <div className="min-w-[150px]">
                        <strong className="block mb-1">Stop #{idx + 1}</strong>
                        <p className="text-sm text-gray-600 mb-2">{pickup.address}</p>
                        {pickup.image_url && (
                            <img src={pickup.image_url} alt="Item" className="w-full h-24 object-cover rounded-md mb-2"/>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${pickup.status === 'collected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pickup.status}
                        </span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Route Line */}
              {routeCoordinates.length > 0 && (
                <Polyline 
                  positions={routeCoordinates} 
                  color="#2563eb" // Blue-600
                  weight={5} 
                  opacity={0.8} 
                  dashArray="10, 10" // Optional: dashed line for visual effect
                />
              )}

            </MapContainer>
        )}
      </div>
    </div>
  );
}