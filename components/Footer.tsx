
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
          <a href="https://twitter.com/intent/tweet?text=Crea il tuo token ERC20 su Base!&url=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Share on Twitter">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <title>Twitter logo</title>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://t.me/share/url?text=Crea il tuo token ERC20 su Base!&url=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Share on Telegram">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <title>Telegram logo</title>
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.6-2.32 2.2a1.2 1.2 0 01-.86.32z"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://disrole.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Share on Facebook">
             <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <title>Facebook logo</title>
              <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
