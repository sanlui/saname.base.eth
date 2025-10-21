
import React from 'react';
import type { Creator } from '../types';
import Card from './Card';

interface LeaderboardProps {
    creators: Creator[];
    isLoading: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ creators, isLoading, onRefresh, isRefreshing }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const renderContent = () => {
    if (isLoading && creators.length === 0) {
        return <div className="text-center py-8 text-text-secondary"><p>Loading leaderboard...</p></div>;
    }

    if (creators.length === 0) {
        return <div className="text-center py-8 text-text-secondary"><p>No creators yet. Be the first!</p></div>;
    }

    const getRankColor = (rank: number) => {
      if (rank === 1) return 'text-amber-400';
      if (rank === 2) return 'text-slate-300';
      if (rank === 3) return 'text-amber-600';
      return 'text-text-secondary';
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
                    <tr>
                        <th className="p-4 text-center">Rank</th>
                        <th className="p-4">Creator Address</th>
                        <th className="p-4 text-right">Tokens Created</th>
                    </tr>
                </thead>
                <tbody>
                    {creators.map((creator) => (
                        <tr key={creator.address} className="border-b border-border hover:bg-white/5 transition-colors">
                            <td className={`p-4 font-bold text-lg text-center ${getRankColor(creator.rank)}`}>{creator.rank}</td>
                            <td className="p-4 font-mono text-sm">
                                <a href={`https://basescan.org/address/${creator.address}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {abbreviateAddress(creator.address)}
                                </a>
                            </td>
                            <td className="p-4 text-right font-medium text-lg text-text-primary">
                                {creator.tokensCreated.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }
  
  const refreshButton = (
    <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-sm text-primary hover:text-primary-hover disabled:text-text-secondary disabled:cursor-wait transition-colors flex items-center"
    >
        <svg 
            className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 11M20 20l-1.5-1.5A9 9 0 003.5 13" />
        </svg>
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );

  return (
    <Card title="Creators Leaderboard" action={refreshButton}>
      {renderContent()}
    </Card>
  );
};

export default Leaderboard;