
import React from 'react';

interface HeaderProps {
  onConnectWallet: () => void;
  accountAddress: string | null;
}

const Header: React.FC<HeaderProps> = ({ onConnectWallet, accountAddress }) => {
  const abbreviateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="bg-base-light-dark border-b border-slate-700 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-base-blue">
          Base Token Factory
        </h1>
        {accountAddress ? (
          <div className="bg-slate-800 border border-slate-700 text-base-text-secondary font-mono text-sm py-2 px-4 rounded-lg">
            {abbreviateAddress(accountAddress)}
          </div>
        ) : (
          <button
            onClick={onConnectWallet}
            className="bg-base-blue hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
