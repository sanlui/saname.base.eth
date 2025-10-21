
import React from 'react';
import type { Token } from '../types';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenDetails: Token | null;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, tokenDetails }) => {
  if (!isOpen || !tokenDetails) return null;

  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-base-light-dark border border-slate-700 rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500/20 mb-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
          <h2 className="text-2xl font-bold text-base-text mb-2">Token Created Successfully!</h2>
          <p className="text-base-text-secondary mb-6">Your new ERC20 token has been minted on the Base network.</p>
        </div>

        <div className="space-y-4 bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
                <span className="text-base-text-secondary">Token Name:</span>
                <span className="font-bold text-base-text">{tokenDetails.name}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-base-text-secondary">Symbol:</span>
                <span className="font-mono bg-slate-700 px-2 py-1 rounded text-sm">{tokenDetails.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-base-text-secondary">Total Supply:</span>
                <span className="font-medium text-base-text">{Number(tokenDetails.supply).toLocaleString()}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-base-text-secondary">Token Address:</span>
                <a href={`https://basescan.org/token/${tokenDetails.address}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline font-mono text-sm">
                    {abbreviateAddress(tokenDetails.address)}
                </a>
            </div>
            {tokenDetails.txHash && (
              <div className="flex justify-between items-center">
                  <span className="text-base-text-secondary">Transaction Hash:</span>
                  <a href={`https://basescan.org/tx/${tokenDetails.txHash}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline font-mono text-sm">
                      {abbreviateAddress(tokenDetails.txHash)}
                  </a>
              </div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
           <a 
            href={`https://basescan.org/token/${tokenDetails.address}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full text-center bg-base-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
                View on Basescan
            </a>
            <button
                onClick={onClose}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
                Create Another Token
            </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
