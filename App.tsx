import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI, erc20ABI } from './constants';
import type { Token, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider } from 'ethers';

const App: React.FC = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<JsonRpcProvider | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [baseFee, setBaseFee] = useState<string | null>(null);
  
  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize read-only provider
  useEffect(() => {
    const provider = new JsonRpcProvider('https://base.publicnode.com', 8453);
    setReadOnlyProvider(provider);

    // Listen for EIP-6963 wallets
    const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
      setAvailableWallets(prev => {
        if (prev.some(p => p.info.uuid === event.detail.info.uuid)) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    };
  }, []);

  // Connect wallet using EIP-6963
  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const newProvider = new BrowserProvider(wallet.provider);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();

      // Optional: signature to prove ownership
      const nonce = new Date().getTime().toString();
      const message = `Sign this message to connect your wallet securely. Nonce: ${nonce}`;
      await signer.signMessage(message);

      setAccountAddress(address);
      setProvider(newProvider);
      setIsWalletModalOpen(false);
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001 || (error.message && error.message.toLowerCase().includes('user rejected'))) {
        setConnectionError("Connection request cancelled in wallet.");
      } else {
        setConnectionError("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccountAddress(null);
    setProvider(null);
  };

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false);
    setConnectionError(null);
  };

  // Fetch tokens from blockchain
  const fetchTokens = useCallback(async () => {
    if (!readOnlyProvider) return;

    setIsLoadingTokens(true);
    setTokensError(null);
    try {
      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);

      if (!baseFee) {
        const fee = await contract.baseFee();
        setBaseFee(ethers.formatEther(fee));
      }

      const totalTokensBigInt = await contract.totalTokensCreated();
      const totalTokens = Number(totalTokensBigInt);

      const BATCH_SIZE = 50;
      const fetchedTokens: Token[] = [];

      for (let i = 0; i < totalTokens; i += BATCH_SIZE) {
        const batchPromises: Promise<string>[] = [];
        const end = Math.min(i + BATCH_SIZE, totalTokens);
        for (let j = i; j < end; j++) batchPromises.push(contract.allTokens(j));

        const tokenAddresses = await Promise.all(batchPromises);

        const detailPromises = tokenAddresses.map(async (address): Promise<Token | null> => {
          try {
            const tokenContract = new Contract(address, erc20ABI, readOnlyProvider);
            const [name, symbol, supply] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.totalSupply(),
            ]);

            return { address, name, symbol, supply: supply.toString(), creator: 'N/A', timestamp: undefined };
          } catch {
            return null;
          }
        });

        const resolvedTokens = await Promise.all(detailPromises);
        fetchedTokens.push(...resolvedTokens.filter(t => t !== null) as Token[]);
      }

      setTokens(fetchedTokens.reverse());
    } catch (error: any) {
      console.error("Error fetching tokens:", error);
      setTokensError(error.message || 'Unexpected error fetching tokens.');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [readOnlyProvider, baseFee]);

  useEffect(() => {
    if (readOnlyProvider) fetchTokens();
  }, [readOnlyProvider, fetchTokens]);

  const onTokenCreated = useCallback(() => {
    setTimeout(fetchTokens, 1000);
  }, [fetchTokens]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header 
        onConnectWallet={handleConnectWallet} 
        accountAddress={accountAddress} 
        onDisconnect={handleDisconnect} 
      />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center font-display mb-10 animate-fade-in">
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            Create Your Token on the Base Network
          </span>
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <TokenCreation 
              accountAddress={accountAddress} 
              provider={provider} 
              baseFee={baseFee}
              onTokenCreated={onTokenCreated}
            />
          </div>
          <div className="lg:col-span-2">
            <LatestTokens 
              tokens={tokens} 
              isLoading={isLoadingTokens} 
              error={tokensError}
              onRetry={fetchTokens}
            />
          </div>
        </div>
      </main>
      <WalletSelectionModal
        isOpen={isWalletModalOpen}
        onClose={handleCloseWalletModal}
        wallets={availableWallets}
        onSelectWallet={handleSelectWallet}
        isConnecting={isConnecting}
        error={connectionError}
      />
    </div>
  );
};

export default App;
