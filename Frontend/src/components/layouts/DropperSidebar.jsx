import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuthStore } from '../../authStore';
import { 
    LayoutDashboard, 
    Camera, 
    Calendar, 
    Wallet, 
    History, 
    Settings, 
    LogOut,
    Leaf
} from 'lucide-react';

// --- Reusable NavLink Component (Green Theme) ---
const NavLink = ({ to, icon, children }) => (
    <RouterNavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center p-3 my-1 rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-green-600 text-white font-semibold shadow-md shadow-green-900/20' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`
        }
    >
        {icon}
        <span className="ml-4 text-sm">{children}</span>
    </RouterNavLink>
);

export default function DropperSidebar() {
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="h-screen w-72 bg-linear-to-b from-slate-900 to-green-950 border-r border-slate-700 flex flex-col shrink-0 transition-all duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="bg-green-600 p-1.5 rounded-lg">
                        <Leaf className="h-6 w-6 text-white fill-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-100 tracking-tight">EcoCycle</h1>
                </div>
                <p className="text-xs text-green-400 pl-1">Dropper Portal</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                
                {/* Main Actions */}
                <div>
                    <h2 className="px-3 mb-2 text-xs font-semibold text-green-400 uppercase tracking-wider">
                        Recycle
                    </h2>
                    <NavLink to="/dropper/dashboard" icon={<LayoutDashboard size={20} />}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/dropper/scan" icon={<Camera size={20} />}>
                        Scan E-Waste
                    </NavLink>
                    <NavLink to="/dropper/schedule" icon={<Calendar size={20} />}>
                        Schedule Pickup
                    </NavLink>
                </div>

                {/* Account Data */}
                <div>
                    <h2 className="px-3 mb-2 text-xs font-semibold text-green-400 uppercase tracking-wider">
                        My Impact
                    </h2>
                    <NavLink to="/dropper/wallet" icon={<Wallet size={20} />}>
                        Carbon Wallet
                    </NavLink>
                    <NavLink to="/dropper/history" icon={<History size={20} />}>
                        Recycle History
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <div className="space-y-1">
                    <NavLink to="/dropper/settings" icon={<Settings size={20} />}>
                        Settings
                    </NavLink>
                    
                    <button 
                        onClick={logout}
                        className="w-full flex items-center p-3 my-1 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="ml-4 text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}