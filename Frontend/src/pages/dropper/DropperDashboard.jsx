import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Leaf, TrendingUp, History, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- Mock Data (Replace with API data later) ---
const recentActivity = [
  { id: 1, item: 'Dell Laptop', date: '2025-10-12', credits: '+500', status: 'Processed' },
  { id: 2, item: 'Old Cables', date: '2025-10-10', credits: '+50', status: 'Collected' },
  { id: 3, item: 'Smartphone', date: '2025-09-28', credits: '+200', status: 'Scheduled' },
];

const DropperDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      
      {/* --- Header Section --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hello, {user?.full_name || 'Eco-Warrior'}!</h1>
          <p className="text-gray-500">Ready to recycle today?</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="bg-green-100 p-1.5 rounded-full">
                <Leaf className="w-4 h-4 text-green-600" />
            </div>
            <span className="font-bold text-gray-800">1,250 Credits</span>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carbon Wallet Card */}
        <div className="bg-linear-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 font-medium text-sm">Carbon Wallet</p>
              <h2 className="text-3xl font-bold mt-1">1,250</h2>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-50 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+150 this month</span>
          </div>
        </div>

        {/* CO2 Saved Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium text-sm">CO2 Offset</p>
              <h2 className="text-3xl font-bold text-gray-800 mt-1">45.2 <span className="text-lg text-gray-400 font-normal">kg</span></h2>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Equivalent to planting 2 trees.</p>
        </div>

        {/* Next Badge Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 font-medium text-sm">Current Status</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">Earth Guardian</h2>
            </div>
            {/* Simple Circle Progress Placeholder */}
            <div className="relative w-12 h-12 rounded-full border-4 border-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">75%</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">500 pts to "Eco Legend"</p>
        </div>
      </div>

      {/* --- Quick Actions --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/generator/scan" className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Camera className="w-24 h-24 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Scan E-Waste</h3>
            <p className="text-gray-500 mt-2">Use AI to identify items and get an instant price estimate.</p>
            <span className="inline-flex items-center mt-4 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
              Start Scan <ArrowRight className="w-4 h-4 ml-2" />
            </span>
          </div>
        </Link>

        <Link to="/generator/schedule" className="group relative overflow-hidden bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-24 h-24 text-green-600" />
          </div>
          <div className="relative z-10">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-green-600">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Schedule Pickup</h3>
            <p className="text-gray-500 mt-2">Book a slot for our collectors to pick up your waste.</p>
            <span className="inline-flex items-center mt-4 text-green-600 font-semibold group-hover:translate-x-1 transition-transform">
              Book Now <ArrowRight className="w-4 h-4 ml-2" />
            </span>
          </div>
        </Link>
      </div>

      {/* --- Recent Activity List --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" /> Recent Activity
          </h3>
          <Link to="/generator/history" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500">
                <th className="pb-3 font-medium">Item</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Credits</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-medium text-gray-800">{item.item}</td>
                  <td className="py-4 text-gray-500 text-sm">{item.date}</td>
                  <td className="py-4 text-green-600 font-semibold">{item.credits}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${item.status === 'Processed' ? 'bg-green-100 text-green-700' : 
                        item.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DropperDashboard;