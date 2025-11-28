import React from 'react';
import { Settings, Home, User } from 'lucide-react'; // Swapped ShieldCheck for User
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 group ${
                isActive ? 'text-[#FF5500]' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#FF5500]/10' : 'bg-transparent'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-[#FF5500]/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
          </button>
      );
  };

  return (
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
          {/* Premium Glass Container */}
          <div className="bg-[#09090B]/90 backdrop-blur-xl border-t border-white/10 h-[88px] pb-6 px-8 flex justify-around items-center shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)]">
              <NavItem icon={Home} label="Home" path="/dashboard" />
              {/* Consolidating Profile into Settings is cleaner for mobile navs */}
              <NavItem icon={Settings} label="Settings" path="/settings" />
          </div>
      </div>
  );
};

export default BottomNav;