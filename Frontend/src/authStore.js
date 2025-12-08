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
    // We try to trust the token more than the cached user object
    
    if (!token) {
      set({ loading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp > currentTime) {
        // If we have a user in storage, use it, otherwise reconstruct from token
        let userObj = null;
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            userObj = JSON.parse(storedUser);
        } else {
            // Fallback: Build user from token claims
            userObj = {
                id: decoded.user_id,
                email: decoded.sub,
                role: decoded.role // Vital for permission checks
            };
        }

        set({
          user: userObj,
          token: token,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        get().logout();
      }
    } catch (error) {
      console.error("Token decode failed:", error);
      get().logout();
    }
  },

  // --- 2. Login Action ---
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      const { access_token, user: backendUser } = data;

      // --- CRITICAL FIX START ---
      // We explicitly decode the token to get the 'role' and 'user_id'
      // This ensures we have the permissions the backend actually granted.
      const decodedToken = jwtDecode(access_token);
      
      const finalUser = {
        ...backendUser, // Basic info like name/email from backend response body
        id: decodedToken.user_id || backendUser.id,
        role: decodedToken.role || backendUser.role // Prioritize token role
      };
      
      console.log("AUTH STORE: Login Success. User:", finalUser);
      // --- CRITICAL FIX END ---

      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(finalUser));

      set({
        user: finalUser,
        token: access_token,
        isAuthenticated: true,
        loading: false,
      });

      return finalUser; 
    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
  },

  // --- 3. Google/Social Login Handler ---
  loginWithToken: (token) => {
    try {
      const decoded = jwtDecode(token);
      
      const user = {
        id: decoded.user_id,
        email: decoded.sub,
        role: decoded.role,
        full_name: decoded.name || "User", 
      };

      console.log("AUTH STORE: Google Login. Role:", user.role);

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

  // --- 4. Update User Data Action ---
  setUser: (newUserData) => {
    set((state) => {
      const updatedUser = { 
        ...state.user, 
        ...newUserData 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  /// --- 5. Logout (Updated) ---
  // We add a parameter 'shouldRedirect' defaulting to true
  logout: (shouldRedirect = true) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      loading: false 
    });

    // Only redirect if explicitly told to (or by default)
    if (shouldRedirect) {
        window.location.href = '/'; 
    }
  },
}));