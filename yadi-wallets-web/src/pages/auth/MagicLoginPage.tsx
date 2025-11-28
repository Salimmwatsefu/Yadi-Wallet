import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext'; // Import context to update user state

const MagicLoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); // Need this to sync context
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }

    api.post('/api/users/auth/exchange/', { token })
       .then(async () => {
           await checkAuth(); // Refresh auth context so ProtectedRoute works
           setStatus('success');
           // Redirect to KYC with a special flag
           setTimeout(() => {
               navigate('/kyc', { state: { fromMagicLink: true } });
           }, 1500);
       })
       .catch(() => setStatus('error'));
  }, [token, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
        <div className="mb-8"><Logo /></div>

        {status === 'verifying' && (
            <div className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-[#FF5500]/30 border-t-[#FF5500] animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-white">Securing Connection with Yadi Tickets</h2>
            </div>
        )}

        {status === 'success' && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-[#FF5500]/10 rounded-full flex items-center justify-center text-[#FF5500] mb-6 border border-[#FF5500]/20">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-white">Access Granted</h2>
                <p className="text-zinc-500 mt-2">Redirecting to verification...</p>
            </div>
        )}

        {status === 'error' && (
            <div className="flex flex-col items-center">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white">Link Expired</h2>
                <p className="text-zinc-500 mt-2">Please request a new link from the Ticket App.</p>
            </div>
        )}
    </div>
  );
};

export default MagicLoginPage;