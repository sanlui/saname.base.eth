import React from 'react';
import { MainLayout } from './layouts/MainLayout';
import { TokenDashboard } from './components/TokenDashboard';
import { WalletSelectionModal } from './components/WalletSelectionModal';
import { useWalletContext } from './contexts/WalletContext';
import { BASE_MAINNET_CHAIN_ID } from './constants';

const NetworkWarning = () => {
  const { chainId, switchToBaseNetwork } = useWalletContext();

  const isWrongNetwork = chainId && chainId !== BASE_MAINNET_CHAIN_ID;

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-800 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-4">
      <p>Wrong network detected. Please switch to Base Mainnet.</p>
      <button onClick={switchToBaseNetwork} className="bg-white text-red-800 font-bold py-1 px-3 rounded">
        Switch Network
      </button>
    </div>
  );
};


function App() {
  const { isModalOpen, closeWalletModal, availableWallets, connectToProvider } = useWalletContext();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10 sm:py-16 flex justify-center">
        <TokenDashboard />
      </div>
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={closeWalletModal}
        wallets={availableWallets}
        onSelectWallet={connectToProvider}
      />
       <NetworkWarning />
    </MainLayout>
  );
}

export default App;
