import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight, AlertCircle, Wallet, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import Logo from '../../components/Logo';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
      if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // --- HANDLERS ---
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
            // FIX: Pass only token, backend adapter handles the rest
            await loginWithGoogle(tokenResponse.access_token);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError('Google Sign-In failed.');
            setLoading(false);
        }
    },
    onError: () => {
        setError('Google Sign-In failed.');
        setLoading(false);
    }
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
          await login({ username: email, email, password });
          navigate('/dashboard', { replace: true });
      } catch (err: any) {
          setError('Invalid email or password.');
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden selection:bg-[#FF5500] selection:text-white">
       
       {/* --- LEFT SIDE: THE FORM --- */}
       <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-20 relative z-20">
           
           <div className="max-w-md mx-auto w-full">
               {/* Header */}
               <div className="mb-10">
                  <Logo />

                   <h2 className="text-4xl font-heading font-bold text-white mb-2">Welcome back</h2>
                   <p className="text-zinc-500 text-lg">Access your secure digital vault.</p>
               </div>

               {/* ERROR BANNER */}
               {error && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
                       <AlertCircle className="w-5 h-5" /> {error}
                   </div>
               )}

               {/* 1. GOOGLE LOGIN (Top Priority) */}
               <button 
                 onClick={() => handleGoogleLogin()}
                 className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold transition-all flex items-center justify-center gap-3 mb-8 shadow-[0_0_25px_rgba(255,255,255,0.1)] group active:scale-[0.98]"
               >
                 <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                 <span>Continue with Google</span>
               </button>

               <div className="flex items-center mb-8">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="px-4 text-xs text-zinc-600 uppercase font-bold tracking-widest">Or sign in with email</span>
                  <div className="flex-1 border-t border-white/10"></div>
               </div>

               {/* 2. EMAIL FORM */}
               <form onSubmit={handleEmailLogin} className="space-y-5">
                   <div className="group">
                       <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-[#FF5500] transition-colors">Email</label>
                       <div className="relative">
                           <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="email" required
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="you@example.com"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                           />
                       </div>
                   </div>

                   <div className="group">
                       <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-[#FF5500] transition-colors">Password</label>
                       <div className="relative">
                           <Lock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="password" required
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="••••••••"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                           />
                       </div>
                   </div>

                   <div className="flex justify-end">
                       <Link to="/forgot-password" className="text-xs font-bold text-zinc-500 hover:text-[#FF5500] transition-colors">
                           Forgot Password?
                       </Link>
                   </div>

                   <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,85,0,0.3)] hover:shadow-[0_0_40px_rgba(255,85,0,0.5)] flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                   </button>
               </form>

               <div className="mt-10 text-center">
                   <p className="text-zinc-500">
                       Don't have an account?{' '}
                       <Link to="/register" className="text-white font-bold hover:text-[#FF5500] transition-colors">
                           Create Account
                       </Link>
                   </p>
               </div>
           </div>
       </div>

       {/* --- RIGHT SIDE: BRAND VISUAL (Desktop Only) --- */}
       <div className="hidden lg:flex w-1/2 relative bg-[#050505] items-center justify-center overflow-hidden border-l border-white/5">
           
           {/* Ambient Background */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0c00_0%,#000000_70%)]" />
           <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#FF5500]/10 blur-[150px] rounded-full animate-pulse" />
           
           {/* 3D Glass Card Visual (Consistent with Home Page) */}
           <motion.div 
               className="relative w-[380px] h-[600px] z-10"
               initial={{ rotateY: -15, rotateX: 5 }}
               animate={{ 
                   rotateY: [-15, -5, -15],
                   rotateX: [5, 0, 5],
                   y: [0, -20, 0] 
               }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               style={{ transformStyle: 'preserve-3d' }}
           >
                {/* Card Back */}
                <div className="absolute inset-0 bg-[#111] rounded-[3rem] border border-white/5 opacity-50 translate-z-[-20px] scale-95 translate-y-[20px]"></div>

                {/* Card Front */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl p-10 flex flex-col justify-between overflow-hidden">
                    
                    {/* Top Section */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#B8860B] border border-[#FDB931] relative overflow-hidden flex items-center justify-center shadow-inner opacity-90">
                                <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            </div>
                            <Wifi className="w-8 h-8 text-white/30 rotate-90" />
                        </div>
                        
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Encrypted Vault</p>
                        <h2 className="text-5xl font-mono font-bold text-white tracking-tight">
                            **** 8829
                        </h2>
                    </div>

                    {/* Bottom Section */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/5">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Security Active</p>
                                <p className="text-emerald-500 text-xs">256-bit Protection</p>
                            </div>
                        </div>
                        
                        <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Member Since</p>
                                <p className="text-white font-heading font-bold tracking-wide text-lg">2025</p>
                            </div>
                            <div className="text-white/50">
                                <Sparkles className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
           </motion.div>

       </div>

    </div>
  );
};

export default LoginPage;