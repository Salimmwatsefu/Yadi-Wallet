import React from 'react';
import { Settings, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    // Fixed navbar with premium glass effect
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-[#0c0c0e]/60 backdrop-blur-xl saturate-150">
        
        {/* Brand Logo */}
        <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer group"
        >
            {/* The Icon Container - Darker Pink Accent */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 group-hover:border-primary/50 transition-colors shadow-[0_0_15px_rgba(190,24,93,0.2)]">
                 <Wallet className="w-5 h-5 text-primary-highlight" />
            </div>
            
            <div className="flex flex-col">
                <span className="text-xl font-heading font-bold tracking-tight leading-none text-white">
                    Yadi.
                </span>
            </div>
        </div>

        {/* Desktop Settings Button - Subtle Glass */}
        <button 
          onClick={() => navigate('/settings')}
          className="
            hidden md:flex 
            p-2.5 rounded-full 
            bg-white/5 border border-white/10 backdrop-blur-md 
            text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20
            transition-all duration-200
          "
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

    </nav>
  );
};

export default Navbar;