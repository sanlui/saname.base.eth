import React from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onConnectWallet: () => void;
  accountAddress: string | null;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ onConnectWallet, accountAddress, onDisconnect }) => {
  const abbreviateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleLogoClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogoKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLogoClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div
          className="bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base py-2 px-5 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center cursor-pointer"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Go to top of page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <title>Disrole logo icon</title>
            <path d="M10 2c-1.39 0-2.7.36-3.84.99a.75.75 0 00-.36 1.04l.1.18c.28.51.49 1.05.6 1.62.11.58.11 1.19 0 1.77-.1.57-.31 1.11-.6 1.62l-.1.18a.75.75 0 00.36 1.04C7.3 11.64 8.61 12 10 12c3.31 0 6-2.69 6-6s-2.69-4-6-4z"/>
            <path d="M10 18c1.39 0 2.7-.36-3.84-.99a.75.75 0 00.36-1.04l-.1-.18c-.28-.51-.49-1.05-.6-1.62-.11-.58-.11-1.19 0-1.77.1-.57.31 1.11.6-1.62l.1-.18a.75.75 0 00-.36-1.04C12.7 8.36 11.39 8 10 8c-3.31 0-6 2.69-6 6s2.69 4 6 4z"/>
          </svg>
          Disrole
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {accountAddress ? (
            <div className="flex items-center gap-3">
              <div className="bg-surface border border-border text-text-secondary font-mono text-sm py-2 px-4 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                {abbreviateAddress(accountAddress)}
              </div>
              <button
                onClick={onDisconnect}
                className="text-text-secondary hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10"
                title="Disconnect wallet"
                aria-label="Disconnect wallet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <title>Disconnect wallet icon</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-5 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;