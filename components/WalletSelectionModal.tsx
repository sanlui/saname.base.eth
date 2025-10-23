import React, { useEffect, useState } from 'react';
import type { EIP6963ProviderDetail } from '../types';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: EIP6963ProviderDetail[];
  onSelectWallet: (wallet: EIP6963ProviderDetail) => void;
  isConnecting?: boolean;
  error?: string | null;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onSelectWallet,
  isConnecting,
  error,
}) => {
  const [localWallets, setLocalWallets] = useState(wallets);

  // Aggiorna wallets con debounce
  useEffect(() => {
    const timeout = setTimeout(() => setLocalWallets(wallets), 200);
    return () => clearTimeout(timeout);
  }, [wallets]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">Connect a Wallet</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {localWallets.length === 0 && !isConnecting ? (
            <p className="text-text-secondary text-center py-4">
              No wallet providers detected. Please install a browser wallet extension.
            </p>
          ) : (
            localWallets.map(wallet => (
              <button
                key={wallet.info.uuid}
                onClick={() => onSelectWallet(wallet)}
                disabled={isConnecting}
                className="w-full flex items-center p-3 bg-background hover:bg-border border border-border rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
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
          <div className="mt-4 flex items-center justify-center text-text-secondary animate-fade-in">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting... Please check your wallet.</span>
          </div>
        )}

        {error && (
            <div className="mt-4 p-3 bg-error/20 text-red-300 text-sm rounded-lg text-center break-words animate-fade-in">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default WalletSelectionModal;
