import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div 
      className={`flex items-center gap-3 cursor-pointer group ${className}`} 
      onClick={() => navigate('/')}
    >
      {/* Icon Box */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-black shadow-[0_0_20px_rgba(255,85,0,0.2)] group-hover:scale-105 transition-transform border border-transparent group-hover:border-[#FF5500]/50">
        <Wallet className="w-5 h-5 fill-current" />
      </div>
      
      {/* Text Lockup */}
      <div className="flex flex-col">
        <span className="font-heading font-bold text-xl tracking-wide text-white leading-none">
          Yadi Wallet
        </span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mt-1 group-hover:text-[#FF5500] transition-colors">
          by Yadi
        </span>
      </div>
    </div>
  );
};

export default Logo;