import React from 'react';
import { ArrowLeft, Moon, Sun, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-6 md:p-12 flex justify-center">
        <div className="w-full max-w-2xl">
            
            {/* Header */}
            <header className="flex items-center mb-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mr-4 p-2 rounded-full hover:bg-surface-highlight text-text-muted hover:text-text-main transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-main">Settings</h1>
                    <p className="text-text-muted text-sm">Manage preferences and security</p>
                </div>
            </header>

            <div className="space-y-6">
                
                {/* Section: Appearance */}
                <section>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 ml-2">Interface</h3>
                    <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-sm">
                        
                        {/* Theme Toggle Row */}
                        <div className="p-5 flex items-center justify-between group cursor-pointer" onClick={toggleTheme}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-text-main font-bold">Appearance</p>
                                    <p className="text-text-muted text-sm">
                                        {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Custom Switch UI */}
                            <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                    </div>
                </section>

                {/* Section: Security (Placeholder for Future) */}
                <section>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 ml-2">Security</h3>
                    <div className="bg-surface-glass backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
                        
                        <div className="p-5 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors cursor-not-allowed opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-text-main font-bold">Two-Factor Auth</p>
                                    <p className="text-text-muted text-sm">Not configured</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </div>

                        <div className="p-5 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors cursor-not-allowed opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-text-main font-bold">Linked Devices</p>
                                    <p className="text-text-muted text-sm">Windows PC (Chrome)</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </div>

                    </div>
                </section>

            </div>
        </div>
    </div>
  );
};

export default SettingsPage;