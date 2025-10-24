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
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
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