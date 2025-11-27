import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Plus, MoreHorizontal, 
  Wallet, Bell, CreditCard, Send, ChevronDown, Clock, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ActionModal from '../components/ActionModal';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api.get('/api/finance/me/')
       .then(res => setData(res.data))
       .catch(console.error)
       .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      try {
          const endpoint = modalType === 'deposit' ? '/api/finance/deposit/' : '/api/finance/withdraw/';
          await api.post(endpoint, { amount });
          setModalType(null);
          setAmount('');
          fetchData(); 
      } catch (err) {
          alert("Transaction failed.");
      } finally {
          setProcessing(false);
      }
  };

  if (loading || !data) return <div className="min-h-screen bg-black"></div>;

  // Determine Label based on actual data
  const walletLabel = data.wallet_type === 'ORGANIZER' ? 'Business Wallet' : 'Personal Wallet';

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:px-8 max-w-5xl mx-auto font-sans animate-in fade-in duration-500 text-white">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white font-bold">
                    {user?.username?.[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Overview</p>
                    <h2 className="text-lg font-bold text-white">{user?.username}</h2>
                </div>
            </div>
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#FF5500] hover:border-[#FF5500]/30 transition-colors">
                <Bell className="w-5 h-5" />
            </button>
        </header>

        {/* --- TITLE & ACTIVE WALLET --- */}
        <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-heading font-bold text-white">Dashboard</h1>
            
            {/* Dynamic Label (Only shows what you have) */}
            <div className="px-4 py-2 bg-[#FF5500]/10 border border-[#FF5500]/20 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5500] shadow-[0_0_10px_#FF5500]" />
                <span className="text-xs font-bold text-[#FF5500] uppercase tracking-wide">
                    {walletLabel}
                </span>
            </div>
        </div>

        {/* --- THE HERO CARD (Amber Obsidian) --- */}
        <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0A0A0A] shadow-2xl group">
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF5500]/10 via-[#0A0A0A] to-[#0A0A0A]" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FF5500]/10 blur-[80px] rounded-full pointer-events-none" />
            
            {/* Card Content */}
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                
                {/* Balance */}
                <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        Available Funds
                        {data.pending > 0 && (
                            <span className="flex items-center gap-1 text-[9px] text-white bg-white/10 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> Pending: {Number(data.pending).toLocaleString()}
                            </span>
                        )}
                    </p>
                    <h1 className="text-6xl font-mono font-bold text-white tracking-tighter">
                        <span className="text-2xl text-zinc-600 mr-3 align-top">{data.currency}</span>
                        {Number(data.balance).toLocaleString()}
                    </h1>
                </div>

                {/* Internal Actions */}
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setModalType('deposit')}
                        className="flex-1 md:flex-none px-8 py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(255,85,0,0.3)] hover:shadow-[0_0_40px_rgba(255,85,0,0.5)] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Deposit
                    </button>
                    <button 
                        onClick={() => setModalType('withdraw')}
                        className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowUpRight className="w-5 h-5" /> Send
                    </button>
                </div>
            </div>
        </div>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-4 gap-4 my-10">
            <ActionTile icon={ArrowDownLeft} label="Request" />
            <ActionTile icon={CreditCard} label="Cards" />
            <ActionTile icon={ShieldCheck} label="Vault" />
            <ActionTile icon={MoreHorizontal} label="More" />
        </div>

        {/* --- TRANSACTION LIST --- */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                <button className="text-xs font-bold text-[#FF5500] hover:text-white transition-colors">View All</button>
            </div>
            
            <div className="divide-y divide-white/5">
                {data.history.map((tx: any) => (
                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                tx.amount > 0 ? 'bg-[#FF5500]/10 text-[#FF5500]' : 'bg-white/5 text-zinc-400 group-hover:text-white'
                            }`}>
                                {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm group-hover:text-[#FF5500] transition-colors">
                                    {tx.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-zinc-500 font-mono mt-1 opacity-60">{tx.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`font-mono font-bold text-lg block ${
                                tx.amount > 0 ? 'text-[#FF5500]' : 'text-white'
                            }`}>
                                {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-zinc-600">{tx.status}</span>
                        </div>
                    </div>
                ))}
                
                {data.history.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                            <Clock className="w-8 h-8" />
                        </div>
                        <p className="text-zinc-500">No transactions yet.</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- MODAL --- */}
        <ActionModal
            isOpen={!!modalType}
            onClose={() => setModalType(null)}
            title={modalType === 'deposit' ? 'Add Money' : 'Withdraw Funds'}
            actionLabel={modalType === 'deposit' ? 'Pay Now' : 'Confirm Withdrawal'}
            onSubmit={(e) => { e.preventDefault(); handleTransaction(e); }}
        >
             <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount (KES)</label>
                <input 
                    type="number" autoFocus
                    className="w-full bg-[#151515] border border-[#333] rounded-xl p-5 text-white text-3xl font-mono focus:border-[#FF5500] outline-none transition-colors placeholder:text-zinc-800"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
             </div>
        </ActionModal>

    </div>
  );
};

const ActionTile = ({ icon: Icon, label }: any) => (
    <button className="flex flex-col items-center gap-3 group">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#0A0A0A] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:border-[#FF5500]/50 group-hover:text-white transition-all shadow-lg group-hover:shadow-[0_0_20px_rgba(255,85,0,0.15)]">
            <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-zinc-500 group-hover:text-white transition-colors">{label}</span>
    </button>
);

export default DashboardPage;