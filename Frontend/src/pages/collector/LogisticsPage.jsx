import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    Loader2, 
    Navigation, 
    CheckCircle, 
    Package, 
    MapPin, 
    Trash2, 
    XCircle 
} from 'lucide-react';
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

// --- CUSTOM ICONS ---

const GreenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const StartIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- HELPER: Auto-Zoom to Fit Route ---
// This mimics Google Maps "Overview" mode
function MapBounds({ routeCoords, driverLoc }) {
  const map = useMap();

  useEffect(() => {
    // 1. If we have a route, fit the map to show the whole path
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] }); // Add padding so pins aren't on the edge
    } 
    // 2. If no route but we have driver location, fly to driver
    else if (driverLoc) {
      map.flyTo([driverLoc.lat, driverLoc.lng], 14);
    }
  }, [routeCoords, driverLoc, map]);

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
  
  // Track removed IDs locally so we can exclude them from future API calls
  const [removedIds, setRemovedIds] = useState([]); 

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
          alert("Please enable location services.");
          setDriverLocation({ lat: 18.5204, lng: 73.8567 }); // Fallback (Pune)
        }
      );
    }
  }, []);

  // --- HELPER: Axios Params Serializer ---
  const customParamsSerializer = (params) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            value.forEach(val => searchParams.append(key, val));
        } else {
            searchParams.append(key, value);
        }
    }
    return searchParams.toString();
  };

  // --- ACTION: Remove a Stop ---
  const handleRemoveStop = (id) => {
    if (!window.confirm("Remove this stop from route?")) return;

    setRemovedIds(prev => [...prev, id]);
    setPickups(prev => prev.filter(p => p.id !== id));
    setRouteCoordinates([]); // Clear line to force re-optimization
    setRouteStats({ distance: 0, duration: 0 });
  };

  // --- ACTION: Fetch Locations Only ---
  const handleFetchLocations = async () => {
    if (!driverLocation) { alert("Waiting for driver location..."); return; }
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collector/optimize-route`,
        {
          params: { 
            latitude: driverLocation.lat, 
            longitude: driverLocation.lng,
            exclude_ids: removedIds 
          },
          paramsSerializer: customParamsSerializer,
          ...getAuthHeaders()
        }
      );

      const data = response.data;
      if (!data.stops || data.stops.length === 0) {
        alert("No scheduled pickups found.");
        setPickups([]);
        setLoading(false);
        return;
      }

      setPickups(data.stops);
      setRouteCoordinates([]); 
      setRouteStats({ distance: 0, duration: 0 });

    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to fetch locations.");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: Optimize Route ---
  const handleOptimizeRoute = async () => {
    if (!driverLocation) return;
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/collector/optimize-route`,
        {
          params: { 
            latitude: driverLocation.lat, 
            longitude: driverLocation.lng,
            exclude_ids: removedIds 
          },
          paramsSerializer: customParamsSerializer,
          ...getAuthHeaders()
        }
      );

      const data = response.data;

      if (!data.stops || data.stops.length === 0) {
        alert("No scheduled pickups found.");
        setPickups([]);
        setLoading(false);
        return;
      }

      setPickups(data.stops); // These come SORTED from backend

      if (data.route_geometry && data.route_geometry.coordinates) {
        // Convert [lng, lat] to [lat, lng] for Leaflet
        const leafLetCoords = data.route_geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoordinates(leafLetCoords);
      }

      setRouteStats({
        distance: (data.total_distance / 1000).toFixed(1),
        duration: (data.total_duration / 60).toFixed(0)
      });

    } catch (error) {
      console.error("Optimization Error:", error);
      alert("Failed to calculate route.");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: Complete Pickup ---
  const handleCompletePickup = async (id) => {
    if(!window.confirm("Confirm collection?")) return;

    try {
      await axios.post(`${API_BASE_URL}/api/collector/pickup/${id}/complete`, {}, getAuthHeaders());
      setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'collected' } : p));
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      
      {/* --- Sidebar --- */}
      <div className="w-full lg:w-1/3 bg-white p-6 shadow-xl z-20 overflow-y-auto border-r border-gray-100 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600"/> Collector Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {driverLocation ? "Ready to optimize." : "Locating driver..."}
          </p>
        </div>

        {/* Stats */}
        {routeStats.distance > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6 animate-in fade-in">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-600 font-bold uppercase">Distance</p>
              <p className="text-2xl font-bold text-blue-900">{routeStats.distance} km</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-bold uppercase">Est. Time</p>
              <p className="text-2xl font-bold text-green-900">{routeStats.duration} min</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-8">
            <button 
                onClick={handleFetchLocations}
                disabled={loading || !driverLocation}
                className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <MapPin className="w-5 h-5" />}
                Fetch Pending Locations
            </button>

            <button 
                onClick={handleOptimizeRoute}
                disabled={loading || !driverLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Navigation className="w-5 h-5" />}
                Find Optimized Route
            </button>
        </div>

        {/* Stop List */}
        <div className="space-y-4 flex-1">
          <h3 className="font-bold text-gray-900 border-b pb-2 flex justify-between items-center">
            <span>Route Sequence ({pickups.length})</span>
            {routeCoordinates.length === 0 && pickups.length > 0 && (
                <span className="text-xs text-orange-500 font-normal bg-orange-50 px-2 py-1 rounded">Route not optimized</span>
            )}
          </h3>
          
          {pickups.length === 0 ? (
            <p className="text-gray-400 text-center py-8 italic">No active pickups.</p>
          ) : (
            pickups.map((pickup, index) => (
              <div key={pickup.id} className={`p-4 rounded-xl border relative group transition-all ${pickup.status === 'collected' ? 'bg-green-50 border-green-200 opacity-75' : 'bg-white border-gray-100 hover:border-blue-300 shadow-sm'}`}>
                
                {/* Remove Button */}
                {pickup.status !== 'collected' && (
                    <button 
                        onClick={() => handleRemoveStop(pickup.id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Stop"
                    >
                        <XCircle size={18} />
                    </button>
                )}

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${pickup.status === 'collected' ? 'bg-green-200 text-green-800' : 'bg-blue-600 text-white shadow-md shadow-blue-200'}`}>
                    {pickup.status === 'collected' ? <CheckCircle className="w-5 h-5"/> : index + 1}
                  </div>
                  <div className="flex-1 pr-6">
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
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Handles Auto-Zooming to Route */}
              <MapBounds routeCoords={routeCoordinates} driverLoc={driverLocation} />

              {/* 1. Driver Marker (RED) */}
              <Marker position={[driverLocation.lat, driverLocation.lng]} icon={StartIcon} zIndexOffset={1000}>
                <Popup>
                    <div className="text-center">
                        <strong className="text-red-600 font-bold uppercase">Start Point</strong><br/>
                        Your Location
                    </div>
                </Popup>
              </Marker>

              {/* 2. Route Line (Blue) */}
              {routeCoordinates.length > 0 && (
                <Polyline 
                  positions={routeCoordinates} 
                  color="#2563eb" // Solid Blue like Google Maps
                  weight={6} 
                  opacity={0.8} 
                  lineCap="round"
                  lineJoin="round"
                />
              )}

              {/* 3. Pickup Markers */}
              {pickups.map((pickup, idx) => (
                <Marker 
                    key={pickup.id} 
                    position={[pickup.lat, pickup.lng]}
                    icon={pickup.status === 'collected' ? GreenIcon : DefaultIcon}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                        <strong className="block mb-1 text-blue-700">Stop #{idx + 1}</strong>
                        <p className="text-sm text-gray-600 mb-2">{pickup.address}</p>
                        
                        {pickup.image_url && (
                            <img src={pickup.image_url} alt="Item" className="w-full h-24 object-cover rounded-md mb-2"/>
                        )}
                        
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                            {pickup.status !== 'collected' ? (
                                <>
                                    <button 
                                        onClick={() => handleCompletePickup(pickup.id)}
                                        className="flex-1 bg-green-100 text-green-700 text-xs font-bold py-1 px-2 rounded hover:bg-green-200"
                                    >
                                        Collect
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveStop(pickup.id)}
                                        className="bg-red-50 text-red-600 text-xs font-bold py-1 px-2 rounded hover:bg-red-100 flex items-center"
                                        title="Remove Stop"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs text-green-600 font-bold w-full text-center">Collected</span>
                            )}
                        </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            </MapContainer>
        )}
      </div>
    </div>
  );
}