import React, { useState } from "react";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000";

const ForgotEmailPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return setError("Please enter a valid email address");
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-green-600 to-teal-900">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">
          
          <div className="text-center mb-8">
            <div className="mx-auto bg-green-100 p-3 rounded-xl w-fit mb-4">
              <Lock className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Reset Password</h2>
            <p className="text-gray-600 mt-2">Enter your registered email to receive a code.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition-all ${
                    error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => [setEmail(e.target.value), setError("")]}
                />
              </div>
              {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}
            </div>

            <button 
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Send OTP Code"}
            </button>

            <div className="text-center mt-6">
              <Link to="/" className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotEmailPage;