import React, { useState } from "react";
import type { EIP6963ProviderDetail } from "../types";
import WalletSelectionModal from "./WalletSelectionModal";

const WalletConnector: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallets, setWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectWallets = () => {
    try {
      setError(null);
      setWallets([]); // reset lista
      setIsConnecting(true);

      const detectedWallets: EIP6963ProviderDetail[] = [];

      // 👉 ascolta i provider compatibili con EIP-6963
      window.addEventListener(
        "eip6963:announceProvider",
        (event: Event) => {
          const providerDetail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
          detectedWallets.push(providerDetail);
          setWallets([...detectedWallets]);
        },
        { once: false }
      );

      // 👉 Richiedi l’annuncio dei provider solo DOPO l’azione dell’utente
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    } catch (err) {
      setError("Failed to detect wallets. Please refresh and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectWallet = (wallet: EIP6963ProviderDetail) => {
    try {
      setIsConnecting(true);
      // Qui puoi aggiungere la logica per collegare il wallet
      console.log("Connecting to:", wallet.info.name);
    } catch (err) {
      setError("Failed to connect to wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-3xl font-bold mb-4">Base Token Creator</h1>

      {/* 🔒 Avvio del rilevamento solo dopo click */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          detectWallets();
        }}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all"
      >
        Connect Wallet
      </button>

      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={wallets}
        onSelectWallet={handleSelectWallet}
        isConnecting={isConnecting}
        error={error}
      />
    </div>
  );
};

export default WalletConnector;
