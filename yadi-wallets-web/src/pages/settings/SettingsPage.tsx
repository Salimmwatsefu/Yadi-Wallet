import React from 'react';
import { ArrowLeft, Moon, Sun, Shield, Smartphone, ChevronRight, User, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen p-6 md:p-12 flex justify-center pb-32"> {/* Added pb-32 for bottom nav clearance */}
        <div className="w-full max-w-2xl">
            
            {/* Header */}
            <header className="flex items-center mb-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mr-4 p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Settings</h1>
                    <p className="text-zinc-500 text-sm">Manage your account & preferences</p>
                </div>
            </header>

            <div className="space-y-8">
                
                {/* Section: Profile (New) */}
                <section>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-2">Profile</h3>
                    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-sm p-6 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5500] to-[#FF8C00] border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-inner shrink-0">
                             {user?.username?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-2">
                             <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                             <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                                     <Mail className="w-4 h-4" /> {user?.email}
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-zinc-400">
                                     <Phone className="w-4 h-4" /> {user?.phone_number || 'No phone linked'}
                                 </div>
                             </div>
                        </div>
                        <button className="text-xs font-bold text-[#FF5500] hover:text-white transition-colors">Edit</button>
                    </div>
                </section>

                {/* Section: Appearance */}
                <section>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-2">Interface</h3>
                    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
                        
                        <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors" onClick={toggleTheme}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-white font-bold">Appearance</p>
                                    <p className="text-zinc-500 text-sm">
                                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative ${theme === 'dark' ? 'bg-[#FF5500]' : 'bg-zinc-700'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>

                    </div>
                </section>

                {/* Section: Security */}
                <section>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-2">Security</h3>
                    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-sm divide-y divide-white/5">
                        
                        <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/kyc')}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Verification (KYC)</p>
                                    <p className="text-zinc-500 text-sm">
                                        {user?.is_kyc_verified ? 'Verified' : 'Action Required'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                        </div>

                        <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-not-allowed opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Linked Devices</p>
                                    <p className="text-zinc-500 text-sm">Current Session</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                        </div>

                    </div>
                </section>

            </div>
        </div>
    </div>
  );
};

export default SettingsPage;