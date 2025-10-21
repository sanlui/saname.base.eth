
import React from 'react';
import type { Token } from '../types';
import { ethers } from 'ethers';

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
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-lg m-4 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/20 mb-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
          <h2 className="text-2xl font-bold text-text-primary font-display mb-2">Token Created Successfully!</h2>
          <p className="text-text-secondary mb-6">Your new ERC20 token has been minted on the Base network.</p>
        </div>

        <div className="space-y-4 bg-background border border-border rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
                <span className="text-text-secondary">Token Name:</span>
                <span className="font-bold text-text-primary">{tokenDetails.name}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-text-secondary">Symbol:</span>
                <span className="font-mono bg-border px-2 py-1 rounded text-sm text-text-primary">{tokenDetails.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Supply:</span>
                <span className="font-medium text-text-primary">
                    {tokenDetails.decimals !== undefined 
                        ? Number(ethers.formatUnits(tokenDetails.supply, tokenDetails.decimals)).toLocaleString() 
                        : Number(tokenDetails.supply).toLocaleString()}
                </span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-text-secondary">Token Address:</span>
                <a href={`https://basescan.org/token/${tokenDetails.address}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-sm">
                    {abbreviateAddress(tokenDetails.address)}
                </a>
            </div>
            {tokenDetails.txHash && (
              <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Transaction Hash:</span>
                  <a href={`https://basescan.org/tx/${tokenDetails.txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-sm">
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
            className="w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
                View on Basescan
            </a>
            <button
                onClick={onClose}
                className="w-full bg-border hover:bg-border/80 text-text-primary font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
                Create Another Token
            </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;