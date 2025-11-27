import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2, ArrowRight, Wallet, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import Logo from '../../components/Logo';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- HANDLERS ---

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
            // FIX: Single argument (Token only)
            await loginWithGoogle(tokenResponse.access_token);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError('Google Sign-Up failed.');
            setLoading(false);
        }
    },
    onError: () => setError('Google Sign-Up failed.'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
    }
    setLoading(true);
    setError('');

    try {
        // FIX: No 'role' passed. Backend adapter defaults to CUSTOMER wallet.
        await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            password1: formData.password,
            password2: formData.confirmPassword,
        });
        navigate('/dashboard', { replace: true });
    } catch (err: any) {
        console.error(err);
        if (err.response?.data?.email) setError("Email already exists.");
        else if (err.response?.data?.username) setError("Username already taken.");
        else setError('Registration failed. Please check your details.');
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden selection:bg-[#FF5500] selection:text-white">
       
       {/* --- LEFT: THE FORM --- */}
       <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-20 relative z-20">
           
           <div className="max-w-md mx-auto w-full">
               {/* Header */}
               <div className="mb-8">
                   <Logo />
                   
                   <h1 className="text-4xl font-heading font-bold text-white mb-2">Create Account</h1>
                   <p className="text-zinc-500 text-lg">Your secure digital wallet awaits.</p>
               </div>

               {/* GOOGLE BUTTON */}
               <button 
                 onClick={() => handleGoogleLogin()}
                 className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold transition-all flex items-center justify-center gap-3 mb-8 shadow-[0_0_25px_rgba(255,255,255,0.1)] group active:scale-[0.98]"
               >
                 <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                 <span>Sign up with Google</span>
               </button>

               <div className="flex items-center mb-8">
                  <div className="flex-1 border-t border-white/10"></div>
                  <span className="px-4 text-xs text-zinc-600 uppercase font-bold tracking-widest">Or register with email</span>
                  <div className="flex-1 border-t border-white/10"></div>
               </div>

               {error && (
                   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold">
                       <AlertCircle className="w-5 h-5" /> {error}
                   </div>
               )}

               {/* FORM */}
               <form onSubmit={handleSubmit} className="space-y-4">
                   
                   <div className="group">
                       <div className="relative">
                           <User className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="text" required 
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="Username" 
                               value={formData.username} 
                               onChange={e => setFormData({...formData, username: e.target.value})} 
                           />
                       </div>
                   </div>
                   
                   <div className="group">
                       <div className="relative">
                           <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="email" required 
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="Email Address" 
                               value={formData.email} 
                               onChange={e => setFormData({...formData, email: e.target.value})} 
                           />
                       </div>
                   </div>

                   <div className="group">
                       <div className="relative">
                           <Lock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="password" required 
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="Password" 
                               value={formData.password} 
                               onChange={e => setFormData({...formData, password: e.target.value})} 
                           />
                       </div>
                   </div>

                   <div className="group">
                       <div className="relative">
                           <Lock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-[#FF5500] transition-colors" />
                           <input 
                               type="password" required 
                               className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 pl-12 text-white placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all font-medium"
                               placeholder="Confirm Password" 
                               value={formData.confirmPassword} 
                               onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                           />
                       </div>
                   </div>

                   <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(255,85,0,0.3)] hover:shadow-[0_0_40px_rgba(255,85,0,0.5)] flex items-center justify-center gap-2 mt-6 active:scale-[0.98] disabled:opacity-50"
                   >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Wallet'}
                   </button>
               </form>

               <div className="mt-10 text-center">
                   <p className="text-zinc-500">
                       Already have an account?{' '}
                       <Link to="/login" className="text-white font-bold hover:text-[#FF5500] transition-colors">
                           Log In
                       </Link>
                   </p>
               </div>
           </div>
       </div>

       {/* --- RIGHT: BRAND VISUAL (Amber Theme) --- */}
       <div className="hidden lg:flex w-1/2 relative bg-[#050505] items-center justify-center overflow-hidden border-l border-white/5">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0c00_0%,#000000_70%)]" />
           
           <div className="relative z-10 text-center p-10">
               <h2 className="text-5xl font-heading font-bold text-white mb-6 leading-tight">
                   Your Money. <br/>
                   <span className="text-[#FF5500]">Your Rules.</span>
               </h2>
               <p className="text-zinc-500 text-xl max-w-md mx-auto">
                   Zero monthly fees. Instant transfers. The financial OS you've been waiting for.
               </p>
           </div>
       </div>

    </div>
  );
};

export default RegisterPage;