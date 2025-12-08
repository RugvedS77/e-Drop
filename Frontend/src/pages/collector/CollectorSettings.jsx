import React, { useState } from 'react';
import { 
    User, 
    Truck, 
    Bell, 
    Shield, 
    Save, 
    Camera,
    Mail,
    Phone,
    MapPin,
    Clock
} from 'lucide-react';
import { useAuthStore } from '../../authStore';

// --- Reusable Form Components ---

const SectionTitle = ({ title, description }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
);

const InputGroup = ({ label, type = "text", placeholder, value, icon: Icon }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-300 block">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Icon size={18} />
                </div>
            )}
            <input 
                type={type} 
                className={`w-full bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 ${Icon ? 'pl-10' : ''}`}
                placeholder={placeholder}
                defaultValue={value}
            />
        </div>
    </div>
);

const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-700 last:border-0">
        <div>
            <p className="text-sm font-medium text-gray-200">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);

export default function CollectorSettings() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);

    // Mock State for toggles
    const [notifState, setNotifState] = useState({
        email: true,
        sms: true,
        newPickup: true,
        routeUpdate: false
    });

    const handleSave = () => {
        setLoading(true);
        // Simulate API Save
        setTimeout(() => {
            setLoading(false);
            alert("Settings saved successfully!");
        }, 1000);
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'operations', label: 'Operations & Vehicle', icon: Truck },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100 font-sans">
            
            {/* --- Header --- */}
            <div className="flex justify-between items-center pb-6 border-b border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your account and operational preferences.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Save size={18} />
                    )}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* --- Sidebar Navigation --- */}
                <div className="w-full lg:w-64 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* --- Main Content Area --- */}
                <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 p-6 lg:p-8 shadow-xl">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SectionTitle title="Personal Information" description="Update your personal details and public profile." />
                            
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400 border-4 border-gray-800 group-hover:border-blue-500 transition-all overflow-hidden">
                                        {/* Placeholder for user image */}
                                        <span className="group-hover:hidden">RW</span> 
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Profile Photo</h3>
                                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG or GIF. Max 5MB.</p>
                                    <button className="mt-3 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                                        Upload New
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Full Name" value={user?.full_name || "Raju Wastecollector"} icon={User} />
                                <InputGroup label="Email Address" value={user?.email || "raju@ecocycle.com"} icon={Mail} />
                                <InputGroup label="Phone Number" value="+91 98765 43210" icon={Phone} />
                                <InputGroup label="Base Location" value="Pune, Maharashtra" icon={MapPin} />
                            </div>
                        </div>
                    )}

                    {/* OPERATIONS TAB */}
                    {activeTab === 'operations' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SectionTitle title="Logistics Configuration" description="Manage your vehicle details and operational preferences." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Vehicle Registration Number" value="MH-12-AB-1234" icon={Truck} />
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-1.5">Vehicle Type</label>
                                    <select className="w-full bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                                        <option>Light Commercial Vehicle (Tata Ace)</option>
                                        <option>Heavy Truck</option>
                                        <option>Electric Van</option>
                                        <option>Three Wheeler</option>
                                    </select>
                                </div>
                                <InputGroup label="Preferred Warehouse ID" value="WH-PUNE-01" icon={MapPin} />
                                <InputGroup label="Max Load Capacity (kg)" value="850" type="number" />
                            </div>

                            <div className="border-t border-gray-700 pt-6">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-blue-400" /> Working Hours
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Start Time" type="time" value="09:00" />
                                    <InputGroup label="End Time" type="time" value="18:00" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SectionTitle title="Notification Preferences" description="Choose how and when you want to be alerted." />
                            
                            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 space-y-2">
                                <Toggle 
                                    label="New Pickup Alerts" 
                                    description="Get notified immediately when a new pickup is scheduled in your zone."
                                    checked={notifState.newPickup}
                                    onChange={() => setNotifState(p => ({...p, newPickup: !p.newPickup}))}
                                />
                                <Toggle 
                                    label="Route Optimization Updates" 
                                    description="Notify when a more efficient route path is found during transit."
                                    checked={notifState.routeUpdate}
                                    onChange={() => setNotifState(p => ({...p, routeUpdate: !p.routeUpdate}))}
                                />
                                <Toggle 
                                    label="Email Summaries" 
                                    description="Receive a daily summary of collected weight and earnings."
                                    checked={notifState.email}
                                    onChange={() => setNotifState(p => ({...p, email: !p.email}))}
                                />
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SectionTitle title="Security & Login" description="Update your password and secure your account." />
                            
                            <div className="space-y-4 max-w-md">
                                <InputGroup label="Current Password" type="password" placeholder="••••••••" />
                                <InputGroup label="New Password" type="password" placeholder="••••••••" />
                                <InputGroup label="Confirm New Password" type="password" placeholder="••••••••" />
                            </div>

                            <div className="border-t border-gray-700 pt-6">
                                <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                                <p className="text-xs text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                <button className="px-4 py-2 border border-red-900/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors">
                                    Request Account Deletion
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}