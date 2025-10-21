
import React from 'react';
import type { Token } from '../types';
import Card from './Card';

interface LatestTokensProps {
  tokens: Token[];
  isLoading: boolean;
}

const timeAgo = (timestamp: number | undefined): string => {
    if (timestamp === undefined) return '';
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    if (seconds < 10) return "just now";
    return Math.floor(seconds) + " secs ago";
};


const LatestTokens: React.FC<LatestTokensProps> = ({ tokens, isLoading }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-text-secondary">
          <p>Loading latest tokens...</p>
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className="text-center py-8 text-text-secondary">
          <p>No tokens have been created recently.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">Token</th>
              <th className="p-4">Creator</th>
              <th className="p-4">Created</th>
              <th className="p-4">Token Address</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.address} className="border-b border-border hover:bg-white/5 transition-colors">
                <td className="p-4">
                    <div className="font-semibold text-text-primary">{token.name}</div>
                    <div className="text-sm text-text-secondary">{token.symbol}</div>
                </td>
                 <td className="p-4 font-mono text-sm">
                   <a href={`https://basescan.org/address/${token.creator}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {abbreviateAddress(token.creator)}
                  </a>
                </td>
                <td className="p-4 text-sm text-text-secondary">{timeAgo(token.timestamp)}</td>
                 <td className="p-4 font-mono text-sm">
                   <a href={`https://basescan.org/address/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {abbreviateAddress(token.address)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Card title="Latest Tokens Created">
      {renderContent()}
    </Card>
  );
};

export default LatestTokens;