import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, 
  Calendar, 
  Leaf, 
  TrendingUp, 
  History, 
  ArrowRight, 
  Loader2, 
  Award,
  Wallet
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000";

export default function DropperDashboard() {
  const { user, token } = useAuthStore();
  
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    carbon_balance: 0,
    co2_saved: 0,
    badge_level: 'Green Starter'
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // --- Helper: Robust Date Formatter ---
  const formatDate = (item) => {
    // Priority: Pickup Date -> Scheduled Time -> Created At -> Fallback
    const dateStr = item.pickup_date || item.scheduled_time || item.created_at;
    
    if (!dateStr) return "Date Pending";
    
    const date = new Date(dateStr);
    // If date is invalid (e.g. empty string or bad format)
    if (isNaN(date.getTime())) return "Date Pending";
    
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // --- Helper: Robust Value Calculator ---
  const calculateValue = (item) => {
    // 1. Try pre-calculated total from backend
    if (item.total_credits && !isNaN(Number(item.total_credits))) {
        return Number(item.total_credits);
    }

    // 2. Fallback: Sum up items manually
    if (item.items && Array.isArray(item.items)) {
        return item.items.reduce((acc, i) => {
            // Ensure credit_value is a number, default to 0 if null/undefined
            const val = Number(i.credit_value || i.estimated_value || 0);
            return acc + val;
        }, 0);
    }

    return 0;
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Wallet Stats
        const walletRes = await axios.get(`${API_BASE_URL}/api/wallet/me`, { headers });
        setStats(walletRes.data);

        // 2. Fetch Pickup History
        const historyRes = await axios.get(`${API_BASE_URL}/api/pickups/history`, { headers });
        console.log("History Data:", historyRes.data); // Debug log
        setRecentActivity(historyRes.data);

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  // Helper for Status Colors
  const getStatusColor = (status) => {
    const safeStatus = status ? status.toUpperCase() : 'UNKNOWN';
    switch (safeStatus) {
      case 'COLLECTED': return 'bg-green-100 text-green-700 border-green-200';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PROCESSED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen font-sans text-gray-900">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.full_name || 'Eco-Warrior'}!</h1>
          <p className="text-gray-500">Ready to make an impact today?</p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
                <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Balance</p>
                <span className="font-bold text-gray-900 text-lg">{stats.carbon_balance?.toLocaleString() || 0} Credits</span>
            </div>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Carbon Wallet Card */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl p-6 text-white shadow-xl shadow-green-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-green-100 font-medium text-sm mb-1">Carbon Wallet</p>
                    <h2 className="text-4xl font-extrabold">{stats.carbon_balance?.toLocaleString() || 0}</h2>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Leaf className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="flex items-center text-green-50 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Current Balance</span>
            </div>
          </div>
        </div>

        {/* CO2 Saved Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium text-sm">CO2 Offset</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-2">
                {stats.co2_saved?.toFixed(1) || 0} <span className="text-lg text-gray-400 font-normal">kg</span>
              </h2>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
             <Leaf className="w-4 h-4 text-green-500" /> Equivalent to planting {Math.floor((stats.co2_saved || 0) / 25)} trees.
          </p>
        </div>

        {/* Badge Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium text-sm">Current Status</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">{stats.badge_level}</h2>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
             <div className="bg-purple-500 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-right">Keep recycling to level up!</p>
        </div>
      </div>

      {/* --- Quick Actions --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/dropper/scan" className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Camera className="w-32 h-32 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Scan E-Waste</h3>
            <p className="text-gray-500 mt-2 max-w-sm">Use our AI camera to identify your items and get an instant price estimate.</p>
            <span className="inline-flex items-center mt-6 text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
              Start Scan <ArrowRight className="w-5 h-5 ml-2" />
            </span>
          </div>
        </Link>

        <Link to="/dropper/schedule" className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar className="w-32 h-32 text-green-600" />
          </div>
          <div className="relative z-10">
            <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Schedule Pickup</h3>
            <p className="text-gray-500 mt-2 max-w-sm">Book a convenient time slot for our collectors to pick up your e-waste from your doorstep.</p>
            <span className="inline-flex items-center mt-6 text-green-600 font-bold group-hover:translate-x-2 transition-transform">
              Book Now <ArrowRight className="w-5 h-5 ml-2" />
            </span>
          </div>
        </Link>
      </div>

      {/* --- Recent Activity List --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" /> Recent Activity
          </h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View Full History</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentActivity.length === 0 ? (
                <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No recent activity found. Start by scanning an item!
                    </td>
                </tr>
              ) : (
                recentActivity.map((item) => {
                    const totalValue = calculateValue(item);
                    
                    const itemNames = item.items && item.items.length > 0
                        ? item.items.map(i => i.item || i.item_name).join(", ") 
                        : `Mixed E-Waste (Batch #${item.id})`;

                    return (
                        <tr key={item.id} className="group hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                            <p className="font-bold text-gray-800 text-sm truncate max-w-xs">{itemNames}</p>
                            <p className="text-xs text-gray-500 mt-0.5">ID: #{item.id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(item)}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                            {item.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className="font-bold text-green-600">+{totalValue} pts</span>
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
}