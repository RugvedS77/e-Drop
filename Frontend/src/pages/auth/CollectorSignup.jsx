import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Truck } from "lucide-react"; // Changed icon to Truck
import { useAuthStore } from '../../authStore';
import { API_BASE_URL } from "../../api/apiConfig";

const CollectorSignup = () => {
  const navigate = useNavigate();
  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const userData = {
      full_name: full_name,
      email: email,
      password: password,
      role: "collector", // <--- HARDCODED ROLE FOR ADMIN/RECYCLER
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMsg = `Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (jsonError) {}
        throw new Error(errorMsg);
      }

      setSuccess("Collector account created! Redirecting to login...");
      setTimeout(() => {
        navigate("/login/collector");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-800 to-gray-900">
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
          <h1 className="text-3xl font-extrabold text-gray-900">Partner Registration</h1>
          <p className="text-gray-600 mt-2">Join our network of authorized recyclers.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization / Name</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" placeholder="Recycle Pvt Ltd" value={full_name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 shadow-sm" required />
            </div>
          </div>

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
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gray-500 focus:border-gray-500 shadow-sm" required minLength="5" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center bg-green-50 p-2 rounded">{success}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition-all shadow-lg hover:shadow-gray-500/30 disabled:opacity-70">
            {isLoading ? "Processing..." : "Register Partner"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already a partner?{" "}
          <Link to="/login/collector" className="font-medium text-gray-800 hover:text-black hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CollectorSignup;