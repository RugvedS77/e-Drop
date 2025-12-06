import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuthStore } from '../../authStore'; // Adjusted path based on new folder structure
import { API_BASE_URL } from "../../api/apiConfig";

// --- Reusable SVG Icons ---
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.94H12V14.28H17.96C17.67 15.63 17.03 16.8 16.14 17.48V20.2H19.83C21.66 18.57 22.56 15.69 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.45 22.04 19.28 20.2L16.14 17.48C15.15 18.14 13.67 18.57 12 18.57C9.31 18.57 6.99 16.81 6.09 14.39H2.38V17.21C4.18 20.79 7.8 23 12 23Z" fill="#34A853"/>
    <path d="M6.09 14.39C5.83 13.68 5.69 12.92 5.69 12.14C5.69 11.36 5.83 10.6 6.09 9.89V7.07H2.38C1.5 8.7 1 10.36 1 12.14C1 13.92 1.5 15.58 2.38 17.21L6.09 14.39Z" fill="#FBBC05"/>
    <path d="M12 5.43C13.43 5.43 14.67 5.9 15.6 6.78L18.42 4.14C16.63 2.52 14.47 1.5 12 1.5C7.8 1.5 4.18 3.71 2.38 7.07L6.09 9.89C6.99 7.47 9.31 5.43 12 5.43Z" fill="#EA4335"/>
  </svg>
);

const DropperSignup = () => {
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
      role: "dropper", // <--- HARDCODED ROLE
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

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => {
        navigate("/login/dropper"); // <--- Redirect to Dropper Login
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const backendUrl = `${API_BASE_URL}/api/auth/login/google`;
    window.open(backendUrl, "oauth-login", "width=500,height=600");
  };

  useEffect(() => {
    const handleAuthMessage = (event) => {
      const { token } = event.data;
      if (token) {
        const user = loginWithToken(token);
        if (user) {
             // For Google Auth, we might need to verify role or force update, 
             // but assuming backend handles default roles or existing users:
             navigate("/dropper/dashboard", { replace: true });
        } else {
          setError("Failed to authenticate.");
        }
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-green-600 to-teal-900">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">
        
        <div className="text-center mb-6">
          <Link to="/" className="flex items-center justify-center space-x-2 group">
            <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-700 transition">
                <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">EcoCycle</span>
          </Link>
          <p className="text-xs font-semibold text-green-600 tracking-widest uppercase mt-2">Dropper Portal</p>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Start Recycling</h1>
          <p className="text-gray-600 mt-2">Create an account to track your impact.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" placeholder="John Doe" value={full_name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm" required minLength="5" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>}
          {success && <p className="text-sm text-green-600 text-center bg-green-50 p-2 rounded">{success}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70">
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or sign up with</span></div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button type="button" onClick={handleGoogleSignup} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 bg-white">
            <GoogleIcon />
            <span>Google</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{" "}
          <Link to="/login/dropper" className="font-medium text-green-600 hover:text-green-700 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DropperSignup;