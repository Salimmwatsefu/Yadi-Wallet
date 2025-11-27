import { motion } from "framer-motion";
import { CreditCard, Wifi } from "lucide-react";

const HoloWallet = () => {
    return (
        <motion.div 
            className="relative w-[300px] md:w-[320px] h-[480px] md:h-[500px] md:ml-40 ml-0"
            initial={{ rotateY: -20, rotateX: 10 }}
            animate={{ 
                rotateY: [-20, -10, -20],
                rotateX: [10, 0, 10],
                y: [0, -20, 0] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Back Layer */}
            <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] border border-white/10 opacity-80 translate-z-[-20px] scale-95 translate-y-[15px] backdrop-blur-md"></div>

            {/* Front Glass Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between p-8">
                
                {/* Reflection */}
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none"></div>
                
                {/* Top: Chip & Status */}
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        {/* The Chip (Gold Detailed) */}
                        <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#B8860B] border border-[#FDB931] relative overflow-hidden flex items-center justify-center shadow-inner">
                            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            <div className="w-full h-[1px] bg-black/30 absolute top-1/3"></div>
                            <div className="w-full h-[1px] bg-black/30 absolute bottom-1/3"></div>
                            <div className="h-full w-[1px] bg-black/30 absolute left-1/3"></div>
                            <div className="h-full w-[1px] bg-black/30 absolute right-1/3"></div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            <Wifi className="w-6 h-6 text-white/70 rotate-90 mb-1" />
                            <span className="text-[9px] font-mono text-white/80 uppercase tracking-widest">Contactless</span>
                        </div>
                    </div>
                    
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
                    <h2 className="text-4xl md:text-5xl font-mono font-bold text-white tracking-tighter flex items-baseline gap-2 drop-shadow-lg">
                        <span className="text-2xl md:text-xl opacity-80">KES</span> 24,500
                    </h2>
                </div>

                {/* Middle: Graph */}
                <div className="relative h-16 w-full opacity-80 my-auto">
                     <svg viewBox="0 0 100 20" className="w-full h-full stroke-white fill-none stroke-[2px] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                         <path d="M0 15 Q 20 5, 40 12 T 80 5 T 100 10" />
                     </svg>
                </div>

                {/* Bottom: Identity */}
                <div className="relative z-10 pt-6 border-t border-white/20">
                     <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest mb-1">Card Holder</p>
                            <p className="text-white font-heading font-bold tracking-wide text-lg text-shadow-sm">ALEX SMITH</p>
                        </div>
                        <div className="text-white/80">
                             <CreditCard className="w-8 h-8" />
                        </div>
                     </div>
                </div>
                {/* Glow */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FF5500]/20 blur-[80px] rounded-full pointer-events-none" />
            </div>
        </motion.div>
    );
};


export default HoloWallet