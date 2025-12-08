import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Search, 
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Eye,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000"; 

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- INLINE COMPONENTS ---
const Badge = ({ children, variant, icon: Icon }) => {
  const styles = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200", 
    'in-transit': "bg-amber-100 text-amber-700 border-amber-200",      
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",            
    cancelled: "bg-red-100 text-red-700 border-red-200",              
    default: "bg-gray-100 text-gray-700 border-gray-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", styles[variant] || styles.default)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">{children}</div>
      </div>
    </div>
  );
};

const statusConfig = {
  SCHEDULED: { icon: Calendar, color: 'scheduled', label: 'Scheduled' },
  'IN-TRANSIT': { icon: Truck, color: 'in-transit', label: 'In Transit' },
  COLLECTED: { icon: CheckCircle, color: 'completed', label: 'Completed' },
  CANCELLED: { icon: XCircle, color: 'cancelled', label: 'Cancelled' },
  // Fallbacks for lowercase from legacy data
  scheduled: { icon: Calendar, color: 'scheduled', label: 'Scheduled' },
  'in-transit': { icon: Truck, color: 'in-transit', label: 'In Transit' },
  completed: { icon: CheckCircle, color: 'completed', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'cancelled', label: 'Cancelled' },
};

// --- MAIN COMPONENT ---
export default function RecycleHistory() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. FETCH API
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/pickups/history`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Ensure data is array to prevent crashes
        setPickups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch history", err);
        setPickups([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  // 2. FILTER LOGIC (FIXED)
  const filteredPickups = pickups.filter(pickup => {
    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;
    
    // FIX: Convert ID to string safely before toLowerCase()
    const pickupIdStr = String(pickup.id); 
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
        pickupIdStr.includes(query) ||
        (pickup.items && pickup.items.some(item => (item.item || item.item_name || '').toLowerCase().includes(query)));
        
    return matchesStatus && matchesSearch;
  });

  const viewDetails = (pickup) => {
    setSelectedPickup(pickup);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 pb-20">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <History className="text-emerald-600" /> Recycle History
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your past recycling requests and status</p>
        </div>
      </header>

      <div className="space-y-6">
        
        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['SCHEDULED', 'IN-TRANSIT', 'COLLECTED', 'CANCELLED'].map((status) => {
            const config = statusConfig[status];
            const count = pickups.filter(p => p.status === status).length;
            const Icon = config?.icon || Package;
            
            // Dynamic styles
            const iconStyles = {
              completed: "bg-emerald-100 text-emerald-600",
              'in-transit': "bg-amber-100 text-amber-600",
              scheduled: "bg-blue-100 text-blue-600",
              cancelled: "bg-red-100 text-red-600"
            };

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                className={cn(
                  'bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center gap-4 group',
                  statusFilter === status && 'ring-2 ring-emerald-500 border-emerald-500'
                )}
              >
                <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
                    iconStyles[config?.color] || "bg-gray-100 text-gray-600"
                  )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{config?.label || status}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Request ID or Item Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="relative min-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {['SCHEDULED', 'IN-TRANSIT', 'COLLECTED', 'CANCELLED'].map((status) => (
                <option key={status} value={status}>{statusConfig[status]?.label || status}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Simple Loading State
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-4">
                        <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredPickups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                      <p className="text-gray-500">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredPickups.map((pickup) => {
                    const StatusIcon = statusConfig[pickup.status]?.icon || Clock;
                    // Safely handle date
                    const dateDisplay = pickup.pickup_date 
                        ? new Date(pickup.pickup_date).toLocaleDateString() 
                        : (pickup.created_at ? new Date(pickup.created_at).toLocaleDateString() : 'Date Pending');

                    return (
                      <tr
                        key={pickup.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium text-gray-900">#{pickup.id}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {dateDisplay}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{pickup.items?.length || 0} item(s)</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={statusConfig[pickup.status]?.color || 'default'}
                            icon={StatusIcon}
                          >
                            {statusConfig[pickup.status]?.label || pickup.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-green-600">
                            +{pickup.total_credits || 0} pts
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => viewDetails(pickup)}
                            className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Request Details: #${selectedPickup?.id}`}
      >
        {selectedPickup && (
          <div className="space-y-8">
            
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <Calendar size={14} /> <span className="text-xs uppercase font-semibold">Scheduled Date</span>
                </div>
                <p className="font-semibold text-gray-900">
                    {selectedPickup.pickup_date ? new Date(selectedPickup.pickup_date).toLocaleDateString() : 'Date Pending'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                 <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <Clock size={14} /> <span className="text-xs uppercase font-semibold">Time Slot</span>
                </div>
                <p className="font-semibold text-gray-900">{selectedPickup.timeslot || 'Any Time'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                 <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <CheckCircle size={14} /> <span className="text-xs uppercase font-semibold">Points Earned</span>
                </div>
                <p className="font-bold text-green-600 text-lg">+{selectedPickup.total_credits}</p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recycled Items</h4>
              <div className="space-y-2">
                {selectedPickup.items && selectedPickup.items.length > 0 ? (
                    selectedPickup.items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                <Package size={16} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{item.item || item.item_name}</p>
                                <p className="text-xs text-gray-500 capitalize">{item.condition}</p>
                            </div>
                        </div>
                        <p className="font-medium text-emerald-600 text-sm">${item.estimated_value}</p>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic">Item details unavailable.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}