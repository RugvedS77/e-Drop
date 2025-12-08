import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, CheckCircle } from "lucide-react";
import { useAuthStore } from '../../authStore';
import { API_BASE_URL } from "../../api/apiConfig";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.94H12V14.28H17.96C17.67 15.63 17.03 16.8 16.14 17.48V20.2H19.83C21.66 18.57 22.56 15.69 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.45 22.04 19.28 20.2L16.14 17.48C15.15 18.14 13.67 18.57 12 18.57C9.31 18.57 6.99 16.81 6.09 14.39H2.38V17.21C4.18 20.79 7.8 23 12 23Z" fill="#34A853"/>
    <path d="M6.09 14.39C5.83 13.68 5.69 12.92 5.69 12.14C5.69 11.36 5.83 10.6 6.09 9.89V7.07H2.38C1.5 8.7 1 10.36 1 12.14C1 13.92 1.5 15.58 2.38 17.21L6.09 14.39Z" fill="#FBBC05"/>
    <path d="M12 5.43C13.43 5.43 14.67 5.9 15.6 6.78L18.42 4.14C16.63 2.52 14.47 1.5 12 1.5C7.8 1.5 4.18 3.71 2.38 7.07L6.09 9.89C6.99 7.47 9.31 5.43 12 5.43Z" fill="#EA4335"/>
  </svg>
);

const DropperLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  const isLoading = useAuthStore((state) => state.loading);
  
  const [email, setEmail] = useState("mayuresh@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      
      const user = useAuthStore.getState().user;
      
      // Check Role
      if(user && (user.role === 'dropper' || user.role === 'Dropper')) {
         navigate("/dropper/dashboard", { replace: true });
      } else {
         // 1. Set the error message
         setError(`Access Denied. Your account is registered as a ${user?.role || 'Unknown'}.`);
         
         // 2. Logout WITHOUT redirecting (pass false)
         // This ensures the session is cleared, but the page stays put
         useAuthStore.getState().logout(false); 
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };
  
  const handleGoogleLogin = () => {
    // ⬇️ UPDATE: Added ?role=dropper to the URL
    const backendUrl = `${API_BASE_URL}/api/auth/login/google?role=dropper`;
    window.open(backendUrl, "oauth-login", "width=500,height=600");
  };

  useEffect(() => {
      const handleAuthMessage = (event) => {
          const { token } = event.data;
          if (token) {
              const user = loginWithToken(token);
              // We rely on the authStore to decode the token and set the user
              // We need to wait a tick or check the store again, but simpler logic:
              if (user && user.role === 'dropper' || user.role === 'Dropper') {
                  navigate("/dropper/dashboard", { replace: true });
              } else if (user && user.role !== 'dropper') {
                  setError("Wrong Portal. Please login as a Collector.");
              }
          }
      };
      window.addEventListener("message", handleAuthMessage);
      return () => window.removeEventListener("message", handleAuthMessage);
  }, [loginWithToken, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-green-600 to-teal-900">
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">
          
          <div className="text-center mb-6">
            <Link to="/" className="flex items-center justify-center space-x-2 group">
              <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-700 transition">
                  <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">e-Drop</span>
            </Link>
            <p className="text-xs font-semibold text-green-600 tracking-widest uppercase mt-2">Dropper Portal</p>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Log in to manage your recycling</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-email" className="text-sm text-green-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm" required />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600 text-center">{error}</p></div>}

            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-70">
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300"></span></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or login with</span></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 bg-white">
              <GoogleIcon />
              <span>Google</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account?{" "}
            <Link to="/signup/dropper" className="font-medium text-green-600 hover:text-green-700 hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropperLogin;