// ... existing code ...
// No major code changes needed here if we keep the "Manual OTP" option as fallback.
// Just updating the text to mention the link.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle, Smartphone, Mail, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const KycUploadPage = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
      if (!user) navigate('/login');
      if (user?.is_kyc_verified) setStep('success');
      if (user?.phone_number) setPhoneNumber(user.phone_number);
  }, [user, navigate]);

  // Step 1: Send OTP & Link
  const handleSendOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber) return;
      setLoading(true);
      setError('');
      try {
          await api.post('/api/users/verify/send-otp/', { phone_number: phoneNumber });
          setStep('otp');
      } catch (err: any) {
          setError(err.response?.data?.error || "Failed to send code. Try again.");
      } finally {
          setLoading(false);
      }
  };

  // Step 2: Confirm OTP (Manual Fallback)
  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otp) return;
      setLoading(true);
      setError('');
      try {
          await api.post('/api/users/verify/confirm/', { otp });
          await checkAuth(); 
          setStep('success');
      } catch (err: any) {
          setError(err.response?.data?.error || "Invalid code.");
      } finally {
          setLoading(false);
      }
  };

  if (step === 'success') return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">Account Verified</h2>
          <p className="text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
              Your identity has been confirmed. You now have full access to withdrawals and transfers.
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-full font-bold transition-colors flex items-center gap-2"
          >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
      </div>
  );

  return (
    <div className="py-12 max-w-lg mx-auto">
        <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500] text-[10px] font-bold uppercase tracking-wider mb-4">
                <Shield className="w-3 h-3" /> Security Check
            </div>
            <h1 className="text-3xl font-heading font-bold text-white">Verify Account</h1>
            <p className="text-zinc-500 mt-2">
                {step === 'input' ? 'Confirm your contact details to unlock features.' : `Check your email (${user?.email})`}
            </p>
        </div>

        <div className="glass-card p-8 bg-[#09090B] border border-white/10 relative overflow-hidden">
            <AnimatePresence mode="wait">
                
                {/* STEP 1: INPUT PHONE */}
                {step === 'input' && (
                    <motion.form 
                        key="input"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSendOtp} 
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mobile Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input 
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value)} 
                                    placeholder="0712 345 678"
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-4 pl-12 text-white font-medium placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all" 
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed">
                            <p>We will send a <strong>Magic Link</strong> and a code to <strong>{user?.email}</strong>.</p>
                        </div>

                        <button 
                            disabled={loading || !phoneNumber} 
                            className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Verification"}
                        </button>
                    </motion.form>
                )}

                {/* STEP 2: ENTER OTP (Fallback) */}
                {step === 'otp' && (
                    <motion.form 
                        key="otp"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerifyOtp} 
                        className="space-y-6"
                    >
                        <div className="text-center mb-4">
                            <p className="text-sm text-white font-bold">Email Sent!</p>
                            <p className="text-xs text-zinc-500 mt-1">Click the link in your email, or enter the code below.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Manual Code Entry</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value)} 
                                    placeholder="e.g. 123456"
                                    maxLength={6}
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-4 pl-12 text-white text-xl font-mono tracking-widest placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all" 
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                        <button 
                            disabled={loading || otp.length < 6} 
                            className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Code"}
                        </button>
                        
                        <button type="button" onClick={() => setStep('input')} className="w-full text-xs text-zinc-500 hover:text-white">
                            Wrong number? Go back
                        </button>
                    </motion.form>
                )}

            </AnimatePresence>
        </div>
    </div>
  );
};

export default KycUploadPage;