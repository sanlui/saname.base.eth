import React from 'react';
import { contractAddress } from '../constants';

const TwitterIcon = () => (
    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <title>Twitter logo</title>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <title>Telegram logo</title>
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.6-2.32 2.2a1.2 1.2 0 01-.86.32z"/>
    </svg>
);


const Footer: React.FC = () => {
    const abbreviatedAddress = `${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}`;
    return (
        <footer className="border-t border-border mt-16 py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
                    <div className="text-xs text-text-secondary">
                        Contract: <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono" aria-label={`View contract ${contractAddress} on Basescan`}>{abbreviatedAddress}</a>
                    </div>
                    <div className="text-xs text-text-secondary">
                        © 2024 Disrole. All rights reserved.
                    </div>
                    <div className="flex gap-3">
                       <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Follow on X" className="flex items-center justify-center h-8 w-8 rounded-full bg-primary hover:bg-primary-hover transition-colors">
                            <TwitterIcon />
                        </a>
                        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label="Join on Telegram" className="flex items-center justify-center h-8 w-8 rounded-full bg-primary hover:bg-primary-hover transition-colors">
                            <TelegramIcon />
                        </a>
                    </div>
                </div>
                <p className="text-xs text-text-secondary/80 mt-6 text-center max-w-4xl mx-auto">
                    Disclaimer: Disrole is a deployment tool. Users are solely responsible for any tokens created and for complying with all applicable laws. Always conduct your own research before creating or interacting with any tokens.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
