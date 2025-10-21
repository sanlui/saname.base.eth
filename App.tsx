
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TokenCreation from './components/TokenCreation';
import LatestTokens from './components/LatestTokens';
import Leaderboard from './components/Leaderboard';
import PlatformActivityChart from './components/PlatformActivityChart';
import { contractAddress, contractABI } from './constants';
import type { Token } from './types';

declare global {
  interface Window {
    ethereum?: any;
    ethers?: any;
  }
}

const App: React.FC = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

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
    const fetchAndListen = async () => {
      try {
        const provider = new window.ethers.providers.Web3Provider(window.ethereum);
        const contract = new window.ethers.Contract(contractAddress, contractABI, provider);

        // Fetch historical events
        setIsLoadingTokens(true);
        const filter = contract.filters.TokenCreated();
        const pastEvents = await contract.queryFilter(filter, -20000); // Look at last ~3 days of blocks
        const sortedEvents = pastEvents.sort((a, b) => b.blockNumber - a.blockNumber).slice(0, 10);

        const formattedTokens: Token[] = sortedEvents.map(event => ({
          creator: event.args!.creator,
          address: event.args!.tokenAddress,
          name: event.args!.name,
          symbol: event.args!.symbol,
          supply: event.args!.supply.toString(),
        }));
        setTokens(formattedTokens);
        setIsLoadingTokens(false);

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
        };

        contract.on('TokenCreated', handleNewToken);

        return () => {
          contract.off('TokenCreated', handleNewToken);
        };
      } catch (error) {
        console.error("Error fetching token events:", error);
        setIsLoadingTokens(false);
      }
    };

    if (window.ethers) {
      fetchAndListen();
    } else {
        setIsLoadingTokens(false);
    }
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
              <Leaderboard />
            </div>
            <div>
              <PlatformActivityChart />
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
