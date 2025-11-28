import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Logo from '../../components/Logo';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
        setStatus('error');
        return;
    }

    // Call backend to verify token
    api.post('/api/users/verify/confirm/', { token })
       .then(() => {
           setStatus('success');
           // Auto redirect after 2 seconds
           setTimeout(() => navigate('/dashboard'), 2000);
       })
       .catch((err) => {
           console.error(err);
           setStatus('error');
       });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
        <div className="mb-10">
            <Logo />
        </div>

        {status === 'verifying' && (
            <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="w-12 h-12 text-[#FF5500] animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white">Verifying ...</h2>
            </div>
        )}

        {status === 'success' && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-white">Verified!</h2>
                <p className="text-zinc-500 mt-2">Redirecting to your dashboard...</p>
            </div>
        )}

        {status === 'error' && (
            <div className="flex flex-col items-center">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                <p className="text-zinc-500 mt-2 mb-6">Invalid code</p>
                <button 
                    onClick={() => navigate('/login')} 
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors"
                >
                    Back to Login
                </button>
            </div>
        )}
    </div>
  );
};

export default VerifyEmailPage;