import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- INLINE COMPONENTS ---

// 1. Toast Notification Component
const Toast = ({ show, message, type, onClose }) => {
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

// --- MAIN COMPONENT ---
export default function Settings() {
  // Get user from store (safely)
  const user = useAuthStore((state) => state.user);
  const safeUser = user || { 
    full_name: 'Alex Green', 
    email: 'alex@edrop.com', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' 
  };

  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showToastNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = () => {
    // Simulate API save
    setTimeout(() => {
      showToastNotification('Your settings have been saved successfully.');
    }, 500);
  };

  const sections = [
    { id: 'profile', title: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Configure how you receive alerts' },
    { id: 'privacy', title: 'Privacy', icon: Shield, description: 'Control your data and visibility' },
  ];

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
              className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}