
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
  const [baseFee, setBaseFee] = useState<string | null>(null);
  
  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Simplify to a single, reliable provider to avoid quorum issues and parallel request limits.
    // Explicitly set the network to Base Mainnet (8453).
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

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
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
      setIsWalletModalOpen(false); // Close on success
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setConnectionError("Failed to connect wallet. Please try again or choose a different wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false);
    setConnectionError(null); // Reset error on close
  };

  const fetchTokensFromAllTokensArray = useCallback(async () => {
    if (!readOnlyProvider) return;
    
    setIsLoadingTokens(true);
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

        // Fetch in batches to be considerate to the RPC provider
        for (let i = 0; i < totalTokens; i += BATCH_SIZE) {
            const batchPromises: Promise<string>[] = [];
            const end = Math.min(i + BATCH_SIZE, totalTokens);
            for (let j = i; j < end; j++) {
                batchPromises.push(contract.allTokens(j));
            }
            
            const tokenAddresses = await Promise.all(batchPromises);
            
            // Fix: Add explicit return type Promise<Token | null> to the async map callback.
            // This ensures TypeScript infers the correct type for `resolvedTokens`, resolving the type predicate error.
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
                        creator: 'N/A', // Creator info is not available through this method
                        timestamp: undefined, // Timestamp is not available
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

        // Sort tokens to show newest first (by reversing the array since contract stores oldest first)
        const sortedTokens = fetchedTokens.reverse();
        setTokens(sortedTokens);

    } catch (error) {
        console.error("Error fetching tokens from allTokens array:", error);
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
    // A new token was created, so we re-fetch the whole list to ensure consistency.
    setTimeout(fetchTokensFromAllTokensArray, 1000); // Add a small delay for chain propagation
  }, [fetchTokensFromAllTokensArray]);

  useEffect(() => {
    if (!readOnlyProvider) return;
    
    const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
    
    const handleNewToken = () => {
      // New token detected, refresh the list.
      onTokenCreated();
    };

    contract.on('TokenCreated', handleNewToken);
    
    return () => {
      contract.removeAllListeners('TokenCreated');
    };
  }, [readOnlyProvider, onTokenCreated]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} />
      <main className="container mx-auto px-4 py-12">
        <div className="space-y-12">
          <TokenCreation 
            accountAddress={accountAddress} 
            provider={provider} 
            baseFee={baseFee}
            onTokenCreated={onTokenCreated}
          />
          <LatestTokens tokens={tokens} isLoading={isLoadingTokens} />
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
