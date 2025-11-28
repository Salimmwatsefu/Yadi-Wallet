import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, ShieldCheck, Sparkles, CreditCard, Wifi } from 'lucide-react';
import LandingNav from '../components/LandingNav';
import HoloWallet from '../components/HolloWallet';
import Logo from '../components/Logo';


const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-[#FF5500] selection:text-white">
        
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#FF5500]/5 blur-[150px] rounded-full pointer-events-none" />
        
        {/* --- TOP HEADER --- */}
        <nav className="flex justify-between items-center px-6 py-8 md:px-12 max-w-7xl mx-auto w-full relative z-20">
            
            {/* LOGO LOCKUP: "Yadi Wallet by Yadi" */}
            <Logo />
            
            {/* AUTH BUTTONS: "Get Started" is visible on Mobile */}
            <div className="flex items-center gap-4 md:gap-6">
                <button 
                    onClick={() => navigate('/login')} 
                    className="hidden md:block text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                    Log In
                </button>
                <button 
                    onClick={() => navigate('/register')} 
                    className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all shadow-lg"
                >
                    Get Started
                </button>
            </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <main className="flex-1 flex flex-col md:flex-row items-center px-6 md:px-12 relative z-10 pb-32 max-w-7xl mx-auto w-full gap-16">
            
            {/* LEFT: Simple, Human Copy */}
            <div className="flex-1 text-center md:text-left pt-12 md:pt-0">
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md cursor-default"
                >
                    <Sparkles className="w-3 h-3 text-[#FF5500]" />
                    <span className="text-xs font-bold tracking-widest text-zinc-300 uppercase">
                        Simple. Fast. Secure.
                    </span>
                </motion.div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-[1.05] mb-8 tracking-tighter text-white">
                    Your Money, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5500] to-[#FF9100]">
                        Simplified.
                    </span>
                </h1>
                
                <p className="text-lg text-zinc-400 mb-10 max-w-md leading-relaxed mx-auto md:mx-0 font-medium">
                    The easiest way to save, spend, and manage your cash. Whether you are organizing events or saving for a goal, Yadi puts you in control.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button 
                        onClick={() => navigate('/login')}
                        className="bg-[#FF5500] text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#FF6D00] transition-colors shadow-[0_10px_30px_-10px_rgba(255,85,0,0.5)] hover:-translate-y-1"
                    >
                        Get Started <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* RIGHT: The "Consumer App" Visual */}
            <div className="flex-1 w-full h-[500px] flex items-center justify-center relative perspective-1000 mt-10 md:mt-0">
                 <HoloWallet />
            </div>
            
        </main>

        {/* --- NEW NAVIGATION COMPONENT --- */}
        <LandingNav />

    </div>
  );
};

// --- VISUAL: The Glass Wallet Card ---

<HoloWallet />


export default HomePage;