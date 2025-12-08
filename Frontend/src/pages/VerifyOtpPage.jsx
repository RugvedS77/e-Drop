import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const OTP_LENGTH = 6;
  const otpRefs = useRef([]);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate("/forgot-email");
  }, [email, navigate]);

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== OTP_LENGTH) {
      return setError("Please enter the complete 6-digit code.");
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { 
        email: email, 
        otp: otpString 
      });
      navigate("/reset-password", { state: { email, otp: otpString } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Invalid or Expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-green-600 to-teal-900">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">

          <button
            onClick={() => navigate("/forgot-email")}
            className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-2 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Change Email
          </button>

          <div className="text-center mb-8">
            <div className="mx-auto bg-green-100 p-3 rounded-xl w-fit mb-4">
                <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Verify Identity</h2>
            <p className="text-gray-600 mt-2 text-sm">
              Code sent to <span className="font-semibold text-gray-900">{email}</span>
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3 my-8">
            {otp.map((val, idx) => (
              <input
                key={idx}
                ref={(el)=>otpRefs.current[idx] = el}
                maxLength={1}
                className={`w-12 h-14 text-center text-2xl font-bold bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 shadow-sm transition-all ${
                  error ? "border-red-500 ring-red-200" : "border-gray-300"
                }`}
                value={val}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  const arr = [...otp];
                  arr[idx] = v;
                  setOtp(arr);
                  if (v && idx < OTP_LENGTH - 1) otpRefs.current[idx+1].focus();
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[idx] && idx > 0) {
                      otpRefs.current[idx-1].focus();
                  }
                }}
              />
            ))}
          </div>

          {error && <p className="text-red-600 text-sm text-center mb-6 font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Verify Code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;