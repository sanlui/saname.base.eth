import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Leaderboard from './components/Leaderboard';
import PlatformActivityChart from './components/PlatformActivityChart';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, Creator, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';
import { ethers, Contract, FallbackProvider, BrowserProvider, JsonRpcProvider, WebSocketProvider } from 'ethers';

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

  // --- Initialize read-only providers & wallet detection ---
  useEffect(() => {
    const providers = [
      new JsonRpcProvider('https://mainnet.base.org'),
      new JsonRpcProvider('https://base.publicnode.com'),
      new JsonRpcProvider('https://rpc.ankr.com/base'),
      new JsonRpcProvider('https://base.drpc.org'),
    ];
    setReadOnlyProvider(new FallbackProvider(providers, 1));

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

  const handleConnectWallet = () => setIsWalletModalOpen(true);

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
      alert("Failed to connect wallet. Check console for details.");
    }
  };

  // --- Process events into tokens, leaderboard, and chart ---
  const processDataFromTimestampedEvents = useCallback(async (events: any[], contract: Contract) => {
    setIsLoadingTokens(true);
    setIsLoadingCreators(true);
    setIsLoadingChart(true);

    // Latest Tokens
    const latestTokens = events.slice(0, 10).map(event => ({
      creator: event.args.creator,
      address: event.args.tokenAddress,
      name: event.args.name,
      symbol: event.args.symbol,
      supply: event.args.supply.toString(),
    }));
    setTokens(latestTokens);
    setIsLoadingTokens(false);

    // Leaderboard
    const supplyByCreator = new Map<string, bigint>();
    events.forEach(event => {
      const { creator, supply } = event.args;
      const current = supplyByCreator.get(creator) || BigInt(0);
      supplyByCreator.set(creator, current + supply);
    });
    const sortedCreators = Array.from(supplyByCreator.entries())
      .sort(([, a], [, b]) => (a > b ? -1 : 1))
      .slice(0, 10);
    const topCreators: Creator[] = await Promise.all(sortedCreators.map(async ([address, total], i) => ({
      rank: i + 1,
      address,
      totalSupply: total.toString(),
      badge: await contract.getBadge(address)
    })));
    setCreators(topCreators);
    setIsLoadingCreators(false);

    // Chart Data
    const thirtyDaysAgo = Date.now() - 30*24*60*60*1000;
    const recentEvents = events.filter(e => e.timestamp >= thirtyDaysAgo);
    const dailyCounts = new Map<string, number>();
    recentEvents.forEach(e => {
      const date = new Date(e.timestamp).toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(dailyCounts.get(ds) || 0);
    }
    setChartData({ labels, datasets: [{ label: 'Tokens Created', data, backgroundColor: '#0052FF' }]});
    setIsLoadingChart(false);
  }, []);

  // --- Fetch initial events from chain ---
  const fetchInitialChainData = useCallback(async (isRefresh = false) => {
    if (!readOnlyProvider) return;
    if (isRefresh) setIsRefreshing(true);

    try {
      setIsLoadingTokens(true); setIsLoadingCreators(true); setIsLoadingChart(true);
      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
      if (!baseFee) {
        const fee = await contract.baseFee();
        setBaseFee(ethers.formatEther(fee));
      }

      const filter = contract.filters.TokenCreated();
      const latestBlock = await readOnlyProvider.getBlockNumber();
      const chunkSize = 20000;
      let allEvents: any[] = [];

      for (let i=0; i<=latestBlock; i+=chunkSize) {
        const fromBlock = i;
        const toBlock = Math.min(i+chunkSize-1, latestBlock);
        const chunkEvents = await contract.queryFilter(filter, fromBlock, toBlock);
        allEvents.push(...chunkEvents);
      }

      const blockMap = new Map<number, any>();
      const blockNumbers = [...new Set(allEvents.map(e => e.blockNumber))];
      const resolvedBlocks = await Promise.all(blockNumbers.map(num => readOnlyProvider.getBlock(num)));
      resolvedBlocks.forEach(b => blockMap.set(b.number, b));

      const eventsWithTimestamps = allEvents.map(e => ({ ...e, timestamp: blockMap.get(e.blockNumber)!.timestamp * 1000 }));
      const sortedEvents = [...eventsWithTimestamps].sort((a,b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
      setAllEventsWithTimestamps(sortedEvents);

    } catch (err) {
      console.error("Error fetching chain data:", err);
      setIsLoadingTokens(false); setIsLoadingCreators(false); setIsLoadingChart(false);
    } finally {
      if (isRefresh) setIsRefreshing(false);
    }
  }, [readOnlyProvider, baseFee]);

  useEffect(() => { if(readOnlyProvider) fetchInitialChainData(); }, [readOnlyProvider, fetchInitialChainData]);

  useEffect(() => {
    if(allEventsWithTimestamps.length>0 && readOnlyProvider){
      const contract = new Contract(contractAddress, contractABI, readOnlyProvider);
      processDataFromTimestampedEvents(allEventsWithTimestamps, contract);
    }
  }, [allEventsWithTimestamps, readOnlyProvider, processDataFromTimestampedEvents]);

  // --- Wallet events ---
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if(accounts.length>0) setAccountAddress(accounts[0]);
      else { setAccountAddress(null); setProvider(null); }
    };
    provider?.provider.on?.('accountsChanged', handleAccountsChanged);
    return () => provider?.provider.removeListener?.('accountsChanged', handleAccountsChanged);
  }, [provider]);

  // --- Real-time TokenCreated events using WebSocket ---
  useEffect(() => {
    if (!readOnlyProvider) return;

    const wsProvider = new WebSocketProvider('wss://mainnet.base.org/ws');
    const contract = new Contract(contractAddress, contractABI, wsProvider);

    const handleNewToken = async (creator:any, tokenAddress:any, name:string, symbol:string, supply:any, feePaid:any, event:any) => {
      const newEventObject = {
        ...event,
        args: { creator, tokenAddress, name, symbol, supply },
        timestamp: (await wsProvider.getBlock(event.blockNumber)).timestamp * 1000
      };
      setAllEventsWithTimestamps(prev => [newEventObject, ...prev].sort((a,b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex));
    };

    contract.on('TokenCreated', handleNewToken);

    return () => { contract.removeAllListeners('TokenCreated'); };
  }, [readOnlyProvider]);

  return (
    <div className="min-h-screen bg-base-dark font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <TokenCreation accountAddress={accountAddress} provider={provider} baseFee={baseFee} />
          <LatestTokens tokens={tokens} isLoading={isLoadingTokens} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Leaderboard creators={creators} isLoading={isLoadingCreators} onRefresh={() => fetchInitialChainData(true)} isRefreshing={isRefreshing} />
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
          <a href={`https://basescan.org/address/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline font-mono">
            {contractAddress}
          </a> on the Base network.
        </p>
      </footer>
      <WalletSelectionModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} wallets={availableWallets} onSelectWallet={handleSelectWallet} />
    </div>
  );
};

export default App;
