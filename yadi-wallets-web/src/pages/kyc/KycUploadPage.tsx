import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Shield, Loader2, Check, ScanLine, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// --- CUSTOM INPUT COMPONENT (Amber Focus) ---
const VaultInput = ({ label, value, onChange, placeholder }: any) => (
    <div className="group">
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 group-focus-within:text-[#FF5500] transition-colors">
            {label}
        </label>
        <input 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-4 text-white font-medium placeholder:text-zinc-700 focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] outline-none transition-all" 
        />
    </div>
);

const KycUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [idNumber, setIdNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [files, setFiles] = useState<{front: File | null, back: File | null}>({ front: null, back: null });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
      if (!user) navigate('/login');
      if (user?.is_kyc_verified) setSubmitted(true); // Already verified? Show success state.
  }, [user, navigate]);

  const handleFile = (side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) setFiles({ ...files, [side]: e.target.files[0] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!files.front || !files.back) return alert("Please upload both ID sides.");
      
      setLoading(true);
      const formData = new FormData();
      formData.append('national_id_number', idNumber);
      formData.append('kra_pin', kraPin);
      formData.append('id_front_image', files.front);
      formData.append('id_back_image', files.back);

      try {
          await api.patch('/api/users/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
          setSubmitted(true);
      } catch (err) {
          alert("Upload failed. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  if (submitted) return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-[#FF5500]/10 rounded-full flex items-center justify-center text-[#FF5500] mb-6 border border-[#FF5500]/20 shadow-[0_0_40px_rgba(255,85,0,0.2)]">
              <Shield className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-white mb-2">Verification Pending</h2>
          <p className="text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
              Your documents have been encrypted and sent to our compliance team. We will notify you once your vault is unlocked.
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold border border-white/10 transition-colors flex items-center gap-2"
          >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
      </div>
  );

  return (
    <div className="py-8 max-w-4xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* LEFT: Context */}
            <div className="md:col-span-4 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/20 text-[#FF5500] text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse" /> Compliance
                </div>
                
                <h1 className="text-4xl font-heading font-bold text-white leading-tight">
                    Identity <br/>
                    <span className="text-zinc-600">Protocol.</span>
                </h1>
                
                <p className="text-zinc-400 text-sm leading-relaxed">
                    To comply with financial regulations (AML/KYC), we require a government-issued ID to enable withdrawals.
                </p>

                <div className="glass-card p-6 mt-8 border-white/5 bg-white/5">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-4 text-sm">
                        <ScanLine className="w-4 h-4 text-[#FF5500]" /> Requirements
                    </h4>
                    <ul className="space-y-3 text-xs text-zinc-400">
                        <li className="flex gap-3"><Check className="w-3 h-3 text-[#FF5500] shrink-0" /> Valid National ID or Passport</li>
                        <li className="flex gap-3"><Check className="w-3 h-3 text-[#FF5500] shrink-0" /> All 4 corners visible</li>
                        <li className="flex gap-3"><Check className="w-3 h-3 text-[#FF5500] shrink-0" /> No glare or shadows</li>
                    </ul>
                </div>
            </div>

            {/* RIGHT: The Obsidian Form */}
            <div className="md:col-span-8">
                <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10 space-y-8 bg-[#050505]/80 border-white/10 shadow-2xl relative overflow-hidden">
                    
                    {/* Top Amber Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF5500] to-transparent opacity-50" />

                    <div className="grid md:grid-cols-2 gap-6">
                        <VaultInput label="National ID Number" placeholder="12345678" value={idNumber} onChange={(e:any) => setIdNumber(e.target.value)} />
                        <VaultInput label="KRA PIN" placeholder="A00..." value={kraPin} onChange={(e:any) => setKraPin(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Document Scans</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['front', 'back'].map((side) => (
                                <div key={side} className="relative group">
                                    <input type="file" id={`file-${side}`} className="hidden" onChange={(e) => handleFile(side as any, e)} />
                                    
                                    <label htmlFor={`file-${side}`} className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                                        files[side as 'front'|'back'] 
                                        ? 'bg-[#FF5500]/5 border-[#FF5500] text-[#FF5500]' 
                                        : 'bg-[#0F0F0F] border-white/10 text-zinc-500 hover:border-white/30 hover:text-white hover:bg-white/5'
                                    }`}>
                                        {files[side as 'front'|'back'] ? (
                                            <>
                                                <div className="w-10 h-10 bg-[#FF5500] rounded-full flex items-center justify-center text-black mb-2 shadow-[0_0_20px_rgba(255,85,0,0.4)]">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Attached</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{side} Side</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        disabled={loading} 
                        className="btn-amber w-full py-4 text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Submit for Review"}
                    </button>

                </form>
            </div>
        </div>
    </div>
  );
};

export default KycUploadPage;