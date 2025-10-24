import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Features from './components/Features';
import Footer from './components/Footer';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, EIP6963ProviderDetail, EIP1193Provider } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider, Log } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';

// Extend the Window interface to include properties injected by wallets.
declare global {
  interface Window {
    ethereum?: EIP1193Provider & { isMetaMask?: boolean };
    dispatchedEip6963Request?: boolean;
  }
}

// Announce that the app is ready to receive wallet provider info
const announceProvider = () => {
  try {
    // Dispatch the event only once to avoid redundant announcements.
    if (!window.dispatchedEip6963Request) {
      window.dispatchEvent(new Event('eip6963:requestProvider'));
      window.dispatchedEip6963Request = true;
    }
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

  // EIP-6963 Wallet Discovery and legacy `window.ethereum` handling
  useEffect(() => {
    const handleAnnounceProvider = (event: Event) => {
      const providerDetail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      setWallets(currentWallets => {
        if (currentWallets.some(w => w.info.uuid === providerDetail.info.uuid)) {
          return currentWallets;
        }
        return [...currentWallets, providerDetail];
      });
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);
    announceProvider();

    // After a short delay, check for a legacy window.ethereum provider
    // that was not announced via EIP-6963.
    const timeoutId = setTimeout(() => {
      if (typeof window.ethereum !== 'undefined') {
        setWallets(currentWallets => {
          // Check if the injected provider is already in our list by comparing the provider object reference
          const isAnnounced = currentWallets.some(w => w.provider === window.ethereum);
          if (!isAnnounced) {
            const legacyWallet: EIP6963ProviderDetail = {
              info: {
                uuid: 'legacy-injected',
                name: window.ethereum?.isMetaMask ? 'MetaMask' : 'Injected Wallet',
                icon: window.ethereum?.isMetaMask
                  ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbD0iI0Y2ODY1QyIgZD0iTTIwNS4yIDUwLjZMMTI5LjYgMTAuOEMxMjYuMyA5LjEgMTIyLjcgOS4xIDEyMS40IDEwLjhsLTc1LjYgMzkuOEM0Mi42IDUyLjcgNDEuMSA1Ni4zIDQxLjEgNTkuOXY1NS4yYzAgMy42IDEuNSA3LjMgNC43IDkuOGw3NS42IDM5LjhjMS43IDEgMy42IDEuMyA1LjQgMS4zcyAzLjctLjQgNS40LTEuM2w3NS42LTM5LjhjMy4xLTIuNSA0LjctNi4yIDQuNy05LjhWNTkuOWMwLTMuNi0xLjUtNy4zLTQuNy05LDN6bS0xNjIuMiA2MC4yVjY1LjRsNDkuMyAxNTIuMy00OS4zLTE3LjV6bTEyNy44LTE4LjVMOTYgMjEzLjFsNDkuMy0xNy41VjkyLjh6bS02My45LTEuNkw0MS43IDY1LjRsNDguMSAxNy4xIDQ4LjEtMTcuMUw5Ni41IDkxLjV6bTAtNzMuNGw0OC4xIDI1LTQ4LjEgMjUtNDguMS0yNXptMTIuOCA4Ny4zbDI3LjEgMTMuNSAyNy4xLTEzLjUtMjcuMS01NS4xek0xOTMgOTIuOGw0Ny45IDI1LjItNDcuOS0yNS4yek0xOTMgNjUuNEw5Ni40IDIxMy4xbDI1LjQtOTAuNnoiLz48L3N2Zz4='
                  : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>',
                rdns: 'io.metamask.legacy',
              },
              provider: window.ethereum,
            };
            // Add the legacy wallet to the start of the list for prominence
            return [legacyWallet, ...currentWallets];
          }
          return currentWallets;
        });
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
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
        
        // Ensure wallet is on Base Mainnet
        const network = await provider.getNetwork();
        if (network.chainId !== 8453n) {
          try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: '0x2105' }]);
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
              await provider.send('wallet_addEthereumChain', [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]);
            } else {
              throw switchError;
            }
          }
        }
        
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-20">
              <h1 className="text-5xl md:text-7xl font-black font-display mb-6 leading-tight bg-gradient-to-r from-gradient-start to-gradient-end text-transparent bg-clip-text">
                  Launch on Base. Instantly.
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
                Our secure, no-code tool empowers you to deploy a custom ERC20 token in minutes. You get full ownership and control, all on the fast and low-cost Base network.
              </p>
              <motion.button
                  onClick={handleScrollToCreation}
                  className="mt-10 bg-primary text-white font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 ease-in-out shadow-lg hover:shadow-glow-primary"
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
              >
                  Start Creating Your Token
              </motion.button>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Features />
          </motion.div>

          <motion.div ref={creationSectionRef} className="grid grid-cols-1 lg:grid-cols-5 gap-10 my-16 pt-16" variants={itemVariants}>
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
          </motion.div>

        </motion.div>
      </main>
      <Footer />
      <AnimatePresence>
        {isModalOpen && (
          <WalletSelectionModal
            onClose={() => setIsModalOpen(false)}
            wallets={wallets}
            onSelectWallet={handleSelectWallet}
            isConnecting={isConnecting}
            error={connectionError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;