import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  actionLabel: string;
  footer?: React.ReactNode; 
}

const ActionModal: React.FC<ActionModalProps> = ({ 
    isOpen, onClose, title, children, isLoading, onSubmit, actionLabel, footer 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Dark Blur Backdrop */}
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={onClose}
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md glass-card bg-[#050505] border border-white/10 shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-heading font-bold text-white text-xl">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                    {children}

                    {footer && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-zinc-400">
                            {footer}
                        </div>
                    )}

                    <button 
                        disabled={isLoading}
                        className="w-full py-4 bg-[#FF5500] hover:bg-[#FF6D00] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(255,85,0,0.3)] flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : actionLabel}
                    </button>
                </form>
            </div>
        </motion.div>
    </div>
  );
};

export default ActionModal;