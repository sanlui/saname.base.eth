
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Leaderboard from './components/Leaderboard';
import PlatformActivityChart from './components/PlatformActivityChart';
import WalletSelectionModal from './components/WalletSelectionModal';
import { contractAddress, contractABI } from './constants';
import type { Token, Creator, EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from './types';

declare global {
  interface Window {
    ethereum?: any;
    ethers?: any;
  }
}

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
  const [provider, setProvider] = useState<any>(null);
  const [readOnlyProvider, setReadOnlyProvider] = useState<any>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [baseFee, setBaseFee] = useState<string | null>(null);

  const [availableWallets, setAvailableWallets] = useState<EIP6963ProviderDetail[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    const onAnnounceProvider = (event: EIP6963AnnounceProviderEvent) => {
      setAvailableWallets(prev => {
        if (prev.some(p => p.info.uuid === event.detail.info.uuid)) return prev;
        return [...prev, event.detail];
      });
      if (!readOnlyProvider) {
        setReadOnlyProvider(new window.ethers.providers.Web3Provider(event.detail.provider));
      }
    };
    
    window.addEventListener('eip6963:announceProvider', onAnnounceProvider);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      window.removeEventListener('eip6963:announceProvider', onAnnounceProvider);
    };
  }, [readOnlyProvider]);

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };

  const handleSelectWallet = async (wallet: EIP6963ProviderDetail) => {
    setIsWalletModalOpen(false);
    try {
      const newProvider = new window.ethers.providers.Web3Provider(wallet.provider);
      await newProvider.send("eth_requestAccounts", []);
      const signer = newProvider.getSigner();
      const address = await signer.getAddress();
      setAccountAddress(address);
      setProvider(newProvider);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect wallet. Please check the console for more details.");
    }
  };
  
  const processEventData = useCallback(async (events: any[], contract: any, provider: any) => {
      // --- Process for Leaderboard ---
      setIsLoadingCreators(true);
      const supplyByCreator = new Map<string, any>();
      events.forEach(event => {
        const { creator, supply } = event.args;
        if (supplyByCreator.has(creator)) {
          supplyByCreator.set(creator, supplyByCreator.get(creator).add(supply));
        } else {
          supplyByCreator.set(creator, supply);
        }
      });
      const sortedCreators = Array.from(supplyByCreator.entries())
        .sort(([, a], [, b]) => b.sub(a).isNegative() ? -1 : 1)
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
      setIsLoadingChart(true);
      const blocks = await Promise.all(events.map(e => provider.getBlock(e.blockNumber)));
      const eventsWithTimestamps = events.map((event, index) => ({
          ...event,
          timestamp: blocks[index].timestamp * 1000,
      }));

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentEvents = eventsWithTimestamps.filter(e => e.timestamp >= thirtyDaysAgo);

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

  const fetchAllChainData = useCallback(async () => {
    if (!readOnlyProvider) return;
    try {
      setIsLoadingTokens(true);
      const contract = new window.ethers.Contract(contractAddress, contractABI, readOnlyProvider);

      const fee = await contract.baseFee();
      setBaseFee(window.ethers.utils.formatEther(fee));

      const filter = contract.filters.TokenCreated();
      const pastEvents = await contract.queryFilter(filter, 'earliest');
      const sortedEvents = [...pastEvents].sort((a, b) => b.blockNumber - a.blockNumber);

      const latestTokens = sortedEvents.slice(0, 10);
      const formattedTokens: Token[] = latestTokens.map(event => ({
        creator: event.args!.creator,
        address: event.args!.tokenAddress,
        name: event.args!.name,
        symbol: event.args!.symbol,
        supply: event.args!.supply.toString(),
      }));
      setTokens(formattedTokens);
      setIsLoadingTokens(false);
      
      await processEventData(sortedEvents, contract, readOnlyProvider);

    } catch (error) {
      console.error("Error fetching chain data:", error);
      setIsLoadingTokens(false);
      setIsLoadingCreators(false);
      setIsLoadingChart(false);
    }
  }, [readOnlyProvider, processEventData]);


  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
      } else {
        setAccountAddress(null);
        setProvider(null);
      }
    };

    if (provider?.provider) {
        provider.provider.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (provider?.provider) {
        provider.provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [provider]);
  
  useEffect(() => {
    if (!readOnlyProvider) return;

    fetchAllChainData();
    
    const contract = new window.ethers.Contract(contractAddress, contractABI, readOnlyProvider);
    
    const handleNewToken = (creator: string, tokenAddress: string, name: string, symbol: string, supply: any) => {
      const newToken: Token = {
        creator,
        address: tokenAddress,
        name,
        symbol,
        supply: supply.toString(),
      };
      setTokens(prevTokens => [newToken, ...prevTokens.slice(0, 9)]);
      fetchAllChainData();
    };

    contract.on('TokenCreated', handleNewToken);
    
    return () => {
      contract.removeAllListeners('TokenCreated');
    };
  }, [readOnlyProvider, fetchAllChainData]);


  return (
    <div className="min-h-screen bg-base-dark font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <TokenCreation accountAddress={accountAddress} provider={provider} baseFee={baseFee} />
          <LatestTokens tokens={tokens} isLoading={isLoadingTokens} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Leaderboard creators={creators} isLoading={isLoadingCreators} />
            </div>
            <div>
              <PlatformActivityChart chartData={chartData} isLoading={isLoadingChart} />
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-base-text-secondary">
        <p>&copy; 2024 Base Token Factory. All Rights Reserved.</p>
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
