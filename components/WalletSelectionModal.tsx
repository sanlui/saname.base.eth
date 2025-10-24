import React from 'react';
import type { EIP6963ProviderDetail } from '../types';
import { motion } from 'framer-motion';

interface WalletSelectionModalProps {
  onClose: () => void;
  wallets: EIP6963ProviderDetail[];
  onSelectWallet: (wallet: EIP6963ProviderDetail) => void;
  isConnecting?: boolean;
  error?: string | null;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  onClose,
  wallets,
  onSelectWallet,
  isConnecting,
  error,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-surface border border-border rounded-2xl shadow-glow-primary-lg p-6 w-full max-w-sm m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold text-text-primary font-display">Connect a Wallet</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-3xl leading-none">&times;</button>
        </div>

        {wallets.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-center p-3 mb-4 rounded-lg bg-info/10 text-blue-300"
          >
            Multiple wallets detected. Please choose your preferred wallet to continue.
          </motion.div>
        )}

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {wallets.length === 0 && !isConnecting ? (
            <p className="text-text-secondary text-center py-4">
              No wallet providers detected. Please install a browser wallet extension.
            </p>
          ) : (
            wallets.map(wallet => (
              <button
                key={wallet.info.uuid}
                onClick={() => onSelectWallet(wallet)}
                disabled={isConnecting}
                className="w-full flex items-center p-4 bg-background hover:bg-border border border-border rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
              >
                <img
                  src={wallet.info.icon}
                  alt={`${wallet.info.name} wallet logo`}
                  className="w-8 h-8 mr-4 rounded-full"
                />
                <span className="font-semibold text-text-primary">{wallet.info.name}</span>
              </button>
            ))
          )}
        </div>

        {isConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} 
            className="mt-4 flex items-center justify-center text-text-secondary">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <title>Loading spinner</title>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting... Please check your wallet.</span>
          </motion.div>
        )}

        {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-error/10 text-red-400 text-sm rounded-lg flex items-center justify-center gap-2 break-words">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <title>Error icon</title>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </motion.div>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-left text-xs p-3 bg-background rounded-lg border-l-4 border-info/50 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info flex-shrink-0 mt-px" viewBox="0 0 20 20" fill="currentColor">
                  <title>Information icon</title>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-text-secondary">
                  <strong>Secure Connection:</strong> We'll ask you to connect your wallet to view your public address, then sign a gas-free message to verify ownership. This is a secure, read-only action.
              </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WalletSelectionModal;