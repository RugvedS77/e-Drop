import React, { useState } from 'react';
import { useAuthStore } from '../../authStore';
import { 
  Wallet, 
  Leaf, 
  TrendingUp, 
  History, 
  Gift, 
  Wind, 
  TreeDeciduous, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Zap
} from 'lucide-react';

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- MOCK DATA ---
const walletData = {
  balance: 2450,
  lifetime_earnings: 5800,
  impact: {
    co2_saved: '145 kg',
    trees_planted: '4',
    energy_saved: '280 kWh'
  }
};

const transactions = [
  { id: 1, type: 'earn', title: 'Recycled MacBook Pro', date: '2025-11-20', amount: 450, status: 'Completed' },
  { id: 2, type: 'earn', title: 'Recycled iPhone 12', date: '2025-11-18', amount: 320, status: 'Completed' },
  { id: 3, type: 'spend', title: 'Amazon Gift Card ($10)', date: '2025-11-15', amount: -1000, status: 'Redeemed' },
  { id: 4, type: 'earn', title: 'Old Monitor Pickup', date: '2025-11-10', amount: 80, status: 'Completed' },
  { id: 5, type: 'spend', title: 'Tree Planting Donation', date: '2025-11-05', amount: -500, status: 'Donated' },
];

const rewards = [
  { id: 1, title: '$10 Amazon Voucher', cost: 1000, icon: Gift, description: 'Digital code sent instantly' },
  { id: 2, title: 'Plant a Tree', cost: 500, icon: TreeDeciduous, description: 'Donation to Reforest Now' },
  { id: 3, title: '$25 Apple Gift Card', cost: 2500, icon: CreditCard, description: 'For App Store & iTunes' },
  { id: 4, title: 'Premium Features', cost: 800, icon: Zap, description: '1 Month Subscription' },
];

// --- COMPONENTS ---

const StatCard = ({ icon: Icon, label, value, subtext, colorClass }) => (
  <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-start justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
    <div>
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-emerald-600 text-xs font-medium mt-1">{subtext}</p>}
    </div>
    <div className={cn("p-3 rounded-xl", colorClass)}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function CarbonWallet() {
  // 1. Get user from store (selecting safely to avoid loops)
  const user = useAuthStore((state) => state.user);
  const safeUser = user || { full_name: 'Eco Warrior' };

  const [activeTab, setActiveTab] = useState('history');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 pb-20">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <Wallet className="text-emerald-600" /> Carbon Wallet
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your eco-credits and view your impact</p>
        </div>
        <div className="hidden md:block text-right">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="font-semibold text-emerald-700">{safeUser.full_name}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Wallet & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* HERO CARD (Light Theme) */}
          <div className="relative rounded-3xl bg-white border border-gray-200 p-8 overflow-hidden shadow-lg group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Leaf size={200} className="text-emerald-900" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <p className="flex items-center gap-2 text-emerald-700 font-medium mb-2 bg-emerald-50 w-fit px-3 py-1 rounded-full text-sm">
                  <Leaf size={14} /> Available Balance
                </p>
                <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                  {walletData.balance.toLocaleString()} <span className="text-2xl text-gray-400 font-normal">pts</span>
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Lifetime Earnings: <span className="font-semibold text-gray-700">{walletData.lifetime_earnings.toLocaleString()} pts</span>
                </p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('rewards')}
                  className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Gift size={18} /> Redeem
                </button>
                <button className="flex-1 md:flex-none px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 shadow-sm transition-all flex items-center justify-center gap-2">
                  <TrendingUp size={18} /> Analytics
                </button>
              </div>
            </div>
          </div>

          {/* IMPACT METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              icon={Wind} 
              label="CO2 Offset" 
              value={walletData.impact.co2_saved} 
              subtext="Equivalent to 500 miles"
              colorClass="bg-blue-50 text-blue-600"
            />
            <StatCard 
              icon={TreeDeciduous} 
              label="Trees Saved" 
              value={walletData.impact.trees_planted} 
              subtext="Forest contribution"
              colorClass="bg-green-50 text-green-600"
            />
            <StatCard 
              icon={TrendingUp} 
              label="Energy Saved" 
              value={walletData.impact.energy_saved} 
              subtext="Grid power reduced"
              colorClass="bg-amber-50 text-amber-600"
            />
          </div>

          {/* TABS & LIST */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 relative",
                  activeTab === 'history' ? "text-emerald-600 bg-white" : "bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <History size={16} /> Transaction History
                {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 relative",
                  activeTab === 'rewards' ? "text-emerald-600 bg-white" : "bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <Gift size={16} /> Redeem Rewards
                {activeTab === 'rewards' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
              </button>
            </div>

            <div className="p-0">
              {activeTab === 'history' ? (
                <div className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-gray-100",
                          tx.type === 'earn' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {tx.type === 'earn' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{tx.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                             <Calendar size={12} /> {tx.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold text-sm",
                          tx.type === 'earn' ? "text-emerald-600" : "text-gray-900"
                        )}>
                          {tx.type === 'earn' ? '+' : ''}{tx.amount} pts
                        </p>
                        <span className={cn(
                          "inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mt-1 border",
                          tx.status === 'Completed' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-600 border-gray-100"
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group bg-white">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <reward.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{reward.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">{reward.description}</p>
                        <div className="flex items-center justify-between">
                           <span className="text-emerald-600 font-bold text-sm">{reward.cost} pts</span>
                           <button className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">Claim</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <TrendingUp className="text-emerald-600" size={20} /> Monthly Summary
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Earned this month</span>
                  <span className="font-semibold text-emerald-600">+850 pts</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Redeemed</span>
                  <span className="font-semibold text-gray-900">1,500 pts</span>
               </div>
               <div className="h-px bg-gray-100 my-2"></div>
               <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-800 mb-1">You're in the top</p>
                  <p className="text-3xl font-bold text-emerald-600">5%</p>
                  <p className="text-xs text-emerald-800 mt-1">of eco-contributors!</p>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
             <div className="flex items-center gap-2 mb-2">
                <Gift className="text-emerald-200" size={20} />
                <h3 className="font-bold text-lg">Invite Friends</h3>
             </div>
             <p className="text-emerald-100 text-sm mb-4 leading-relaxed">Earn 500 bonus points for every friend who recycles their first item.</p>
             <button className="w-full bg-white text-emerald-700 font-bold py-2.5 rounded-lg text-sm hover:bg-emerald-50 transition-colors shadow-sm">
                Copy Invite Link
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}