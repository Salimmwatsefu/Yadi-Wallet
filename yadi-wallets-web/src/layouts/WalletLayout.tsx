import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, Bell } from 'lucide-react';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav'; // Re-import BottomNav
import { useAuth } from '../context/AuthContext';

interface WalletLayoutProps {
  children: React.ReactNode;
}

const WalletLayout: React.FC<WalletLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FF5500] selection:text-white pb-24 md:pb-0">
      
      {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
      <nav className="hidden md:flex fixed top-0 left-0 w-full z-40 px-6 py-4 justify-between items-center bg-black/80 backdrop-blur-xl border-b border-white/5">
        <Logo />

        <div className="flex items-center gap-4">
           <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                             <Bell size={20} />
               </button>
            <button 
                onClick={() => navigate('/settings')} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
                <Settings className="w-5 h-5" />
            </button>
             
        </div>
      </nav>

      {/* --- MOBILE HEADER (Simplified) --- */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-40 px-4 py-4 flex justify-between items-center bg-black/90 backdrop-blur-xl border-b border-white/5">
          <Logo />
           <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <Bell size={20} />
              </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-24 px-4 md:px-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
        {children}
      </main>

      {/* --- MOBILE BOTTOM NAV (Fixed at Bottom) --- */}
      <BottomNav />

    </div>
  );
};

export default WalletLayout;