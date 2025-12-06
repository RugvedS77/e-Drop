import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../authStore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bell, 
  Shield, 
  Save,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Loader
} from 'lucide-react';

// --- CONFIGURATION ---
// Base URL provided by the user
export const API_BASE_URL = 'http://localhost:8000'; 
const API_PREFIX = '/api'; // Assuming your routes are under /api/profiles, as per your router definition

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- INLINE COMPONENTS ---

// 1. Toast Notification Component
const Toast = ({ show, message, type }) => {
  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
        type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
      )}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// 2. Toggle Switch Component
const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn(
      "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500",
      checked ? "bg-emerald-600" : "bg-gray-200"
    )}
  >
    <div
      className={cn(
        "w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);


// --- API FUNCTIONS (FastAPI Integration) ---
const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`, // Assuming Bearer Token authentication
});

/**
 * Fetches the current user's profile, which contains carbon stats.
 * Corresponds to: GET /api/profiles/me
 */
async function fetchProfile(token) {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/profiles/me`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

/**
 * IMPORTANT: This function SIMULATES the update of personal and settings data.
 */
async function updateSettings(userId, personalData, settingsData, token) {
    console.log("Simulating API call to save settings. Personal:", personalData, "Settings:", settingsData);

    // Simulate network delay and successful response
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
}


// --- MAIN COMPONENT ---
export default function Settings() {
  // Get user, token, and the action to update the user from the store
  
  // NOTE on Store Access: It is often best practice in Zustand to split 
  // state and actions into separate calls to avoid re-renders.
  // However, for simplicity and direct fix application:
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  // 🔥 FIX APPLIED HERE: Correctly retrieve the setUser action/setter function
  const setUser = useAuthStore((state) => state.setUser); 

  const safeUser = user || { 
    id: 999,
    full_name: 'Alex Green (Guest)', 
    email: 'alex@edrop.com', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' 
  };

  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for user-editable form data (initialized with placeholders/store data)
  const [formData, setFormData] = useState({
    name: safeUser.full_name,
    email: safeUser.email,
    phone: '+1 (555) 123-4567', 
    address: '123 Green Street, Eco City, EC 12345', 
    emailNotifications: true, 
    pushNotifications: true, 
    smsNotifications: false, 
    marketingEmails: false, 
    profilePublic: false, 
    showActivity: true, 
    dataSharing: false, 
  });

  // State for read-only profile stats from FastAPI (carbon_balance, co2_saved)
  const [profileStats, setProfileStats] = useState({
    carbon_balance: 0,
    co2_saved: 0.0,
  });

  // --- Data Fetching Effect (on mount) ---
  useEffect(() => {
    if (token) {
      const loadProfile = async () => {
        try {
          const data = await fetchProfile(token);
          setProfileStats(data); 
          // In a production app, you would also load phone, address, and settings from 'data' here.

        } catch (error) {
          console.error("Error loading profile:", error);
          showToastNotification(error.message || 'Failed to load profile data.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      loadProfile();
    } else {
      setIsLoading(false); // If no token, show form with placeholder data
      showToastNotification("Authentication token missing. Using placeholder data.", 'error');
    }
  }, [token]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showToastNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async () => {
    if (!token) {
        showToastNotification("You must be logged in to save changes.", 'error');
        return;
    }
    
    // Check if setUser is available before attempting to call it (safety check)
    if (typeof setUser !== 'function') {
        console.error("FATAL: setUser function not available from auth store.");
        showToastNotification("Internal error: Failed to access user update function.", 'error');
        return;
    }

    setIsSaving(true);
    
    const personalData = { 
        full_name: formData.name, 
        email: formData.email, 
        phone: formData.phone, 
        address: formData.address 
    };
    const settingsData = {
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        smsNotifications: formData.smsNotifications,
        marketingEmails: formData.marketingEmails,
        profilePublic: formData.profilePublic,
        showActivity: formData.showActivity,
        dataSharing: formData.dataSharing,
    }

    try {
        await updateSettings(safeUser.id, personalData, settingsData, token);
        showToastNotification('Your settings have been saved successfully.');

        // ✅ FIX APPLIED: This line now correctly calls the setUser function.
        // It updates the global user state with the new name and email from the form.
        setUser({ ...user, full_name: formData.name, email: formData.email });

    } catch (error) {
        console.error("Save error:", error);
        showToastNotification('Failed to save settings. Please try again.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const sections = [
    { id: 'profile', title: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Configure how you receive alerts' },
    { id: 'privacy', title: 'Privacy', icon: Shield, description: 'Control your data and visibility' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8 text-emerald-600" />
        <p className="ml-3 text-lg text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 pb-20">
      
      {/* Toast Notification */}
      <Toast {...toast} />

      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <SettingsIcon className="text-emerald-600" /> Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences and configurations</p>
        </div>
        {/* Display read-only profile stats from the backend */}
        <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-500">Carbon Balance:</p>
            <p className="text-xl font-bold text-emerald-600">{profileStats.carbon_balance} Credits</p>
            <p className="text-xs text-gray-400">CO2 Saved: {profileStats.co2_saved.toFixed(2)} kg</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left border',
                    isActive
                      ? 'bg-white border-emerald-200 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                  )}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <span className={cn("block font-semibold", isActive ? "text-gray-900" : "text-gray-600")}>
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-400 font-normal hidden sm:block">
                      {section.description}
                    </span>
                  </div>
                  {isActive && <ChevronRight size={16} className="ml-auto text-emerald-500" />}
                </button>
              );
            })}
            <button
                onClick={() => console.log('Log out action')}
                className='w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left border border-transparent hover:bg-red-50 hover:border-red-100 text-red-600 mt-4'
            >
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                    <LogOut size={20} />
                </div>
                <span className="block font-semibold">Log Out</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Avatar Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Profile Picture</h3>
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer">
                    <img
                      src={safeUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-md hover:bg-emerald-700 transition-colors">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-500">{formData.email}</p>
                    <div className="flex gap-3 mt-3">
                      <button className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        Upload New
                      </button>
                      <button className="text-sm text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info Form */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Notification Preferences</h3>
              <div className="space-y-1">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates, receipts, and account alerts via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', description: 'Get real-time browser notifications for status updates' },
                  { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive text message alerts for pickup arrivals' },
                  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive eco-tips, offers, and monthly newsletters' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    <Toggle 
                      checked={formData[item.key]} 
                      onChange={(checked) => handleInputChange(item.key, checked)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRIVACY SECTION */}
          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Privacy Settings</h3>
                <div className="space-y-1">
                  {[
                    { key: 'profilePublic', label: 'Public Profile', description: 'Allow other community members to see your recycling achievements' },
                    { key: 'showActivity', label: 'Show Activity Status', description: 'Display your recent recycling activity on the leaderboard' },
                    { key: 'dataSharing', label: 'Anonymous Data Sharing', description: 'Share anonymized usage data to help improve our sustainability algorithms' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <Toggle 
                        checked={formData[item.key]} 
                        onChange={(checked) => handleInputChange(item.key, checked)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                  <AlertCircle size={20} /> Danger Zone
                </h3>
                <p className="text-sm text-red-600/80 mb-6">
                  Once you delete your account, there is no going back. All your points, history, and data will be permanently removed.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors font-medium text-sm shadow-sm">
                  <Trash2 size={16} />
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* Save Button (Always visible) */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md transform hover:-translate-y-0.5",
                isSaving ? "bg-emerald-400 cursor-not-allowed" : "hover:bg-emerald-700 hover:shadow-lg"
              )}
            >
              {isSaving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}