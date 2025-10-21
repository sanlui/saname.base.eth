
import React from 'react';
import type { Creator } from '../types';
import Card from './Card';

interface LeaderboardProps {
    creators: Creator[];
    isLoading: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ creators, isLoading }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getBadgeColor = (badge: string) => {
    switch(badge) {
        case 'Super Minter': return 'bg-purple-500/20 text-purple-300';
        case 'Token Master': return 'bg-yellow-500/20 text-yellow-300';
        case 'Novice Creator': return 'bg-blue-500/20 text-blue-300';
        case 'New Creator': return 'bg-gray-500/20 text-gray-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
  }
  
  const renderContent = () => {
    if (isLoading) {
        return <div className="text-center py-8 text-base-text-secondary"><p>Loading leaderboard...</p></div>;
    }

    if (creators.length === 0) {
        return <div className="text-center py-8 text-base-text-secondary"><p>No creators yet. Be the first!</p></div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-slate-700 text-base-text-secondary">
                    <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Creator</th>
                        <th className="p-3">Badge</th>
                        <th className="p-3 text-right">Total Supply Created</th>
                    </tr>
                </thead>
                <tbody>
                    {creators.map((creator) => (
                        <tr key={creator.rank} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors">
                            <td className="p-3 font-bold text-lg">{creator.rank}</td>
                            <td className="p-3 font-mono text-sm">
                                <a href={`https://basescan.org/address/${creator.address}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">
                                    {abbreviateAddress(creator.address)}
                                </a>
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${getBadgeColor(creator.badge)}`}>
                                    {creator.badge}
                                </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                                {Number(window.ethers.utils.formatUnits(creator.totalSupply, 0)).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
  }

  return (
    <Card title="Creators Leaderboard">
      {renderContent()}
    </Card>
  );
};

export default Leaderboard;
