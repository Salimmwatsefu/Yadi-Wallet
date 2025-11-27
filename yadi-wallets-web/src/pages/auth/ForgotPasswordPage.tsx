import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../api/axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/password/reset/', { email });
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
       <div className="w-full max-w-md relative z-10">
           <Link to="/login" className="flex items-center text-zinc-400 hover:text-white mb-6 text-sm font-bold">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
           </Link>

           <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 shadow-2xl">
               <h1 className="text-2xl font-heading font-bold text-white mb-2">Reset Password</h1>
               <p className="text-zinc-500 mb-8 text-sm">Enter your email and we'll send you a reset link.</p>

               {success ? (
                   <div className="text-center py-8">
                       <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20">
                           <CheckCircle className="w-8 h-8" />
                       </div>
                       <h3 className="text-white font-bold">Check your email</h3>
                       <p className="text-zinc-400 text-sm mt-2">We have sent a password reset link to <span className="text-white">{email}</span></p>
                   </div>
               ) : (
                   <form onSubmit={handleSubmit} className="space-y-6">
                       {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                       
                       <div>
                           <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email</label>
                           <div className="relative">
                               <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-600" />
                               <input type="email" required className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 text-white focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                           </div>
                       </div>

                       <button disabled={loading} className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all">
                           {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Send Reset Link'}
                       </button>
                   </form>
               )}
           </div>
       </div>
    </div>
  );
};

export default ForgotPasswordPage;