import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Features from './components/Features';
import Footer from './components/Footer';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, EIP6963ProviderDetail } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider, Log } from 'ethers';

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
  
  const fetchBaseFee = useCallback(async () => {
    if (!readOnlyProvider) return;
    try {
      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
      const feeInWei = await contract.baseFee();
      setBaseFee(ethers.formatEther(feeInWei));
    } catch (error) {
      console.error('Error fetching base fee:', error);
      setTokensError('Could not retrieve the deployment fee from the contract.');
    }
  }, [readOnlyProvider]);

  const fetchTokens = useCallback(async () => {
    if (!readOnlyProvider) return;
    setIsLoadingTokens(true);
    setTokensError(null);
    try {
        const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
        const filter = contract.filters.TokenCreated();
        
        const latestBlockNumber = await readOnlyProvider.getBlockNumber();
        const chunkSize = 20000;
        let allLogs: Log[] = [];

        // Fetch logs in chunks to avoid provider limits
        for (let fromBlock = Math.max(0, latestBlockNumber - 200000); fromBlock <= latestBlockNumber; fromBlock += chunkSize) {
            const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlockNumber);
            try {
              const logs = await contract.queryFilter(filter, fromBlock, toBlock);
              allLogs = [...allLogs, ...logs];
            } catch (chunkError) {
              console.warn(`Failed to fetch logs for block range ${fromBlock}-${toBlock}. Skipping chunk.`, chunkError);
            }
        }
        
        const tokenPromises = allLogs.map(async (log) => {
            const block = await readOnlyProvider.getBlock(log.blockNumber);
            const parsedLog = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
            const args = parsedLog!.args;

            const tokenAddress = args.tokenAddress;
            const localMeta = localMetadata[tokenAddress.toLowerCase()] || {};
            
            return {
                name: args.name,
                symbol: args.symbol,
                creator: args.creator,
                address: tokenAddress,
                supply: args.supply.toString(),
                timestamp: block ? block.timestamp * 1000 : undefined,
                txHash: log.transactionHash,
                decimals: 18, // All tokens created have 18 decimals by default
                website: localMeta.website,
                twitter: localMeta.twitter,
                telegram: localMeta.telegram,
                description: localMeta.description,
            };
        });

        const fetchedTokens = await Promise.all(tokenPromises);
        setTokens(fetchedTokens.reverse());
    } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setTokensError("Could not connect to the blockchain to fetch the token list. The network may be congested. Please try again later.");
    } finally {
        setIsLoadingTokens(false);
    }
  }, [readOnlyProvider, localMetadata]);

  useEffect(() => {
    fetchBaseFee();
    fetchTokens();
  }, [fetchBaseFee, fetchTokens]);

  const handleTokenCreated = () => {
    fetchTokens();
  };

  const handleTokenCreatedWithMetadata = (token: Token) => {
    setLocalMetadata(prev => ({
      ...prev,
      [token.address.toLowerCase()]: {
        website: token.website,
        twitter: token.twitter,
        telegram: token.telegram,
        description: token.description,
      }
    }));
    // We don't need to call fetchTokens here, it will be called by handleTokenCreated
  };

  const handleConnectWallet = () => {
    setIsModalOpen(true);
    setConnectionError(null);
  };
  
  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
        const provider = new BrowserProvider(wallet.provider);
        const accounts = await provider.send('eth_requestAccounts', []);

        if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            
            // Gas-free signature to prove ownership
            const nonce = new Date().getTime().toString();
            const message = createSignatureMessage(nonce);
            await signer.signMessage(message);

            setAccountAddress(address);
            setProvider(provider);
            setIsModalOpen(false);
        } else {
            setConnectionError("No accounts found. Please make sure your wallet is unlocked and accessible.");
        }
    } catch (error: any) {
        console.error("Wallet connection error:", error);
        let message = "An error occurred while connecting. Please try again.";
        if (error.code === 'ACTION_REJECTED' || error.code === 4001 || (error.message && error.message.toLowerCase().includes('user rejected'))) {
          message = "Connection request cancelled in wallet.";
        }
        setConnectionError(message);
    } finally {
        setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccountAddress(null);
    setProvider(null);
  };
  
  const handleScrollToCreation = () => {
    creationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
              <h1 className="text-5xl md:text-7xl font-black font-display mb-6 leading-tight bg-gradient-to-r from-gradient-start to-gradient-end text-transparent bg-clip-text">
                  Launch on Base. Instantly.
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
                Our secure, no-code tool empowers you to deploy a custom ERC20 token in minutes. You get full ownership and control, all on the fast and low-cost Base network.
              </p>
              <button
                  onClick={handleScrollToCreation}
                  className="mt-10 bg-primary hover:bg-primary-hover text-white font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 ease-in-out hover:shadow-glow-primary transform hover:-translate-y-1"
              >
                  Start Creating Your Token
              </button>
          </div>
          
          <Features />

          <div ref={creationSectionRef} className="grid grid-cols-1 lg:grid-cols-5 gap-10 my-16 pt-16">
            <div className="lg:col-span-3">
              <TokenCreation
                accountAddress={accountAddress}
                provider={provider}
                baseFee={baseFee}
                onTokenCreated={handleTokenCreated}
                onTokenCreatedWithMetadata={handleTokenCreatedWithMetadata}
              />
            </div>
            <div className="lg:col-span-2">
              <LatestTokens tokens={tokens} isLoading={isLoadingTokens} error={tokensError} onRetry={fetchTokens} />
            </div>
          </div>

        </div>
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
