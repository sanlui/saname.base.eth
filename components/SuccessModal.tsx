
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
          <h2 className="text-2xl font-bold text-text-primary font-display mb-2">Congratulations! Your Token is Live!</h2>
          <p className="text-text-secondary mb-6">Your ERC20 token is now live on the Base network. It's time to share your project with the world!</p>
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
            {(tokenDetails.description || tokenDetails.website || tokenDetails.twitter || tokenDetails.telegram) && (
                <div className="border-t border-border/50 pt-4 space-y-4">
                    {tokenDetails.description && (
                        <div>
                            <span className="text-text-secondary text-sm block mb-1">Description:</span>
                            <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{tokenDetails.description}</p>
                        </div>
                    )}
                    {(tokenDetails.website || tokenDetails.twitter || tokenDetails.telegram) && (
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm">Links:</span>
                            <div className="flex items-center gap-4">
                                {tokenDetails.website && (
                                    <a href={tokenDetails.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors" aria-label="Website">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <title>Website Icon</title>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </a>
                                )}
                                {tokenDetails.twitter && (
                                    <a href={tokenDetails.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors" aria-label="Twitter">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <title>Twitter logo</title>
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                    </a>
                                )}
                                {tokenDetails.telegram && (
                                     <a href={tokenDetails.telegram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover transition-colors" aria-label="Telegram">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <title>Telegram logo</title>
                                            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.6-2.32 2.2a1.2 1.2 0 01-.86.32z"/>
                                        </svg>
                                     </a>
                                )}
                            </div>
                        </div>
                    )}
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
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;