
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Leaderboard from './components/Leaderboard';
import PlatformActivityChart from './components/PlatformActivityChart';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, Creator, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';
import { ethers, Contract, FallbackProvider, BrowserProvider, JsonRpcProvider, BigNumberish } from 'ethers';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

const App: React.FC = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<FallbackProvider | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [baseFee, setBaseFee] = useState<string | null>(null);
  const [allEventsWithTimestamps, setAllEventsWithTimestamps] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    const providers = [
        new JsonRpcProvider('https://mainnet.base.org'),
        new JsonRpcProvider('https://base.publicnode.com'),
        new JsonRpcProvider('https://rpc.ankr.com/base'),
        new JsonRpcProvider('https://base.drpc.org'),
    ];
    const fallbackProvider = new FallbackProvider(providers, 1);
    setReadOnlyProvider(fallbackProvider);
    
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
  
  const processDataFromTimestampedEvents = useCallback(async (events: any[], contract: Contract) => {
      setIsLoadingTokens(true);
      setIsLoadingCreators(true);
      setIsLoadingChart(true);

      // --- Process for Latest Tokens ---
      const latestTokens = events.slice(0, 10);
      const formattedTokens: Token[] = latestTokens.map(event => ({
        creator: event.args!.creator,
        address: event.args!.tokenAddress,
        name: event.args!.name,
        symbol: event.args!.symbol,
        supply: event.args!.supply.toString(),
      }));
      setTokens(formattedTokens);
      setIsLoadingTokens(false);
      
      // --- Process for Leaderboard ---
      const supplyByCreator = new Map<string, bigint>();
      events.forEach(event => {
        const { creator, supply } = event.args;
        const currentSupply = supplyByCreator.get(creator) || BigInt(0);
        supplyByCreator.set(creator, currentSupply + supply);
      });

      const sortedCreators = Array.from(supplyByCreator.entries())
        .sort(([, a], [, b]) => (a > b ? -1 : 1))
        .slice(0, 10);
      
      const topCreatorsWithBadges: Creator[] = await Promise.all(
        sortedCreators.map(async ([address, totalSupply], index) => {
          const badge = await contract.getBadge(address);
          return {
            rank: index + 1,
            address,
            totalSupply: totalSupply.toString(),
            badge,
          };
        })
      );
      setCreators(topCreatorsWithBadges);
      setIsLoadingCreators(false);

      // --- Process for Chart ---
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentEvents = events.filter(e => e.timestamp >= thirtyDaysAgo);

      const dailyCounts = new Map<string, number>();
      recentEvents.forEach(event => {
          const date = new Date(event.timestamp).toISOString().split('T')[0];
          dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
      });

      const labels = [];
      const data = [];
      for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateString = d.toISOString().split('T')[0];
          const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          labels.push(monthDay);
          data.push(dailyCounts.get(dateString) || 0);
      }

      setChartData({
          labels,
          datasets: [{
              label: 'Tokens Created',
              data,
              backgroundColor: '#0052FF',
          }]
      });
      setIsLoadingChart(false);
  }, []);

  const fetchInitialChainData = useCallback(async (isRefresh: boolean = false) => {
    if (!readOnlyProvider) return;
    if(isRefresh) setIsRefreshing(true);
    
    try {
      setIsLoadingTokens(true);
      setIsLoadingCreators(true);
      setIsLoadingChart(true);

      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);

      if (!baseFee) {
        const fee = await contract.baseFee();
        setBaseFee(ethers.formatEther(fee));
      }
      
      const filter = contract.filters.TokenCreated();
      const latestBlock = await readOnlyProvider.getBlockNumber();
      const startingBlock = 0; // Or a more recent block number for performance
      const chunkSize = 20000;
      let pastEvents = [];

      for (let i = startingBlock; i <= latestBlock; i += chunkSize) {
          const fromBlock = i;
          const toBlock = Math.min(i + chunkSize - 1, latestBlock);
          const chunkEvents = await contract.queryFilter(filter, fromBlock, toBlock);
          pastEvents.push(...chunkEvents);
      }
      
      const blockNumbers = [...new Set(pastEvents.map(e => e.blockNumber))];
      const blockMap = new Map<number, any>();
      const blockPromises = blockNumbers.map(num => readOnlyProvider.getBlock(num));
      const resolvedBlocks = await Promise.all(blockPromises);
      resolvedBlocks.forEach(block => blockMap.set(block.number, block));

      const eventsWithTimestamps = pastEvents.map(event => ({
        ...event,
        timestamp: blockMap.get(event.blockNumber)!.timestamp * 1000,
      }));
      
      const sortedEvents = [...eventsWithTimestamps].sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
      
      setAllEventsWithTimestamps(sortedEvents);

    } catch (error) {
      console.error("Error fetching chain data:", error);
      setIsLoadingTokens(false);
      setIsLoadingCreators(false);
      setIsLoadingChart(false);
    } finally {
      if(isRefresh) setIsRefreshing(false);
    }
  }, [readOnlyProvider, baseFee]);
  
  useEffect(() => {
    if(readOnlyProvider) {
      fetchInitialChainData();
    }
  }, [readOnlyProvider, fetchInitialChainData]);

  useEffect(() => {
    if (allEventsWithTimestamps.length > 0 && readOnlyProvider) {
        const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
        processDataFromTimestampedEvents(allEventsWithTimestamps, contract);
    }
  }, [allEventsWithTimestamps, readOnlyProvider, processDataFromTimestampedEvents]);

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
          timestamp: block.timestamp * 1000,
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
        onTokenCreated(event);
    };

    contract.on('TokenCreated', handleNewToken);
    
    return () => {
      contract.removeAllListeners('TokenCreated');
    };
  }, [readOnlyProvider, onTokenCreated]);

  return (
    <div className="min-h-screen bg-base-dark font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <TokenCreation 
            accountAddress={accountAddress} 
            provider={provider} 
            baseFee={baseFee}
            onTokenCreated={onTokenCreated}
          />
          <LatestTokens tokens={tokens} isLoading={isLoadingTokens} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Leaderboard 
                creators={creators} 
                isLoading={isLoadingCreators} 
                onRefresh={() => fetchInitialChainData(true)}
                isRefreshing={isRefreshing}
              />
            </div>
            <div>
              <PlatformActivityChart chartData={chartData} isLoading={isLoadingChart} />
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-base-text-secondary">
        <p>&copy; 2024 Base Token Factory. All Rights Reserved.</p>
        <p className="text-xs mt-2 max-w-2xl mx-auto px-4">
            This platform exclusively tracks tokens created with the contract at address{' '}
            <a 
                href={`https://basescan.org/address/${contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-base-blue hover:underline font-mono"
            >
                {contractAddress}
            </a>
            {' '}on the Base network.
        </p>
      </footer>
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