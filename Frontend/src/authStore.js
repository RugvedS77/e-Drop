import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from './api/apiConfig'; 

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, 

  // --- 1. Check Authentication on App Load ---
  checkAuth: () => {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
      set({ loading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      if (decoded.exp > currentTime) {
        set({
          user: JSON.parse(userJson),
          token: token,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        // Token expired
        get().logout();
      }
    } catch (error) {
      console.error("Token decode failed:", error);
      get().logout();
    }
  },

  // --- 2. Login Action ---
  // Connects to: POST /api/auth/login
  login: async (email, password) => {
    // ⚠️ CRITICAL: FastAPI default login route expects Form Data, NOT JSON.
    const formData = new FormData();
    formData.append('username', email); // Backend expects 'username', so we map email to it
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        // Note: Do NOT set 'Content-Type': 'application/json' here. 
        // The browser automatically sets the correct Form Data boundary headers.
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Backend returns: { access_token, token_type, user: {...} }
      const { access_token, user } = data;

      // Save session
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update State
      set({
        user: user,
        token: access_token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return user; // Return user to component for role checks
    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
  },

  // --- 3. Google/Social Login Handler ---
  loginWithToken: (token) => {
    try {
      const decoded = jwtDecode(token);
      
      // Construct user object from JWT payload (assuming backend provides these)
      const user = {
        id: decoded.user_id,
        email: decoded.sub,
        role: decoded.role,
        full_name: decoded.name || "User", 
      };

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token: token,
        user: user,
        isAuthenticated: true,
        loading: false
      });

      return user;
    } catch (error) {
      console.error("Invalid Token", error);
      get().logout();
      return null;
    }
  },

  // --- 4. Logout ---
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      loading: false 
    });
    // Redirect to home
    window.location.href = '/'; 
  },
}));