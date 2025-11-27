import React, { useState } from 'react';
import { Menu, X, Home, Building2, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
      { label: 'Home', icon: Home, path: '/' },
      { label: 'Company', icon: Building2, path: '#' },
      { label: 'Careers', icon: Users, path: '#' },
  ];

  return (
    <>
        {/* --- DESKTOP: Floating Glass Pill --- */}
        <div className="hidden md:flex fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
                {menuItems.map((item) => (
                    <button 
                        key={item.label}
                        className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                            item.label === 'Home' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}
            </div>
        </div>

        {/* --- MOBILE: Amber Floating Button --- */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button 
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 bg-[#FF5500] rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,85,0,0.4)] hover:scale-105 transition-transform active:scale-95"
            >
                <Menu className="w-8 h-8" />
            </button>
        </div>

        {/* --- MOBILE: Full Screen Overlay --- */}
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 bg-black z-[60] flex flex-col p-8 md:hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-12">
                        <span className="font-heading font-bold text-2xl text-white">Menu</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex-1 flex flex-col gap-6">
                        {menuItems.map((item, idx) => (
                            <motion.button
                                key={item.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-4xl font-heading font-bold text-white/50 hover:text-white text-left flex items-center gap-4 transition-colors"
                            >
                                <span>{item.label}</span>
                                <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="space-y-4">
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-5 rounded-2xl bg-[#1A1A1A] text-white font-bold text-lg border border-white/10"
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-5 rounded-2xl bg-[#FF5500] text-white font-bold text-lg shadow-lg"
                        >
                            Get Started
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};

export default LandingNav;