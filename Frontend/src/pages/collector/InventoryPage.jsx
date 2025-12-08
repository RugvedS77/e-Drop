
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Wrench, 
  Recycle, 
  Eye, 
  X,
  CheckCircle2,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000"; 

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- STATUS CONFIG ---
const statusConfig = {
  received: { 
    icon: Package, 
    color: 'bg-blue-900/30 text-blue-400 border-blue-800', 
    label: 'Received', 
    nextStatus: 'refurbishing' 
  },
  refurbishing: { 
    icon: Wrench, 
    color: 'bg-purple-900/30 text-purple-400 border-purple-800', 
    label: 'Refurbishing', 
    nextStatus: 'recycled' 
  },
  recycled: { 
    icon: Recycle, 
    color: 'bg-green-900/30 text-green-400 border-green-800', 
    label: 'Recycled',
    nextStatus: null 
  },
};

export default function InventoryPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FETCH FROM API
  const fetchInventory = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // FIX 1: Correct URL (Removed '/collector')
      const res = await axios.get(
        `${API_BASE_URL}/api/inventory/?status=${statusFilter}&search=${searchQuery}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // FIX 2: Map Backend Schema to Frontend State
      // Backend sends: name, value, condition, formatted_id
      // Frontend uses: item_name, credit_value, detected_condition, displayId
      const mappedData = Array.isArray(res.data) ? res.data.map(item => ({
        ...item,
        realId: item.id,
        displayId: item.formatted_id, // Use the ID from backend (e.g. INV-005)
        item_name: item.name,         // Map name -> item_name
        credit_value: item.value,     // Map value -> credit_value
        detected_condition: item.condition // Map condition -> detected_condition
      })) : [];

      setInventory(mappedData);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
      // Optional: Handle 401 specifically
      if (err.response?.status === 401) console.warn("Token expired");
      setInventory([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter, searchQuery]); // Re-fetch when filters change

  // 2. UPDATE STATUS API
  const updateStatus = async (itemDisplayId) => {
    // Find item using the display ID
    const item = inventory.find(i => i.displayId === itemDisplayId);
    if (!item) return;

    const currentConfig = statusConfig[item.status];

    if (currentConfig && currentConfig.nextStatus) {
      try {
        // FIX 3: Correct URL here as well
        await axios.put(
          `${API_BASE_URL}/api/inventory/${item.realId}/status`,
          { status: currentConfig.nextStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Refresh data to reflect changes
        fetchInventory();
        setShowDetailsModal(false);
        
      } catch (err) {
        console.error(err);
        alert("Failed to update status");
      }
    }
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  // Calculate live counts
  const counts = {
    all: inventory.length,
    received: inventory.filter(i => i.status === 'received').length,
    refurbishing: inventory.filter(i => i.status === 'refurbishing').length,
    recycled: inventory.filter(i => i.status === 'recycled').length,
  };

  // Filter Logic (Client side fallback for search visual feedback)
  const filteredInventory = inventory.filter(item => {
    // Note: The API already handles filtering, but this keeps the UI consistent if API returns all
    return true; 
  });

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100 font-sans">
      
      {/* --- Header --- */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             <Package className="w-6 h-6 text-blue-500" /> Warehouse Inventory
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track items from drop-off to recycling.</p>
        </div>
        <button 
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
        </button>
      </div>

      {/* --- Stats / Filter Tabs --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['all', 'received', 'refurbishing', 'recycled']).map((status) => {
            const config = status === 'all' ? { label: 'All Items', icon: Package } : statusConfig[status];
            const Icon = config.icon;
            const isActive = statusFilter === status;
            const count = counts[status] || 0;
            
            return (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                        'flex flex-col p-4 rounded-xl border text-left transition-all',
                        isActive
                        ? 'bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-900/10'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    )}
                >
                    <div className="flex justify-between items-start w-full mb-2">
                        <Icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-gray-500")} />
                        <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            isActive ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"
                        )}>
                            {count}
                        </span>
                    </div>
                    <span className={cn("font-semibold text-sm", isActive ? "text-white" : "text-gray-400")}>
                        {config.label}
                    </span>
                </button>
            );
        })}
      </div>

      {/* --- Search Bar --- */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
                type="text"
                placeholder="Search Item Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block pl-10 p-2.5 placeholder-gray-500 outline-none"
            />
        </div>
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors flex items-center gap-2">
            <Filter size={16} /> Filters
        </button>
      </div>

      {/* --- Inventory Table --- */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-semibold">ID</th>
                        <th className="px-6 py-4 font-semibold">Item Details</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Condition</th>
                        <th className="px-6 py-4 font-semibold">Value</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                <div className="flex justify-center items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    Loading inventory...
                                </div>
                            </td>
                        </tr>
                    ) : inventory.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                <Package className="w-12 h-12 mx-auto text-gray-600 mb-3 opacity-50" />
                                <p>No items found matching your filters.</p>
                            </td>
                        </tr>
                    ) : (
                        inventory.map((item) => {
                            const config = statusConfig[item.status] || statusConfig.received;
                            const StatusIcon = config.icon;
                            
                            return (
                                <tr key={item.realId} className="hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-blue-400 font-medium">{item.displayId}</td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-white">{item.item_name}</p>
                                            <p className="text-xs text-gray-500">Category: {item.category}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {config.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 capitalize">
                                        {item.detected_condition?.toLowerCase() || "unknown"}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-green-400">
                                        ${item.credit_value}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => viewDetails(item)}
                                            className="p-2 bg-gray-700 hover:bg-blue-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                                        >
                                            <Eye size={16} />
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

      {/* --- Details Modal --- */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Item Details <span className="text-gray-500 font-mono text-sm">#{selectedItem.displayId}</span>
                    </h3>
                    <button onClick={() => setShowDetailsModal(false)} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-8">
                    {/* Lifecycle Progress Bar */}
                    <div className="flex items-center gap-2">
                        {(['received', 'refurbishing', 'recycled']).map((step, index, arr) => {
                            const currentStatusIdx = ['received', 'refurbishing', 'recycled'].indexOf(selectedItem.status);
                            const thisStepIdx = arr.indexOf(step);
                            const isCompleted = thisStepIdx <= currentStatusIdx;
                            const Icon = statusConfig[step].icon;

                            return (
                                <React.Fragment key={step}>
                                    <div className="flex flex-col items-center gap-2 relative z-10">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                            isCompleted ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-800 border-gray-600 text-gray-500"
                                        )}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={cn("text-xs font-medium", isCompleted ? "text-blue-400" : "text-gray-500")}>
                                            {statusConfig[step].label}
                                        </span>
                                    </div>
                                    {index < arr.length - 1 && (
                                        <div className={cn("flex-1 h-1 rounded -mt-6 mx-2 transition-all", isCompleted && thisStepIdx < currentStatusIdx ? "bg-blue-600" : "bg-gray-700")} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Item Name</p>
                            <p className="text-lg font-bold text-white">{selectedItem.item_name}</p>
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Condition</p>
                            <p className="text-lg font-bold text-white capitalize">{selectedItem.detected_condition}</p>
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Value</p>
                            <p className="text-lg font-bold text-green-400">${selectedItem.credit_value}</p>
                        </div>
                        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Customer</p>
                            <p className="text-lg font-bold text-blue-400">{selectedItem.customer || "Unknown"}</p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-gray-700">
                        {statusConfig[selectedItem.status]?.nextStatus ? (
                            <button
                                onClick={() => updateStatus(selectedItem.displayId)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30"
                            >
                                Move to {statusConfig[statusConfig[selectedItem.status].nextStatus].label} <ArrowRight size={18} />
                            </button>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-900/30 text-green-400 border border-green-800 rounded-xl font-bold">
                                <CheckCircle2 size={20} />
                                Lifecycle Complete
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}