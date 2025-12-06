import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore.js';
import './App.css';

// --- Public Pages ---
import LandingPage from './pages/LandingPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

// --- Common Auth Pages (Password Reset) ---
import ForgotEmailPage from "./pages/ForgotEmailPage.jsx";
import VerifyOtpPage from "./pages/VerifyOtpPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

// --- Role-Specific Auth Pages ---
import DropperLogin from './pages/auth/DropperLogin.jsx';
import DropperSignup from './pages/auth/DropperSignup.jsx';
import CollectorLogin from './pages/auth/CollectorLogin.jsx';
import CollectorSignup from './pages/auth/CollectorSignup.jsx';

// --- Dashboards ---
import DropperDashboard from './pages/dropper/DropperDashboard.jsx';
import CollectorDashboard from './pages/collector/CollectorDashBoard.jsx';

// --- Layouts ---
import DropperLayout from './components/layouts/DropperLayout.jsx';
import CollectorLayout from './components/layouts/CollectorLayout.jsx';

// --- 🔒 ROLE-BASED PROTECTION WRAPPER ---
function ProtectedRoute({ children, allowedRole }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-500 text-sm font-medium">Verifying access...</span>
        </div>
      </div>
    );
  }

  // 1. Not Logged In? -> Redirect to the specific login page for that role
  if (!isAuthenticated) {
    return <Navigate to={`/login/${allowedRole}`} replace />;
  }

  // 2. Logged In but Wrong Role? -> Redirect to Home or Unauthorized
  // (Prevents a User from typing /processor/dashboard to access Admin panels)
  if (user?.role !== allowedRole) {
    console.warn(`Unauthorized access attempt: User role '${user?.role}' tried to access '${allowedRole}' route.`);
    return <Navigate to="/" replace />; 
  }

  return children;
}

// --- Router Configuration ---
const router = createBrowserRouter([
  // 1. PUBLIC LANDING PAGE
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },

  // 2. COMMON PASSWORD RECOVERY (Accessible by both roles)
  { path: '/forgot-email', element: <ForgotEmailPage /> },
  { path: '/verify-otp', element: <VerifyOtpPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // 3. GENERATOR AUTH (Users)
  { path: '/login/dropper', element: <DropperLogin /> },
  { path: '/signup/dropper', element: <DropperSignup /> },

  // 4. PROCESSOR AUTH (Admins/Recyclers)
  { path: '/login/collector', element: <CollectorLogin /> },
  { path: '/signup/collector', element: <CollectorSignup /> },

  // 5. 🟢 GENERATOR ROUTES (Protected)
  {
    path: '/dropper',
    element: (
      <ProtectedRoute allowedRole="dropper">
        <DropperLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DropperDashboard /> },
      // Future routes:
      // { path: 'scan', element: <ScanItemPage /> },
      // { path: 'wallet', element: <WalletPage /> },
    ],
  },

  // 6. 🔵 PROCESSOR ROUTES (Protected)
  {
    path: '/collector',
    element: (
      <ProtectedRoute allowedRole="collector">
        <CollectorLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <CollectorDashboard /> },
      // Future routes:
      // { path: 'inventory', element: <InventoryPage /> },
      // { path: 'logistics', element: <LogisticsPage /> },
    ],
  },
]);

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const loading = useAuthStore((state) => state.loading);

  // Check session on initial app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global Loading State (before router mounts)
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <h1 className="text-lg font-medium text-gray-600 animate-pulse">
            Initializing EcoCycle...
          </h1>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;