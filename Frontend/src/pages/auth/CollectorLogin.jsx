import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Truck } from "lucide-react";
import { useAuthStore } from '../../authStore';

const CollectorLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.loading);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      
      const user = useAuthStore.getState().user;
      
      if(user && user.role === 'collector') {
         navigate("/collector/dashboard", { replace: true });
      } else {
         setError("Access Denied. You are not an authorized Collector.");
         useAuthStore.getState().logout();
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-800 to-gray-900">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">
          
          <div className="text-center mb-6">
            <Link to="/" className="flex items-center justify-center space-x-2 group">
              <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-black transition">
                  <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">EcoCycle</span>
            </Link>
            <p className="text-xs font-semibold text-gray-600 tracking-widest uppercase mt-2">Collector / Partner Portal</p>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Partner Login</h1>
            <p className="text-gray-600 mt-2">Access the logistics & inventory dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Email</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input type="email" placeholder="admin@recycle.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 shadow-sm" required />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-email" className="text-sm text-gray-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 shadow-sm" required />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600 text-center">{error}</p></div>}

            <button type="submit" disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition-all shadow-lg hover:shadow-gray-500/30 disabled:opacity-70">
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            New Partner?{" "}
            <Link to="/signup/collector" className="font-medium text-gray-800 hover:text-black hover:underline">Register Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollectorLogin;