import React from 'react';
import { Truck, Package, Activity, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- Mock Data ---
const incomingInventory = [
  { id: 101, batch: 'PICK-999', type: 'Mixed E-Waste', weight: '15kg', driver: 'Raju S.', status: 'In Transit' },
  { id: 102, batch: 'PICK-998', type: 'Laptops (5)', weight: '8kg', driver: 'Amit K.', status: 'Arrived' },
  { id: 103, batch: 'PICK-997', type: 'Batteries', weight: '20kg', driver: 'Raju S.', status: 'Processing' },
];

const CollectorDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100">
      
      {/* --- Header --- */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-gray-400">Welcome back, {user?.full_name || 'Partner'}</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Export Reports
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Assign Drivers
            </button>
        </div>
      </div>

      {/* --- High Level Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Daily Intake</p>
              <h3 className="text-2xl font-bold text-white mt-1">1,240 <span className="text-sm text-gray-500">kg</span></h3>
            </div>
            <Package className="text-blue-500 w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Active Trucks</p>
              <h3 className="text-2xl font-bold text-white mt-1">8 <span className="text-sm text-gray-500">/ 10</span></h3>
            </div>
            <Truck className="text-green-500 w-5 h-5" />
          </div>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Pending Process</p>
              <h3 className="text-2xl font-bold text-white mt-1">45 <span className="text-sm text-gray-500">items</span></h3>
            </div>
            <Activity className="text-orange-500 w-5 h-5" />
          </div>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Certificates Issued</p>
              <h3 className="text-2xl font-bold text-white mt-1">12</h3>
            </div>
            <CheckCircle className="text-purple-500 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Live Inventory Stream */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Live Inventory Feed
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
                  <th className="pb-3">Batch ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Weight</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {incomingInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 text-gray-300 font-mono">{item.batch}</td>
                    <td className="py-4 text-white font-medium">{item.type}</td>
                    <td className="py-4 text-gray-400">{item.weight}</td>
                    <td className="py-4 text-gray-400">{item.driver}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${item.status === 'Arrived' ? 'bg-green-900 text-green-300' : 
                          item.status === 'In Transit' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4">
                        <button className="text-blue-400 hover:text-blue-300 text-xs font-semibold">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Map / Logistics Preview */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" /> Active Routes
            </h3>
            <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
            </span>
          </div>
          
          {/* Mock Map Placeholder */}
          <div className="grow bg-gray-700 relative min-h-[300px] flex items-center justify-center">
            {/* You would integrate Google Maps / Mapbox here */}
            <div className="text-center opacity-50">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-300 text-sm">Map Visualization Loaded</p>
                <p className="text-xs text-gray-500">Showing 3 active clusters</p>
            </div>
            
            {/* Mock overlay pins */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          
          <div className="p-4 bg-gray-800 border-t border-gray-700">
             <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-medium transition-colors">
                Open Full Logistics Map
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollectorDashboard;