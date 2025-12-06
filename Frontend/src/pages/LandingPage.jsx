import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Truck, ArrowRight, Recycle, CheckCircle, Smartphone, Globe } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* --- Navigation Bar --- */}
      <nav className="w-full flex items-center justify-between px-6 sm:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 p-2 rounded-lg">
            <Recycle className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">EcoCycle</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">How it Works</a>
          <a href="#impact" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Our Impact</a>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login/dropper" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Log in
          </Link>
          <Link 
            to="/signup/dropper" 
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- Hero Section (The Two Entry Point) --- */}
      <main className="grow pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider mb-4 border border-green-100">
            Trash to Treasure
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Recycling made simple for <span className="text-transparent bg-clip-text bg-linear-to-r from-green-600 to-teal-500">Everyone.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            EcoCycle connects households with authorized recyclers. Scan your e-waste, get instant value, and schedule a pickup today.
          </p>

          {/* --- 🛑 THE TWO ENTRY CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* Entry 1: The Generator (User) */}
            <div className="group relative overflow-hidden bg-white rounded-3xl p-8 border-2 border-green-50 hover:border-green-500 transition-all duration-300 shadow-xl shadow-gray-100 hover:shadow-green-100 text-left">
              <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">For Individuals</h3>
              <p className="text-gray-500 mb-8">
                Have old gadgets lying around? Scan them to earn carbon credits and schedule a hassle-free pickup from your doorstep.
              </p>
              
              <div className="flex gap-3">
                <Link to="/signup/dropper" className="flex-1 py-3 bg-green-600 text-center text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                  Start Recycling
                </Link>
                <Link to="/login/dropper" className="px-4 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Login
                </Link>
              </div>
            </div>

            {/* Entry 2: The Processor (Partner) */}
            <div className="group relative overflow-hidden bg-slate-900 rounded-3xl p-8 border-2 border-slate-800 hover:border-blue-500 transition-all duration-300 shadow-xl shadow-gray-200 text-left">
              <div className="bg-blue-600/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">For Partners</h3>
              <p className="text-slate-400 mb-8">
                Are you a certified recycler or logistics provider? Join our network to manage inventory and optimize pickup routes.
              </p>
              
              <div className="flex gap-3">
                <Link to="/signup/collector" className="flex-1 py-3 bg-blue-600 text-center text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                  Join Network
                </Link>
                <Link to="/login/collector" className="px-4 py-3 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                  Login
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* --- Feature Highlights --- */}
        <div id="how-it-works" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-gray-100">
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Smartphone className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">AI-Powered Scan</h3>
            <p className="text-gray-500 text-sm">Instantly identify your e-waste and get a price estimate using our computer vision tech.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Truck className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Smart Logistics</h3>
            <p className="text-gray-500 text-sm">We group pickups by location to reduce fuel consumption and carbon footprint.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Globe className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Track Impact</h3>
            <p className="text-gray-500 text-sm">See exactly how much CO2 you've saved and earn rewards for your contribution.</p>
          </div>
        </div>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 p-2 rounded-lg">
              <Recycle className="h-5 w-5 text-gray-600" />
            </div>
            <span className="font-bold text-gray-700">EcoCycle</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} EcoCycle. Making the planet greener, one gadget at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;