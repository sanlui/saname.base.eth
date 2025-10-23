

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Features from './components/Features';
import Footer from './components/Footer';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, EIP6963ProviderDetail } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider } from 'ethers';

// Announce that the app is ready to receive wallet provider info
const announceProvider = () => {
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } catch (error) {
    console.error('Could not dispatch eip6963:requestProvider event.', error);
  }
};

const createSignatureMessage = (nonce: string): string => {
  return `Welcome to Disrole!\n\nPlease sign this message to securely connect your wallet. This action is free and will not trigger a transaction.\n\nNonce: ${nonce}`;
};


const App: React.FC = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<JsonRpcProvider | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [baseFee, setBaseFee] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [wallets, setWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localMetadata, setLocalMetadata] = useState<Record<string, Partial<Token>>>({});

  const creationSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const provider = new JsonRpcProvider('https://base.publicnode.com', 8453);
    setReadOnlyProvider(provider);
  }, []);

  // EIP-6963 Wallet Discovery
  useEffect(() => {
    const handleAnnounceProvider = (event: any) => {
      const providerDetail: EIP6963ProviderDetail = event.detail;
      setWallets(currentWallets => {
        if (currentWallets.some(w => w.info.uuid === providerDetail.info.uuid)) {
          return currentWallets;
        }
        return [...currentWallets, providerDetail];
      });
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);
    announceProvider();

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounceProvider);
    };
  }, []);


  const handleDisconnect = () => {
    setAccountAddress(null);
    setProvider(null);
  };

  const handleConnectWallet = () => {
    setConnectionError(null);
    setIsModalOpen(true);
  };

  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setConnectionError(null);
    setIsConnecting(true);
    try {
      const newProvider = new BrowserProvider(wallet.provider);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      
      // --- New Signature Flow ---
      const nonce = crypto.randomUUID();
      const message = createSignatureMessage(nonce);

      const signature = await signer.signMessage(message);

      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature verification failed. Address mismatch.");
      }
      // --- End of Signature Flow ---
      
      setAccountAddress(address);
      setProvider(newProvider);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error connecting to wallet:", error);
      let errorMessage = "Failed to connect wallet. An unexpected error occurred.";
      if (error.code === 'ACTION_REJECTED' || (error.reason && error.reason.toLowerCase().includes('user rejected'))) {
          errorMessage = "Connection or signature request was rejected in your wallet.";
      } else if (error.message && error.message.includes("Signature verification failed")) {
          errorMessage = "Could not verify wallet ownership. Please try connecting again.";
      }
      setConnectionError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleScrollToCreate = () => {
    creationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTokens = useCallback(async () => {
    if (!readOnlyProvider) return;
    
    setIsLoadingTokens(true);
    setTokensError(null);
    try {
        // FIX: Add `as const` to the contractABI to ensure proper type inference by ethers.
        // This resolves an issue where event data was being incorrectly typed as `unknown`,
        // leading to a "Type 'unknown' cannot be used as an index type" error.
        const contract = new Contract(contractAddress, contractABI as const, readOnlyProvider);

        if (!baseFee) {
            const fee = await contract.baseFee();
            setBaseFee(ethers.formatEther(fee));
        }
        
        // Query for all TokenCreated events
        const events = await contract.queryFilter('TokenCreated');
        
        // Efficiently fetch block timestamps
        const blockTimestamps: Record<number, number> = {};
        const uniqueBlockNumbers = [...new Set(events.map(event => event.blockNumber))];
        
        await Promise.all(uniqueBlockNumbers.map(async (blockNumber) => {
            try {
                const block = await readOnlyProvider.getBlock(blockNumber);
                if (block) {
                    blockTimestamps[blockNumber] = block.timestamp * 1000; // Convert to milliseconds
                }
            } catch (error) {
                console.error(`Error fetching block ${blockNumber}:`, error);
            }
        }));

        const fetchedTokens: Token[] = events.map(event => {
            const args = event.args;
            const token: Token = {
                address: args.tokenAddress,
                name: args.name,
                symbol: args.symbol,
                supply: args.supply.toString(),
                creator: args.creator,
                timestamp: blockTimestamps[event.blockNumber] || undefined,
                txHash: event.transactionHash
            };
            return token;
        });
        
        const tokensWithMetadata = fetchedTokens.map(token => ({
            ...token,
            ...(localMetadata[token.address.toLowerCase()] || {})
        }));

        const sortedTokens = tokensWithMetadata.reverse(); // Newest first
        setTokens(sortedTokens);

    } catch (error: any) {
        console.error("Error fetching tokens from events:", error);
        setTokensError(error.message || 'An unexpected error occurred while fetching tokens. Please try again.');
    } finally {
        setIsLoadingTokens(false);
    }
}, [readOnlyProvider, baseFee, localMetadata]);
  
  useEffect(() => {
    if(readOnlyProvider) {
      fetchTokens();
    }
  }, [readOnlyProvider, fetchTokens]);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
      } else {
        handleDisconnect();
      }
    };

    if (provider && provider.provider && provider.provider.on) {
        provider.provider.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (provider && provider.provider && provider.provider.removeListener) {
        provider.provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [provider]);
  
  const onTokenCreated = useCallback(() => {
    setTimeout(fetchTokens, 1000);
  }, [fetchTokens]);

  const addLocalTokenMetadata = useCallback((token: Token) => {
    if (!token.address) return;
    setLocalMetadata(prev => ({
        ...prev,
        [token.address.toLowerCase()]: {
            website: token.website,
            twitter: token.twitter,
            telegram: token.telegram,
            description: token.description,
        }
    }));
  }, []);

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

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} />
      <main className="container mx-auto px-4 py-12 md:py-16 flex-grow">
        {connectionError && !isModalOpen && (
          <div className="text-center p-3 rounded-lg text-sm break-words my-4 bg-error/20 text-red-300 animate-fade-in flex justify-between items-center max-w-3xl mx-auto">
              <span>{connectionError}</span>
              <button onClick={() => setConnectionError(null)} className="ml-4 font-bold p-1 rounded-full hover:bg-white/10" aria-label="Close error message">&times;</button>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-2 animate-fade-in">
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              Launch Your ERC20 Token on the Base Network
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold font-display mb-4 text-text-primary animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Secure. Simple. All Yours.
          </p>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10 animate-fade-in" style={{animationDelay: '0.2s'}}>
            Our secure, no-code tool empowers you to deploy a custom ERC20 token in minutes. You get full ownership and control, all on the fast and low-cost Base network.
          </p>
          <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
            <button
                onClick={handleScrollToCreate}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-glow"
            >
              Start Creating
            </button>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* Creation Section */}
        <section ref={creationSectionRef} className="pt-16 md:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <TokenCreation 
                accountAddress={accountAddress} 
                provider={provider} 
                baseFee={baseFee}
                onTokenCreated={onTokenCreated}
                onTokenCreatedWithMetadata={addLocalTokenMetadata}
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
        </section>

      </main>
      <Footer />
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={wallets}
        onSelectWallet={handleSelectWallet}
        isConnecting={isConnecting}
        error={connectionError}
      />
    </div>
  );
};

export default App;