import React from 'react';
import type { Creator } from '../types';
import Card from './Card';

interface LeaderboardProps {
  creators: Creator[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ creators, isLoading, isRefreshing, onRefresh }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-base-text-secondary">
          <p>Loading leaderboard...</p>
        </div>
      );
    }

    if (creators.length === 0) {
      return (
        <div className="text-center py-8 text-base-text-secondary">
          <p>No creators yet.</p>
        </div>
      );
    }

    return (
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-slate-700 text-base-text-secondary">
          <tr>
            <th className="p-3">Rank</th>
            <th className="p-3">Creator</th>
            <th className="p-3">Total Supply Created</th>
            <th className="p-3">Badge</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => (
            <tr key={creator.address} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors">
              <td className="p-3 font-medium">{creator.rank}</td>
              <td className="p-3 font-mono text-sm">
                <a
                  href={`https://basescan.org/address/${creator.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base-blue hover:underline"
                >
                  {abbreviateAddress(creator.address)}
                </a>
              </td>
              <td className="p-3 text-right font-medium">{Number(creator.totalSupply).toLocaleString()}</td>
              <td className="p-3">{creator.badge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <Card title="Top Token Creators" extra={
      onRefresh && (
        <button
          onClick={onRefresh}
          className="text-sm text-base-blue hover:underline ml-auto"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      )
    }>
      {renderContent()}
    </Card>
  );
};

export default Leaderboard;
