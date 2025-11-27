import React, { useState } from 'react';
import { X, ArrowRight, AlertTriangle, Loader2, Wallet as WalletIcon, User, Users, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Wallet {
    id: string;
    label: string;
    balance: string | number;
    currency: string;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessWallets: Wallet[];
    personalWallets: Wallet[];
    onTransfer: (sourceId: string, destId: string, amount: string, recipientIdentifier?: string) => Promise<void>;
}

const TransferModal: React.FC<TransferModalProps> = ({ 
    isOpen, onClose, businessWallets, personalWallets, onTransfer 
}) => {
    const [transferType, setTransferType] = useState<'internal' | 'p2p'>('internal');
    const [source, setSource] = useState<string>('');
    const [dest, setDest] = useState<string>('');
    const [recipientIdentifier, setRecipientIdentifier] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Flatten list for easy selection
    const allWallets = [...businessWallets, ...personalWallets];
    
    // Logic: Is the source a business wallet?
    const isBusinessSource = businessWallets.some(w => w.id === source);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !amount) return;
        if (transferType === 'internal' && !dest) return;
        if (transferType === 'p2p' && !recipientIdentifier) return;
        
        setLoading(true);
        try {
            await onTransfer(source, dest, amount, recipientIdentifier);
            onClose();
            setAmount('');
            setRecipientIdentifier('');
            setDest('');
        } catch (error) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md bg-[#09090B] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-heading font-bold text-white text-xl">Move Funds</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Transfer Type Toggle */}
                    <div className="bg-[#121212] p-1 rounded-xl flex mb-4">
                        <button
                            type="button"
                            onClick={() => setTransferType('internal')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                transferType === 'internal' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            <WalletIcon size={14} /> Between My Wallets
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransferType('p2p')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                transferType === 'p2p' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            <Users size={14} /> To Another User
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Source Wallet Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">From (Source)</label>
                            <select 
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#FF5500] outline-none appearance-none"
                            >
                                <option value="">Select Wallet...</option>
                                <optgroup label="Business (Requires Approval)">
                                    {businessWallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.label} ({Number(w.balance).toLocaleString()} {w.currency})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Personal (Instant)">
                                    {personalWallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.label} ({Number(w.balance).toLocaleString()} {w.currency})</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="flex justify-center">
                            <ArrowRight className="w-4 h-4 text-zinc-600 rotate-90 md:rotate-0" />
                        </div>

                        {/* Destination Field */}
                        {transferType === 'internal' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">To (Destination)</label>
                                <select 
                                    value={dest}
                                    onChange={(e) => setDest(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#FF5500] outline-none appearance-none"
                                >
                                    <option value="">Select Destination...</option>
                                    {allWallets.filter(w => w.id !== source).map(w => (
                                        <option key={w.id} value={w.id}>{w.label}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipient (Email or Phone)</label>
                                <input 
                                    type="text"
                                    value={recipientIdentifier}
                                    onChange={(e) => setRecipientIdentifier(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#FF5500] outline-none"
                                    placeholder="e.g. user@example.com or 2547..."
                                />
                                <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                                    <Info size={10} /> Funds will be sent to their main wallet.
                                </p>
                            </div>
                        )}

                        {/* Warning for Business Transfers */}
                        <AnimatePresence>
                            {isBusinessSource && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3"
                                >
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-200/80 leading-relaxed">
                                        <strong>Note:</strong> Transfers from Business Wallets require Admin Approval (approx. 24h) before funds are moved.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">KES</span>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-2xl font-mono text-white focus:border-[#FF5500] outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !source || !amount || (transferType === 'internal' ? !dest : !recipientIdentifier)}
                        className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Transfer'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TransferModal;