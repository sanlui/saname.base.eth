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
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { sdk } from '@farcaster/miniapp-sdk';

declare global {
  interface Window {
    ethereum?: EIP1193Provider & { isMetaMask?: boolean };
    dispatchedEip6963Request?: boolean;
  }
}

const announceProvider = () => {
  try {
    if (!window.dispatchedEip6963Request) {
      window.dispatchEvent(new Event('eip6963:requestProvider'));
      window.dispatchedEip6963Request = true;
    }
  } catch (error) {
    console.error('Could not dispatch eip6963:requestProvider event.', error);
  }
};

const createSignatureMessage = (address: string, chainId: number, nonce: string): string => {
  const domain = window.location.host;
  const origin = window.location.origin;
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

This is a secure, gas-free message to verify ownership of your wallet. This action will not trigger a blockchain transaction.

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
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
  const [userBadge, setUserBadge] = useState<string | null>(null);

  const creationSectionRef = useRef<HTMLDivElement>(null);

  // 🔹 Farcaster Mini App: hide splash screen
  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        await sdk.actions.ready();
        console.log("Mini App ready, splash screen hidden!");
      } catch (error) {
        console.error("Failed to call sdk.actions.ready():", error);
      }
    };

    initializeFarcaster();
  }, []);

  useEffect(() => {
    const provider = new JsonRpcProvider('https://base.publicnode.com', 8453);
    setReadOnlyProvider(provider);
  }, []);

  useEffect(() => {
    const ALLOWED_WALLETS_RDNS = [
      'io.metamask',
      'com.coinbase.wallet',
      'io.zerion.wallet',
      'com.okex.wallet',
      'com.okx.web3.wallet',
      'me.rainbow'
    ];

    const handleAnnounceProvider = (event: Event) => {
      const providerDetail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (ALLOWED_WALLETS_RDNS.includes(providerDetail.info.rdns)) {
        setWallets(currentWallets => {
          if (currentWallets.some(w => w.info.uuid === providerDetail.info.uuid)) {
            return currentWallets;
          }
          return [...currentWallets, providerDetail].sort((a, b) => a.info.name.localeCompare(b.info.name));
        });
      }
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

  const fetchUserBadge = useCallback(async (address: string) => {
    if (!readOnlyProvider) return;
    try {
      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
      const badge = await contract.getBadge(address);
      setUserBadge(badge || null);
    } catch (error) {
      console.warn(`Could not fetch badge for ${address}:`, error);
      setUserBadge(null);
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
            
            let badge;
            try {
                badge = await contract.getBadge(args.creator);
            } catch (badgeError) {
                console.warn(`Could not fetch badge for creator ${args.creator}:`, badgeError);
                badge = undefined;
            }

            return {
                name: args.name,
                symbol: args.symbol,
                creator: args.creator,
                address: tokenAddress,
                supply: args.supply.toString(),
                timestamp: block ? block.timestamp * 1000 : undefined,
                txHash: log.transactionHash,
                decimals: 18,
                website: localMeta.website,
                twitter: localMeta.twitter,
                telegram: localMeta.telegram,
                description: localMeta.description,
                badge: badge || undefined,
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
    if (accountAddress) fetchUserBadge(accountAddress);
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
  };

  const handleConnectWallet = () => {
    setIsModalOpen(true);
    setConnectionError(null);
  };
  
  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
        let browserProvider = new BrowserProvider(wallet.provider);
        const network = await browserProvider.getNetwork();
        if (network.chainId !== 8453n) {
          try {
            await browserProvider.send('wallet_switchEthereumChain', [{ chainId: '0x2105' }]);
            browserProvider = new BrowserProvider(wallet.provider);
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await browserProvider.send('wallet_addEthereumChain', [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]);
              browserProvider = new BrowserProvider(wallet.provider);
            } else throw switchError;
          }
        }
        
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();

        if (address) {
            const currentNetwork = await browserProvider.getNetwork();
            const nonce = window.crypto.randomUUID();
            const message = createSignatureMessage(address, Number(currentNetwork.chainId), nonce);
            await signer.signMessage(message);

            setAccountAddress(address);
            setProvider(browserProvider);
            fetchUserBadge(address);
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
    setUserBadge(null);
  };
  
  const handleScrollToCreation = () => {
    creationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} onDisconnect={handleDisconnect} userBadge={userBadge} />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <motion.div className="max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="text-center mb-20">
              <h1 className="text-5xl md:text-7xl font-black font-display mb-6 leading-tight bg-gradient-to-r from-gradient-start to-gradient-end text-transparent bg-clip-text">
                  Launch on Base. Instantly.
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
                Our secure, no-code platform lets you deploy your custom token in minutes, giving you full ownership and control on the fast, low-cost Base network.
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
          
          <motion.div variants={itemVariants}><Features /></motion.div>

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
