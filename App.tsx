
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';
import { ethers, Contract, BrowserProvider, JsonRpcProvider } from 'ethers';

const App: React.FC = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<JsonRpcProvider | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [baseFee, setBaseFee] = useState<string | null>(null);
  const [allEventsWithTimestamps, setAllEventsWithTimestamps] = useState<any[]>([]);
  
  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

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
    setIsWalletModalOpen(false);
    try {
      const newProvider = new BrowserProvider(wallet.provider);
      const signer = await newProvider.getSigner();
      const address = await signer.getAddress();
      setAccountAddress(address);
      setProvider(newProvider);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect wallet. Please check the console for more details.");
    }
  };
  
  const processDataFromTimestampedEvents = useCallback(async (events: any[]) => {
      setIsLoadingTokens(true);

      // --- Process for Latest Tokens (Screenshot UI) ---
      const latestTokens = events.slice(0, 10);
      const formattedTokens: Token[] = latestTokens.map(event => ({
        creator: event.args!.creator,
        address: event.args!.tokenAddress,
        name: event.args!.name,
        symbol: event.args!.symbol,
        supply: event.args!.supply.toString(),
        timestamp: event.timestamp,
      }));
      setTokens(formattedTokens);
      setIsLoadingTokens(false);
  }, []);

  const fetchInitialChainData = useCallback(async () => {
    if (!readOnlyProvider) return;
    
    try {
      setIsLoadingTokens(true);

      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);

      if (!baseFee) {
        const fee = await contract.baseFee();
        setBaseFee(ethers.formatEther(fee));
      }
      
      const filter = await contract.filters.TokenCreated();
      const latestBlock = await readOnlyProvider.getBlockNumber();
      const startingBlock = 3713640;
      // CRITICAL FIX: Use a very conservative chunk size and delay to be compatible with free RPC providers.
      const chunkSize = 499;
      let pastEvents = [];

      for (let i = startingBlock; i <= latestBlock; i += chunkSize) {
          const fromBlock = i;
          const toBlock = Math.min(i + chunkSize - 1, latestBlock);
          const chunkEvents = await contract.queryFilter(filter, fromBlock, toBlock);
          pastEvents.push(...chunkEvents);
          // Add a longer delay to prevent rate-limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const blockNumbers = [...new Set(pastEvents.map(e => e.blockNumber))];
      const blockMap = new Map<number, any>();
      
      // CRITICAL FIX: Fetch block data in batches to avoid overwhelming the RPC provider with a burst of requests.
      const blockBatchSize = 10;
      for (let i = 0; i < blockNumbers.length; i += blockBatchSize) {
        const batch = blockNumbers.slice(i, i + blockBatchSize);
        const blockPromises = batch.map(num => readOnlyProvider.getBlock(num));
        const resolvedBlocks = await Promise.all(blockPromises);
        resolvedBlocks.forEach(block => {
            if (block) blockMap.set(block.number, block);
        });
        // Add a delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const eventsWithTimestamps = pastEvents.map(event => ({
        ...event,
        timestamp: blockMap.get(event.blockNumber)!.timestamp * 1000,
      }));
      
      const sortedEvents = [...eventsWithTimestamps].sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
      
      setAllEventsWithTimestamps(sortedEvents);

    } catch (error) {
      console.error("Error fetching chain data:", error);
      setIsLoadingTokens(false);
    }
  }, [readOnlyProvider, baseFee]);
  
  useEffect(() => {
    if(readOnlyProvider) {
      fetchInitialChainData();
    }
  }, [readOnlyProvider, fetchInitialChainData]);

  useEffect(() => {
    if (allEventsWithTimestamps.length > 0) {
        processDataFromTimestampedEvents(allEventsWithTimestamps);
    } else {
      const loadingStates = [isLoadingTokens];
      if (loadingStates.some(Boolean)) {
         setTimeout(() => {
           if(allEventsWithTimestamps.length === 0) {
              setIsLoadingTokens(false);
           }
         }, 2000);
      }
    }
  }, [allEventsWithTimestamps, processDataFromTimestampedEvents, isLoadingTokens]);

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
  
  const onTokenCreated = useCallback((eventFromReceipt: any) => {
    const addEvent = async () => {
      if (!readOnlyProvider) return;

      const exists = allEventsWithTimestamps.some(
        (e) => e.transactionHash === eventFromReceipt.transactionHash && e.logIndex === eventFromReceipt.logIndex
      );

      if (exists) return;

      try {
        const block = await readOnlyProvider.getBlock(eventFromReceipt.blockNumber);
        const newEventObject = {
          ...eventFromReceipt,
          timestamp: block!.timestamp * 1000,
        };
        setAllEventsWithTimestamps((prevEvents) => [newEventObject, ...prevEvents].sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex));
      } catch (error) {
        console.error("Error fetching block for new event:", error);
      }
    };

    addEvent();
  }, [allEventsWithTimestamps, readOnlyProvider]);

  useEffect(() => {
    if (!readOnlyProvider) return;
    
    const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
    
    const handleNewToken = async (...args: any[]) => {
        const event = args[args.length - 1];
        const parsedEvent = {
            ...event,
            args: contract.interface.parseLog(event).args,
        };
        onTokenCreated(parsedEvent);
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
        onClose={() => setIsWalletModalOpen(false)}
        wallets={availableWallets}
        onSelectWallet={handleSelectWallet}
      />
    </div>
  );
};

export default App;
