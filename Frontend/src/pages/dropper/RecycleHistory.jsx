import React, { useState, useEffect } from 'react';
import { 
  History, 
  Filter, 
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
  MapPin,
  ArrowRight
} from 'lucide-react';

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- INLINE COMPONENTS ---

// 1. Badge Component
const Badge = ({ children, variant, icon: Icon }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200", // Completed
    warning: "bg-amber-100 text-amber-700 border-amber-200",       // In Transit
    info: "bg-blue-100 text-blue-700 border-blue-200",             // Scheduled
    error: "bg-red-100 text-red-700 border-red-200",               // Cancelled
    default: "bg-gray-100 text-gray-700 border-gray-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", styles[variant] || styles.default)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

// 2. Modal Component
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

// --- DATA ---
const mockPickups = [
  {
    id: 'RC-2024-001',
    date: '2024-01-15',
    items: [
      { name: 'MacBook Pro 2019', category: 'Laptop', value: 450 },
      { name: 'iPhone 12', category: 'Smartphone', value: 280 },
    ],
    status: 'completed',
    driver: 'John D.',
    carbonOffset: 5.2,
    points: 350,
    address: '123 Green Street, Eco City',
  },
  {
    id: 'RC-2024-002',
    date: '2024-01-20',
    items: [
      { name: 'Dell Monitor 27"', category: 'Monitor', value: 80 },
    ],
    status: 'in-transit',
    driver: 'Sarah M.',
    carbonOffset: 2.1,
    points: 120,
    address: '456 Recycle Ave, Green Town',
  },
  {
    id: 'RC-2024-003',
    date: '2024-01-22',
    items: [
      { name: 'Samsung Galaxy S21', category: 'Smartphone', value: 200 },
      { name: 'iPad Air', category: 'Tablet', value: 180 },
    ],
    status: 'scheduled',
    carbonOffset: 3.8,
    points: 280,
    address: '789 Earth Blvd, Sustainable City',
  },
  {
    id: 'RC-2024-004',
    date: '2024-01-10',
    items: [
      { name: 'HP Laptop', category: 'Laptop', value: 150 },
    ],
    status: 'cancelled',
    carbonOffset: 0,
    points: 0,
    address: '321 Cancel Lane, Nowhere',
  },
  {
    id: 'RC-2024-005',
    date: '2024-01-08',
    items: [
      { name: 'LG TV 55"', category: 'Television', value: 200 },
      { name: 'PS4 Console', category: 'Gaming', value: 120 },
    ],
    status: 'completed',
    driver: 'Mike T.',
    carbonOffset: 8.5,
    points: 420,
    address: '555 Complete Road, Done City',
  },
];

const statusConfig = {
  scheduled: { icon: Calendar, color: 'info', label: 'Scheduled' },
  'in-transit': { icon: Truck, color: 'warning', label: 'In Transit' },
  completed: { icon: CheckCircle, color: 'success', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'error', label: 'Cancelled' },
};

// --- MAIN COMPONENT ---
export default function RecycleHistory() {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setPickups(mockPickups);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredPickups = pickups.filter(pickup => {
    const matchesStatus = statusFilter === 'all' || pickup.status === statusFilter;
    const matchesSearch = pickup.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickup.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = pickups.filter(p => p.status === status).length;
            const Icon = config.icon;
            
            // Dynamic styles based on status for the icon container
            const iconStyles = {
              success: "bg-emerald-100 text-emerald-600",
              warning: "bg-amber-100 text-amber-600",
              info: "bg-blue-100 text-blue-600",
              error: "bg-red-100 text-red-600"
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
                    iconStyles[config.color]
                  )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{config.label}</p>
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
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
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
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Carbon Offset</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Simple Loading State
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-4">
                        <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredPickups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                      <p className="text-gray-500">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredPickups.map((pickup) => {
                    const StatusIcon = statusConfig[pickup.status].icon;
                    return (
                      <tr
                        key={pickup.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm font-medium text-gray-900">{pickup.id}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(pickup.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{pickup.items.length} item(s)</span>
                            <span className="text-xs text-gray-500">
                              Est. Value: ${pickup.items.reduce((sum, item) => sum + item.value, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={statusConfig[pickup.status].color}
                            icon={StatusIcon}
                          >
                            {statusConfig[pickup.status].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-emerald-600 font-semibold text-sm bg-emerald-50 px-2 py-1 rounded">
                            {pickup.carbonOffset > 0 ? `${pickup.carbonOffset} kg` : '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-gray-900">
                            {pickup.points > 0 ? `+${pickup.points}` : '-'}
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
        title={`Request Details: ${selectedPickup?.id}`}
      >
        {selectedPickup && (
          <div className="space-y-8">
            {/* Status Timeline */}
            <div>
               <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Request Status</h4>
               <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-10"></div>
                
                {['scheduled', 'in-transit', 'completed'].map((step, index) => {
                    const stepIndex = ['scheduled', 'in-transit', 'completed'].indexOf(selectedPickup.status);
                    const isActive = index <= stepIndex;
                    const isCurrent = index === stepIndex;
                    
                    const StepIcon = statusConfig[step]?.icon || Clock;
                    
                    return (
                    <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div
                        className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                            isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-gray-300 text-gray-400'
                        )}
                        >
                        <StepIcon className="w-5 h-5" />
                        </div>
                        <span className={cn(
                            "text-xs font-medium capitalize",
                            isCurrent ? "text-emerald-700 font-bold" : "text-gray-500"
                        )}>
                            {step.replace('-', ' ')}
                        </span>
                    </div>
                    );
                })}
               </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <Calendar size={14} /> <span className="text-xs uppercase font-semibold">Date</span>
                </div>
                <p className="font-semibold text-gray-900">{new Date(selectedPickup.date).toLocaleDateString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                 <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <Truck size={14} /> <span className="text-xs uppercase font-semibold">Driver</span>
                </div>
                <p className="font-semibold text-gray-900">{selectedPickup.driver || 'Pending Assignment'}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                 <div className="flex items-center gap-2 mb-1 text-emerald-700">
                    <RefreshCw size={14} /> <span className="text-xs uppercase font-semibold">Carbon Offset</span>
                </div>
                <p className="font-bold text-emerald-700 text-lg">{selectedPickup.carbonOffset} kg CO2</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                 <div className="flex items-center gap-2 mb-1 text-gray-500">
                    <CheckCircle size={14} /> <span className="text-xs uppercase font-semibold">Points Earned</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">+{selectedPickup.points}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
               <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
               <div>
                  <h5 className="font-semibold text-sm">Pickup Address</h5>
                  <p className="text-sm opacity-80">{selectedPickup.address}</p>
               </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recycled Items</h4>
              <div className="space-y-2">
                {selectedPickup.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                            <Package size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                    </div>
                    <p className="font-medium text-emerald-600 text-sm">${item.value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}