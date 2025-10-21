
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Leaderboard from './components/Leaderboard';
import PlatformActivityChart from './components/PlatformActivityChart';
import { contractAddress, contractABI } from './constants';
import type { Token, Creator } from './types';

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
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccountAddress(address);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        alert("Failed to connect wallet. Please check the console for more details.");
      }
    } else {
      alert("Please install MetaMask or another Ethereum-compatible wallet to use this dApp.");
    }
  };

  const processEventData = async (events: any[], contract: any, provider: any) => {
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
  }

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
      } else {
        setAccountAddress(null);
      }
    };

    const checkIfWalletIsConnected = async () => {
      if (window.ethereum) {
        try {
          const provider = new window.ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccountAddress(accounts[0]);
          }
        } catch (error) {
            console.error("Could not check for connected wallet:", error);
        }
      }
    };

    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  useEffect(() => {
    let contract: any;

    const fetchAndListen = async () => {
      try {
        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        contract = new window.ethers.Contract(contractAddress, contractABI, provider);

        // Fetch historical events
        setIsLoadingTokens(true);
        const filter = contract.filters.TokenCreated();
        // A wider block range to ensure we have enough data for the chart and leaderboard
        const pastEvents = await contract.queryFilter(filter, 'earliest');
        const sortedEvents = [...pastEvents].sort((a, b) => b.blockNumber - a.blockNumber);

        // --- Process for Latest Tokens ---
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

        // Process for Leaderboard and Chart
        processEventData(sortedEvents, contract, provider);

        // Listen for new events
        const handleNewToken = (creator: string, tokenAddress: string, name: string, symbol: string, supply: any) => {
          const newToken: Token = {
            creator,
            address: tokenAddress,
            name,
            symbol,
            supply: supply.toString(),
          };
          setTokens(prevTokens => [newToken, ...prevTokens.slice(0, 9)]);
          // Re-fetch all data to update leaderboard and chart
          fetchAndListen();
        };

        contract.on('TokenCreated', handleNewToken);

      } catch (error) {
        console.error("Error fetching token events:", error);
        setIsLoadingTokens(false);
        setIsLoadingCreators(false);
        setIsLoadingChart(false);
      }
    };

    if (window.ethers) {
      fetchAndListen();
    } else {
      setIsLoadingTokens(false);
      setIsLoadingCreators(false);
      setIsLoadingChart(false);
    }
    
    return () => {
      if (contract) {
        contract.removeAllListeners('TokenCreated');
      }
    };
  }, []);


  return (
    <div className="min-h-screen bg-base-dark font-sans">
      <Header onConnectWallet={handleConnectWallet} accountAddress={accountAddress} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <TokenCreation accountAddress={accountAddress} />
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
    </div>
  );
};

export default App;
