import React from 'react';

interface HeaderProps {
  onConnectWallet: () => void;
  accountAddress: string | null;
}

const Header: React.FC<HeaderProps> = ({ onConnectWallet, accountAddress }) => {
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
    <header className="bg-surface/80 border-b border-border backdrop-blur-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-text-primary font-display cursor-pointer"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Go to top of page"
        >
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">Base</span> Token Creator
        </h1>
        {accountAddress ? (
          <div className="flex items-center gap-4">
            <div className="bg-background border border-border text-text-secondary font-mono text-sm py-2 px-4 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {abbreviateAddress(accountAddress)}
            </div>
            <button 
              onClick={onConnectWallet}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              title="Switch wallet"
            >
              Switch
            </button>
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;