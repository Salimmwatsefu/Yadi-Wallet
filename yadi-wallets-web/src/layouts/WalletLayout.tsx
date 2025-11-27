import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Home, ShieldCheck, Settings, User } from 'lucide-react';
import Logo from '../components/Logo';

interface WalletLayoutProps {
  children: React.ReactNode;
}

const WalletLayout: React.FC<WalletLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = location.pathname === path;
    return (
      <button 
        onClick={() => navigate(path)}
        className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group ${
            isActive ? 'text-[#FF5500]' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {/* Active Glow Background */}
        {isActive && (
            <div className="absolute inset-0 bg-[#FF5500]/5 blur-xl rounded-full" />
        )}
        
        <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-[#FF5500] selection:text-white pb-24 md:pb-0">
      
      {/* --- DESKTOP HEADER --- */}
      <nav className="hidden md:flex fixed top-0 left-0 w-full z-40 px-8 py-6 justify-between items-center bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Logo />

        <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className={`text-sm font-bold transition-colors ${location.pathname === '/dashboard' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>Overview</button>
            <button onClick={() => navigate('/kyc')} className={`text-sm font-bold transition-colors ${location.pathname === '/kyc' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>Verify</button>
            <button onClick={() => navigate('/settings')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
            </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-6 md:pt-28 px-4 md:px-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
        {children}
      </main>

      {/* --- MOBILE BOTTOM DOCK --- */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] h-20 px-2 flex justify-between items-center shadow-2xl">
              <NavItem icon={Home} label="Home" path="/dashboard" />
              <NavItem icon={ShieldCheck} label="Verify" path="/kyc" />
              <NavItem icon={User} label="Profile" path="/settings" />
          </div>
      </div>

    </div>
  );
};

export default WalletLayout;