import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Plus, 
  Bell, Clock, ShieldCheck, Lock, Wallet, Send, User, Users, AlertTriangle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ActionModal from '../components/ActionModal';
import TransferModal from '../components/TransferModal';
import Toast from '../components/Toast'; // Imported Toast
import { useNavigate } from 'react-router-dom';

interface WalletType {
    id: string;
    label: string;
    balance: string;
    currency: string;
    is_frozen: boolean;
    is_primary: boolean;
    wallet_type: string;
}

interface HistoryItem {
    id: string;
    type: string;
    amount: number;
    status: string;
    date: string;
    wallet_label?: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [businessWallets, setBusinessWallets] = useState<WalletType[]>([]);
  const [personalWallets, setPersonalWallets] = useState<WalletType[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeWallet, setActiveWallet] = useState<WalletType | null>(null);
  const [modalType, setModalType] = useState<'withdraw' | 'create' | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  
  // Error / Notification State
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Withdrawal Form State
  const [withdrawMode, setWithdrawMode] = useState<'self' | 'other'>('self');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  
  // Create Wallet State
  const [newWalletName, setNewWalletName] = useState('');
  
  const [processing, setProcessing] = useState(false);

  // --- TOAST HELPER ---
  const showToast = (msg: string, type: 'success' | 'error') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 4000); // Auto hide
  };

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
        const walletRes = await api.get('/api/finance/wallets/');
        setBusinessWallets(walletRes.data.business_wallets);
        setPersonalWallets(walletRes.data.personal_wallets);


        const historyRes = await api.get('/api/finance/history/'); 
        const historyData = historyRes.data.results ? historyRes.data.results : historyRes.data;
        
        if (Array.isArray(historyData)) {
            setHistory(historyData);
        } else {
            console.error("Unexpected history data format:", historyData);
            setHistory([]); 
        }

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. HANDLERS ---

  const handleCreateWallet = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      setError(null);
      try {
          await api.post('/api/finance/wallets/', { label: newWalletName });
          setModalType(null);
          setNewWalletName('');
          showToast("New wallet created successfully!", "success");
          fetchData();
      } catch (err: any) { 
          const msg = err.response?.data?.error || "Failed to create wallet";
          showToast(msg, "error");
      } 
      finally { setProcessing(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeWallet) return;
      setProcessing(true);
      setError(null);
      
      const finalRecipient = withdrawMode === 'self' ? user?.phone_number : recipient;

      try {
          await api.post('/api/finance/withdraw/', { 
              amount, 
              source_wallet_id: activeWallet.id,
              recipient_phone: finalRecipient,
              save_beneficiary: saveBeneficiary 
          });
          setModalType(null);
          setAmount('');
          setRecipient('');
          showToast(`Success! Funds sent to ${finalRecipient}`, "success");
          fetchData();
      } catch (err: any) {
          const msg = err.response?.data?.error || "Transaction Failed";
          showToast(msg, "error");
      } finally { setProcessing(false); }
  };

  const handleTransfer = async (sourceId: string, destId: string, amount: string, recipientIdentifier?: string) => {
      try {
          setError(null);
          await api.post('/api/finance/transfer/', {
              source_wallet_id: sourceId,
              dest_wallet_id: destId, 
              recipient_identifier: recipientIdentifier,
              amount
          });
          fetchData();
          setShowTransfer(false); 
          showToast("Transfer completed successfully!", "success");
      } catch (err: any) {
          const msg = err.response?.data?.error || "Transfer failed";
          showToast(msg, "error");
          throw err; 
      }
  };

  // --- 3. COMPONENTS ---

  const WalletCard = ({ wallet, type }: { wallet: WalletType, type: 'business' | 'personal' }) => (
      <div className={`relative min-w-[320px] h-[210px] rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden group transition-all hover:-translate-y-1 ${
          type === 'business' 
            ? 'bg-[#111] border border-white/10 shadow-lg' 
            : 'bg-gradient-to-br from-[#FF5500] to-[#FF8C00] text-white shadow-[#FF5500]/20 shadow-xl border border-white/10'
      }`}>
          {/* Top Info */}
          <div className="flex justify-between items-start z-10">
              <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${type === 'business' ? 'text-zinc-500' : 'text-white/70'}`}>
                      {wallet.label}
                  </p>
                  {wallet.is_primary && <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-bold">MAIN</span>}
              </div>
              {type === 'business' ? <Lock className="w-5 h-5 text-zinc-600" /> : <Wallet className="w-5 h-5 text-white/80" />}
          </div>

          {/* Balance */}
          <div className="z-10">
              <h3 className="text-3xl font-mono font-bold tracking-tighter">
                  <span className="text-lg opacity-60 mr-1">{wallet.currency}</span>
                  {Number(wallet.balance).toLocaleString()}
              </h3>
          </div>

          {/* TWO DISTINCT BUTTONS */}
          <div className="flex gap-3 z-10 mt-2">
              {/* Button A: Inter-Account Transfer */}
              <button 
                  onClick={() => setShowTransfer(true)}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-colors ${
                      type === 'business' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-black/20 text-white hover:bg-black/30'
                  }`}
              >
                  <ArrowDownLeft size={16} /> Move Funds
              </button>

              {/* Button B: External Withdrawal */}
              <button 
                onClick={() => { setActiveWallet(wallet); setModalType('withdraw'); }}
                className={`flex-1 py-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 ${
                    type === 'business' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-white text-[#FF5500] hover:bg-zinc-100'
                }`}
              >
                  <Send size={16} /> Send Money
              </button>
          </div>
      </div>
  );

  const AddWalletCard = () => (
      <button 
        onClick={() => setModalType('create')}
        className="min-w-[80px] h-[210px] rounded-[2rem] border-2 border-dashed border-white/40 flex flex-col items-center  gap-3 hover:border-[#FF5500]/50 hover:bg-[#FF5500]/5 transition-all group"
      >
          <div className="w-10 h-10 rounded-full bg-white/5 flex mt-10 justify-center mb-3 text-zinc-500 group-hover:text-[#FF5500] transition-colors">
              <Plus size={20} />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase rotate-90 whitespace-nowrap group-hover:text-white">Create Wallet</span>
      </button>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Clock className="animate-spin text-[#FF5500]" /></div>;

  return (
    <div className="min-h-screen pb-32 pt-6 font-sans text-white animate-in fade-in">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-heading font-bold">My Wallets</h1>
                <p className="text-zinc-500 text-sm">Your wallet, your world, Hello {user.username}</p>
            </div>
        </header>

        {/* --- KYC WARNING BANNER --- */}
        {!user?.is_kyc_verified && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-500">Verification Required</h4>
                        <p className="text-xs text-amber-200/60">Withdrawals are restricted until you verify your identity.</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/kyc')}
                    className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
                >
                    Verify Now
                </button>
            </motion.div>
        )}

        {/* --- ERROR BANNER (Persistent Errors) --- */}
        <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
                >
                    <XCircle className="w-5 h-5 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:text-white"><Plus className="rotate-45" /></button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- TOAST CONTAINER (Transient Notifications) --- */}
        <AnimatePresence>
            {notification && (
                <Toast 
                    message={notification.msg} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}
        </AnimatePresence>

        <div className="space-y-10">
            {/* 1. BUSINESS SECTION */}
            {businessWallets.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Business Assets</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {businessWallets.map(w => <WalletCard key={w.id} wallet={w} type="business" />)}
                    </div>
                </section>
            )}

            {/* 2. PERSONAL SECTION */}
            <section>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Wallet className="w-4 h-4 text-[#FF5500]" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Personal & Goals</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    <AddWalletCard />
                    {personalWallets.map(w => <WalletCard key={w.id} wallet={w} type="personal" />)}
                    
                </div>
            </section>

            {/* 3. HISTORY */}
            <section>
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                    {history.map((tx: any) => (
                        <div key={tx.id} className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-zinc-400'
                                }`}>
                                    {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{tx.type.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-zinc-500">{tx.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                                    {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                                </span>
                                <span className="block text-[9px] font-bold uppercase text-zinc-600">{tx.status}</span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="p-8 text-center text-zinc-500 text-sm">No activity yet.</div>}
                </div>
            </section>
        </div>

        {/* --- MODALS --- */}

        {/* 1. CREATE WALLET */}
        <ActionModal 
            isOpen={modalType === 'create'} 
            onClose={() => setModalType(null)}
            title="New Vault"
            actionLabel="Create"
            isLoading={processing}
            onSubmit={handleCreateWallet}
        >
            <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Name</label>
                <input 
                    autoFocus
                    value={newWalletName}
                    onChange={e => setNewWalletName(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-4 text-white focus:border-[#FF5500] outline-none"
                    placeholder="e.g. Emergency Fund"
                />
            </div>
        </ActionModal>

        {/* 2. WITHDRAW / SEND (Split Logic) */}
        <ActionModal
            isOpen={modalType === 'withdraw'}
            onClose={() => { setModalType(null); setRecipient(''); setWithdrawMode('self'); }}
            title={activeWallet?.wallet_type === 'ORGANIZER' ? 'Payout Request' : 'Send Money'}
            actionLabel="Confirm & Send"
            isLoading={processing}
            onSubmit={handleWithdraw}
            footer={
                <div className="flex justify-between text-xs opacity-60">
                    <span>Includes Fees</span>
                    <span>~KES 15.00</span>
                </div>
            }
        >
            <div className="space-y-6">
                {/* A. RECIPIENT TOGGLE (Only for Personal Wallets) */}
                {activeWallet?.wallet_type !== 'ORGANIZER' && (
                    <div className="bg-[#121212] p-1 rounded-xl flex">
                        <button
                            type="button"
                            onClick={() => setWithdrawMode('self')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                withdrawMode === 'self' ? 'bg-[#FF5500] text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            <User size={14} /> To Self
                        </button>
                        <button
                            type="button"
                            onClick={() => setWithdrawMode('other')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                withdrawMode === 'other' ? 'bg-[#FF5500] text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            <Users size={14} /> To Others
                        </button>
                    </div>
                )}

                {/* B. RECIPIENT DISPLAY/INPUT */}
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipient</label>
                    
                    {withdrawMode === 'self' ? (
                        <div className="w-full bg-[#121212]/50 border border-white/5 rounded-xl p-4 flex justify-between items-center text-zinc-400 cursor-not-allowed">
                            <span>{user?.phone_number || 'No Phone Linked'}</span>
                            <Lock size={14} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input 
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-xl p-4 text-white focus:border-[#FF5500] outline-none"
                                placeholder="254 7..."
                                autoFocus
                            />
                            {/* Save Contact Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveBeneficiary ? 'bg-[#FF5500] border-[#FF5500]' : 'border-zinc-600'}`}>
                                    {saveBeneficiary && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={saveBeneficiary} onChange={() => setSaveBeneficiary(!saveBeneficiary)} />
                                <span className="text-xs text-zinc-500 group-hover:text-zinc-300">Save as regular beneficiary</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* C. AMOUNT */}
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">KES</span>
                        <input 
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-[#121212] border border-white/10 rounded-xl py-4 pl-12 text-2xl font-mono text-white focus:border-[#FF5500] outline-none"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </ActionModal>

        {/* 3. TRANSFER MODAL (Reused) */}
        <TransferModal 
            isOpen={showTransfer} 
            onClose={() => setShowTransfer(false)}
            businessWallets={businessWallets}
            personalWallets={personalWallets}
            onTransfer={handleTransfer}
        />

    </div>
  );
};

export default DashboardPage;