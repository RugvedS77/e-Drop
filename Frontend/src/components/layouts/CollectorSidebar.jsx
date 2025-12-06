import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuthStore } from '../../authStore';
import { 
    LayoutDashboard, 
    Package, 
    Map, 
    Users, 
    Settings, 
    LogOut,
    Truck,
    FileCheck
} from 'lucide-react';

// --- Reusable NavLink Component (Blue Theme) ---
const NavLink = ({ to, icon, children }) => (
    <RouterNavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center p-3 my-1 rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/20' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`
        }
    >
        {icon}
        <span className="ml-4 text-sm">{children}</span>
    </RouterNavLink>
);

export default function CollectorSidebar() {
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="h-screen w-72 bg-linear-to-b from-slate-900 to-blue-950 border-r border-slate-700 flex flex-col shrink-0 transition-all duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Truck className="h-6 w-6 text-white fill-blue-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-100 tracking-tight">EcoCycle</h1>
                </div>
                <p className="text-xs text-blue-400 pl-1">Collector Admin</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                
                {/* Operations */}
                <div>
                    <h2 className="px-3 mb-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        Operations
                    </h2>
                    <NavLink to="/collector/dashboard" icon={<LayoutDashboard size={20} />}>
                        Command Center
                    </NavLink>
                    <NavLink to="/collector/inventory" icon={<Package size={20} />}>
                        Live Inventory
                    </NavLink>
                    <NavLink to="/collector/logistics" icon={<Map size={20} />}>
                        Route Logistics
                    </NavLink>
                </div>

                {/* Administration */}
                <div>
                    <h2 className="px-3 mb-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        Management
                    </h2>
                    <NavLink to="/collector/certificates" icon={<FileCheck size={20} />}>
                        Certificates
                    </NavLink>
                    <NavLink to="/collector/users" icon={<Users size={20} />}>
                        User & Drivers
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <div className="space-y-1">
                    <NavLink to="/collector/settings" icon={<Settings size={20} />}>
                        Platform Settings
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