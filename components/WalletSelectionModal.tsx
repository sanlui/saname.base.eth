
import React from 'react';
import type { EIP6963ProviderDetail } from '../types';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: EIP6963ProviderDetail[];
  onSelectWallet: (wallet: EIP6963ProviderDetail) => void;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onSelectWallet,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-base-light-dark border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h2 className="text-xl font-bold text-base-text">Connect a Wallet</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {wallets.length === 0 ? (
            <p className="text-base-text-secondary text-center py-4">
              No wallet providers detected. Please install a browser wallet extension.
            </p>
          ) : (
            wallets.map(wallet => (
              <button
                key={wallet.info.uuid}
                onClick={() => onSelectWallet(wallet)}
                className="w-full flex items-center p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors duration-200"
              >
                <img
                  src={wallet.info.icon}
                  alt={`${wallet.info.name} icon`}
                  className="w-8 h-8 mr-4 rounded-full"
                />
                <span className="font-semibold text-base-text">{wallet.info.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSelectionModal;
