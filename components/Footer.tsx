
import React from 'react';
import { contractAddress } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-sm text-text-secondary font-mono">
            <a 
                href={`https://basescan.org/address/${contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors"
                aria-label="View contract on Basescan"
            >
                Contract address: {contractAddress} ✓
            </a>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://twitter.com/intent/tweet?text=Crea il tuo token ERC20 su Base!&url=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Twitter
          </a>
          <a href="https://t.me/share/url?text=Crea il tuo token ERC20 su Base!&url=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Telegram
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-primary transition-colors">
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;