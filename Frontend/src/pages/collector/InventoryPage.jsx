import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  Wrench, 
  Recycle, 
  Eye, 
  X
} from 'lucide-react';

// Utility helper to replace the 'cn' library
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Mock Data
const mockInventory = [
  { id: 'IT-001', name: 'MacBook Pro 2019', category: 'Laptop', status: 'refurbishing', receivedDate: '2024-01-15', customer: 'Alex Green', value: 450, condition: 'Good' },
  { id: 'IT-002', name: 'iPhone 12 Pro', category: 'Smartphone', status: 'received', receivedDate: '2024-01-16', customer: 'Sarah Blue', value: 320, condition: 'Excellent' },
  { id: 'IT-003', name: 'Dell Monitor 27"', category: 'Monitor', status: 'recycled', receivedDate: '2024-01-10', customer: 'John Red', value: 80, condition: 'Fair' },
  { id: 'IT-004', name: 'Samsung Galaxy S21', category: 'Smartphone', status: 'pending', receivedDate: '2024-01-17', customer: 'Mike Yellow', value: 200, condition: 'Good' },
  { id: 'IT-005', name: 'HP Laptop', category: 'Laptop', status: 'refurbishing', receivedDate: '2024-01-14', customer: 'Lisa Purple', value: 150, condition: 'Fair' },
  { id: 'IT-006', name: 'iPad Air', category: 'Tablet', status: 'received', receivedDate: '2024-01-16', customer: 'Tom Orange', value: 280, condition: 'Good' },
  { id: 'IT-007', name: 'Sony PlayStation 5', category: 'Gaming', status: 'recycled', receivedDate: '2024-01-08', customer: 'Anna Pink', value: 350, condition: 'Excellent' },
  { id: 'IT-008', name: 'LG Smart TV 55"', category: 'Television', status: 'pending', receivedDate: '2024-01-17', customer: 'Chris Black', value: 200, condition: 'Good' },
];

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending', nextStatus: 'received' },
  received: { icon: Package, color: 'bg-blue-100 text-blue-700', label: 'Received', nextStatus: 'refurbishing' },
  refurbishing: { icon: Wrench, color: 'bg-indigo-100 text-indigo-700', label: 'Refurbishing', nextStatus: 'recycled' },
  recycled: { icon: Recycle, color: 'bg-green-100 text-green-700', label: 'Recycled' },
};

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setInventory(mockInventory);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateStatus = (itemId) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentConfig = statusConfig[item.status];
        if (currentConfig.nextStatus) {
          // Replaced useToast with alert for simplicity
          alert(`Status Updated: ${item.name} moved to ${statusConfig[currentConfig.nextStatus].label}`);
          return { ...item, status: currentConfig.nextStatus };
        }
      }
      return item;
    }));
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const getStatusCounts = () => {
    return {
      all: inventory.length,
      pending: inventory.filter(i => i.status === 'pending').length,
      received: inventory.filter(i => i.status === 'received').length,
      refurbishing: inventory.filter(i => i.status === 'refurbishing').length,
      recycled: inventory.filter(i => i.status === 'recycled').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbar Replacement */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Live Inventory
        </h1>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'received', 'refurbishing', 'recycled']).map((status) => {
            const config = status === 'all' ? null : statusConfig[status];
            const Icon = config?.icon || Package;
            const isActive = statusFilter === status;
            
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all border',
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium capitalize">{status}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                )}>
                  {counts[status]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1000);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Item</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Category</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Customer</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Value</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Inline Skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td colSpan={7} className="p-4">
                        <div className="h-8 bg-gray-100 rounded animate-pulse w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No items found</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item, index) => {
                    const config = statusConfig[item.status];
                    const StatusIcon = config.icon;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4 font-mono text-sm text-gray-600">{item.id}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.condition}</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{item.category}</td>
                        <td className="p-4 text-gray-900">{item.customer}</td>
                        <td className="p-4">
                          <div className="relative group w-fit">
                            <span className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium",
                              config.color
                            )}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {config.label}
                            </span>
                            
                            {config.nextStatus && (
                              <button
                                onClick={() => updateStatus(item.id)}
                                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-indigo-600 text-white text-xs whitespace-nowrap shadow-md z-10"
                              >
                                → {statusConfig[config.nextStatus].label}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-gray-900">${item.value}</td>
                        <td className="p-4">
                          <button
                            onClick={() => viewDetails(item)}
                            className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Inline Modal Implementation */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">Item {selectedItem.id}</h3>
                <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1 rounded-md hover:bg-gray-200 text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Status Flow */}
              <div className="flex items-center gap-4">
                {(['pending', 'received', 'refurbishing', 'recycled']).map((step, index) => {
                  const stepIndex = ['pending', 'received', 'refurbishing', 'recycled'].indexOf(selectedItem.status);
                  const currentIndex = ['pending', 'received', 'refurbishing', 'recycled'].indexOf(step);
                  const isActive = currentIndex <= stepIndex;
                  const Icon = statusConfig[step].icon;
                  return (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                          isActive 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-white border-gray-200 text-gray-400'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < 3 && (
                        <div className={cn(
                          'flex-1 h-1 rounded',
                          isActive && currentIndex < stepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Item Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Item Name</p>
                  <p className="font-semibold text-gray-900">{selectedItem.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-gray-900">{selectedItem.category}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Condition</p>
                  <p className="font-semibold text-gray-900">{selectedItem.condition}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Value</p>
                  <p className="font-semibold text-indigo-600">${selectedItem.value}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedItem.customer}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Received Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedItem.receivedDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Modal Actions */}
              {statusConfig[selectedItem.status].nextStatus && (
                <button
                  onClick={() => {
                    updateStatus(selectedItem.id);
                    setShowDetailsModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Move to {statusConfig[statusConfig[selectedItem.status].nextStatus].label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}