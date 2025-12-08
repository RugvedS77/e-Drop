import React, { useState, useEffect } from "react";
import { KeyRound, CheckCircle, Loader2, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { email, otp } = location.state || {};

  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) navigate("/forgot-email");
  }, [email, otp, navigate]);

  const handleReset = async () => {
    if (!pwd || pwd.length < 6) return setError("Password must be at least 6 characters");
    if (pwd !== confirmPwd) return setError("Passwords do not match");

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email: email,
        otp: otp,
        new_password: pwd
      });

      alert("Password reset successfully! Please login.");
      navigate("/"); 

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to reset password.");
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
                <KeyRound className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Set New Password</h2>
            <p className="text-gray-600 mt-2 text-sm">Secure your account with a strong password</p>
          </div>

          <div className="space-y-6">
            {/* New Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm transition-all ${error ? "border-red-500" : "border-gray-300"}`}
                        placeholder="••••••••"
                        value={pwd}
                        onChange={e=>[setPwd(e.target.value), setError("")]}
                    />
                </div>
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="password"
                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm transition-all ${error ? "border-red-500" : "border-gray-300"}`}
                        placeholder="••••••••"
                        value={confirmPwd}
                        onChange={e=>[setConfirmPwd(e.target.value), setError("")]}
                    />
                </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600 text-center">{error}</p></div>}

            <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : (
                    <>
                        Reset Password <CheckCircle className="w-5 h-5" /> 
                    </>
                )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;