import React from 'react';
import { Settings, Home, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
      const isActive = location.pathname === path;
      return (
          <button 
            onClick={() => navigate(path)}
            // Use the deep pink for the active state
            className={`flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-300 ${
                isActive ? 'text-primary-highlight' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-primary-highlight/20' : ''}`} strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
          </button>
      );
  };

  return (
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
          {/* Premium Glass Container */}
          <div className="bg-[#0c0c0e]/80 backdrop-blur-xl saturate-150 border-t border-white/10 h-20 px-6 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <NavItem icon={Home} label="Vault" path="/" />
              <NavItem icon={ShieldCheck} label="Verify" path="/kyc" />
              <NavItem icon={Settings} label="Settings" path="/settings" />
          </div>
          {/* iOS Safe Area Filler */}
          <div className="h-safe-bottom bg-[#0c0c0e]/80 backdrop-blur-xl w-full" />
      </div>
  );
};

export default BottomNav;