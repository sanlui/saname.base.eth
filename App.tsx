


import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Features from './components/Features';
import Footer from './components/Footer';
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
  
  const creationSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const provider = new JsonRpcProvider('https://base.publicnode.com', 8453);
    setReadOnlyProvider(provider);
    
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

  const handleDisconnect = () => {
    setAccountAddress(null);
    setProvider(null);
  };

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };
  
  const handleScrollToCreate = () => {
    creationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const newProvider = new BrowserProvider(wallet.provider);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      setAccountAddress(address);
      setProvider(newProvider);
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setConnectionError("Failed to connect wallet. Please try again or choose a different wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false);
    setConnectionError(null);
  };

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

        const sortedTokens = fetchedTokens.reverse();
        setTokens(sortedTokens);

    } catch (error: any) {
        console.error("Error fetching tokens from allTokens array:", error);
        setTokensError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
        setIsLoadingTokens(false);
    }
}, [readOnlyProvider, baseFee]);
  
  useEffect(() => {
    if(readOnlyProvider) {
      fetchTokensFromAllTokensArray();
    }
  }, [readOnlyProvider, fetchTokensFromAllTokensArray]);

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

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} />
      <main className="container mx-auto px-4 py-12 md:py-16 flex-grow">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-2 animate-fade-in">
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              Create Your ERC20 Token on Base, Instantly
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold font-display mb-4 text-text-primary animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Fast. Simple. All Yours.
          </p>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10 animate-fade-in" style={{animationDelay: '0.2s'}}>
            Create and deploy your custom ERC20 token in minutes. With our no-code creator, you have full ownership and control on the low-cost, high-speed Base network.
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
        </section>

      </main>
      <Footer />
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