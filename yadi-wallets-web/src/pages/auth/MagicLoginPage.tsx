import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Logo from '../../components/Logo';

const MagicLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }

    api.post('/api/users/auth/exchange/', { token })
       .then(() => {
           setStatus('success');
           setTimeout(() => navigate('/kyc'), 1500);
       })
       .catch(() => setStatus('error'));
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div>

            <Logo />

        </div>
        

        <div className="text-center">
            {status === 'verifying' && (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-20 h-20 rounded-full border-4 border-[#FF5500]/30 border-t-[#FF5500] animate-spin mb-8"></div>
                    <h2 className="text-2xl font-heading font-bold text-white">Verifying Identity</h2>
                    <p className="text-zinc-500 mt-2">Handshaking with TicketSafi...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-[#FF5500]/10 rounded-full flex items-center justify-center text-[#FF5500] mb-6 border border-[#FF5500]/20">
                        <ShieldCheck className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-white">Access Granted</h2>
                    <p className="text-zinc-500 mt-2">Welcome to the Vault.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                    <p className="text-zinc-500 mt-2 mb-6">This link has expired or is invalid.</p>
                    <button onClick={() => window.close()} className="px-6 py-2 bg-white/10 rounded-lg text-white">Close</button>
                </div>
            )}
        </div>
    </div>
  );
};

export default MagicLoginPage;