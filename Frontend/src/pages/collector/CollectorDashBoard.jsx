import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Truck, 
    Package, 
    Activity, 
    MapPin, 
    CheckCircle, 
    Clock, 
    Loader2, 
    Calendar,
    ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000";

export default function CollectorDashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State for Data
  const [scheduledPickups, setScheduledPickups] = useState([]);
  const [stats, setStats] = useState({
    totalCredits: 0,
    activeTrucks: 8, // Mock
    pendingItems: 0,
    completedToday: 12 // Mock
  });

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Pending Pickups (Scheduled)
        const response = await axios.get(`${API_BASE_URL}/api/collector/pending`, { headers });
        const data = response.data;

        setScheduledPickups(data);

        // 2. Calculate Stats dynamically
        const pendingCount = data.length;
        const totalCredits = data.reduce((acc, curr) => acc + (curr.total_credits || 0), 0);

        setStats(prev => ({
          ...prev,
          pendingItems: pendingCount,
          totalCredits: totalCredits
        }));

      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100 font-sans">
      
      {/* --- Header --- */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-gray-400">Welcome back, {user?.full_name || 'Partner'}</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => navigate('/collector/logistics')}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
                <MapPin size={16} /> View Logistics Map
            </button>
        </div>
      </div>

      {/* --- High Level Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Pending Requests */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Pending Pickups</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.pendingItems} <span className="text-sm text-gray-500">requests</span></h3>
            </div>
            <div className="p-2 bg-blue-900/30 rounded-lg">
                <Activity className="text-blue-400 w-5 h-5" />
            </div>
          </div>
        </div>
        
        {/* Card 2: Total Value */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Value</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">{stats.totalCredits} <span className="text-sm text-gray-500">pts</span></h3>
            </div>
            <div className="p-2 bg-green-900/30 rounded-lg">
                <Package className="text-green-400 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Active Trucks (Mock) */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Active Trucks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.activeTrucks} <span className="text-sm text-gray-500">/ 10</span></h3>
            </div>
            <div className="p-2 bg-orange-900/30 rounded-lg">
                <Truck className="text-orange-400 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Completed (Mock) */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Processed Today</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.completedToday}</h3>
            </div>
            <div className="p-2 bg-purple-900/30 rounded-lg">
                <CheckCircle className="text-purple-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content: Scheduled Pickups Table --- */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Scheduled Pickups
            </h3>
            <span className="text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                {scheduledPickups.length} Pending
            </span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-semibold">ID</th>
                        <th className="px-6 py-4 font-semibold">Location</th>
                        <th className="px-6 py-4 font-semibold">Items</th>
                        <th className="px-6 py-4 font-semibold">Scheduled Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Value</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                    {scheduledPickups.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto text-gray-600 mb-3 opacity-50" />
                                <p>All caught up! No pending pickups.</p>
                            </td>
                        </tr>
                    ) : (
                        scheduledPickups.map((pickup) => {
                            // Logic to display items string
                            const itemSummary = pickup.items && pickup.items.length > 0 
                                ? pickup.items.map(i => i.item || i.item_name).join(", ")
                                : `${pickup.items?.length || 0} Items`;

                            // Safe Date Logic
                            const dateDisplay = pickup.pickup_date 
                                ? new Date(pickup.pickup_date).toLocaleDateString()
                                : "Date Pending";

                            return (
                                <tr key={pickup.id} className="hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-blue-400 font-medium">#{pickup.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <MapPin size={14} className="text-gray-500" />
                                            {/* Fix: Check for address_text from backend response */}
                                            <span className="truncate max-w-[150px]" title={pickup.address_text}>
                                                {pickup.address_text || "No Address"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-gray-500" />
                                            <p className="text-white font-medium truncate max-w-xs" title={itemSummary}>
                                                {itemSummary}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-500"/>
                                            {dateDisplay}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-green-400">
                                        {pickup.total_credits} pts
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => navigate('/collector/logistics')}
                                            className="p-2 bg-gray-700 hover:bg-blue-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="View on Map"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};