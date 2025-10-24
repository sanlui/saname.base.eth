import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI, erc20ABI } from './constants';
import type { Token, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider, Log } from 'ethers';

// --- Messaggio per firma gas-free ---
const createSignatureMessage = (nonce: string): string => {
  return `Welcome to Disrole!\n\nPlease sign this message to securely connect your wallet. This action is free and will not trigger a transaction.\n\nNonce: ${nonce}`;
};

// --- Annuncio provider EIP-6963 ---
const announceProvider = () => {
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch (error) {
    console.error('Could not dispatch eip6963:requestProvider event.', error);
  }
};

const App: React.FC = () => {
  // --- Stato wallet ---
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<JsonRpcProvider | null>(null);

  // --- Stato token ---
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [baseFee, setBaseFee] = useState<string | null>(null);

  // --- Stato wallet modal ---
  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const creationSectionRef = useRef<HTMLDivElement>(null);

  // --- Read-only provider ---
  useEffect(() => {
    const provider = new JsonRpcProvider('https://base.publicnode.com', 8453);
    setReadOnlyProvider(provider);

    // EIP-6963 discovery
    const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
      setAvailableWallets(prev => {
        if (prev.some(p => p.info.uuid === event.detail.info.uuid)) return prev;
        return [...prev, event.detail];
      });
    };

    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
    announceProvider();

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    };
  }, []);

  // --- Connect wallet ---
  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
    setConnectionError(null);
  };

  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const newProvider = new BrowserProvider(wallet.provider);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();

      // Gas-free signature to prove ownership
      const nonce = new Date().getTime().toString();
      const message = createSignatureMessage(nonce);
      await signer.signMessage(message);

      setAccountAddress(address);
      setProvider(newProvider);
      setIsWalletModalOpen(false);
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      let message = "Failed to connect wallet. Please try again.";
      if (error.code === 4001 || (error.message && error.message.toLowerCase().includes('user rejected'))) {
        message = "Connection request cancelled in wallet.";
      }
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false);
    setConnectionError(null);
  };

  const handleDisconnect = () => {
    setAccountAddress(null);
    setProvider(null);
  };

  const handleScrollToCreation = () => {
    creationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // --- Fetch tokens ---
  const fetchTokensFromAllTokensArray = useCallback(async () => {
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
        for (let j = i; j < end; j++) {
          batchPromises.push(contract.allTokens(j));
        }

        const tokenAddresses = await Promise.all(batchPromises);

        const detailPromises = tokenAddresses.map(async (address: string): Promise<Token | null> => {
          try {
            const tokenContract = new Contract(address, erc20ABI, readOnlyProvider);
            const [name, symbol, supply] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.totalSupply(),
            ]);

            return {
              address,
              name,
              symbol,
              supply: supply.toString(),
              creator: 'N/A',
              timestamp: undefined,
            };
          } catch (error) {
            console.error(`Error fetching details for token ${address}:`, error);
            return null;
          }
        });

        const resolvedTokens = await Promise.all(detailPromises);
        const validTokensInBatch = resolvedTokens.filter((t): t is Token => t !== null);
        fetchedTokens.push(...validTokensInBatch);
      }

      setTokens(fetchedTokens.reverse());
    } catch (error: any) {
      console.error("Error fetching tokens from allTokens array:", error);
      setTokensError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoadingTokens(false);
    }
  }, [readOnlyProvider, baseFee]);

  useEffect(() => {
    if (readOnlyProvider) {
      fetchTokensFromAllTokensArray();
    }
  }, [readOnlyProvider, fetchTokensFromAllTokensArray]);

  // --- Listen for new tokens ---
  const onTokenCreated = useCallback(() => {
    setTimeout(fetchTokensFromAllTokensArray, 1000);
  }, [fetchTokensFromAllTokensArray]);

  useEffect(() => {
    if (!readOnlyProvider) return;
    const contract = new Contract(contractAddress, contractABI, readOnlyProvider);

    const handleNewToken = () => {
      onTokenCreated();
    };

    contract.on('TokenCreated', handleNewToken);
    return () => {
      contract.removeAllListeners('TokenCreated');
    };
  }, [readOnlyProvider, onTokenCreated]);

  // --- Listen for account changes ---
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
      } else {
        setAccountAddress(null);
        setProvider(null);
      }
    };

    if (provider?.provider.on) {
      provider.provider.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (provider?.provider.removeListener) {
        provider.provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [provider]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center font-display mb-10 animate-fade-in">
          <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
            Create Your Token on the Base Network
          </span>
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3" ref={creationSectionRef}>
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
              onRetry={fetchTokensFromAllTokensArray}
            />
          </div>
        </div>
      </main>
      <footer className="text-center py-6 mt-8">
        <p className="text-text-secondary text-sm">
          Contract address: 
          <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline ml-2">
            {contractAddress}
          </a>
          <span className="text-green-500 ml-1 inline-block" title="Verified">✓</span>
        </p>
      </footer>
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
