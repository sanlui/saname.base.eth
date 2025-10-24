import React from 'react';
import type { Token } from '../types';
import Card from './Card';

interface LatestTokensProps {
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const timeAgo = (timestamp: number | undefined): string => {
    if (timestamp === undefined) return 'N/A';
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


const LatestTokens: React.FC<LatestTokensProps> = ({ tokens, isLoading, error, onRetry }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderBodyContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="text-center py-8 text-text-secondary">
            <p>Loading latest tokens...</p>
          </td>
        </tr>
      );
    }
    
    if (error) {
       return (
          <tr>
            <td colSpan={4}>
              <div className="text-center py-8 px-4 text-red-300">
                  <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-error/20 mb-3">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="font-semibold text-text-primary">Failed to Load Tokens</p>
                  <p className="text-xs text-text-secondary mt-2 break-words">{error}</p>
                  <button 
                      onClick={onRetry} 
                      className="mt-6 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                      Try Again
                  </button>
              </div>
            </td>
          </tr>
        );
    }

    if (tokens.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="text-center py-8 text-text-secondary">
            <p>No tokens have been created yet.</p>
          </td>
        </tr>
      );
    }

    return (
      <>
        {tokens.slice(0, 10).map((token) => (
          <tr key={token.address} className="border-b border-border hover:bg-white/5 transition-colors">
            <td className="p-3">
                <div className="font-semibold text-text-primary text-sm">{token.name}</div>
                <div className="text-xs text-text-secondary">{token.symbol}</div>
            </td>
              <td className="p-3 font-mono text-xs">
                {token.creator && token.creator !== 'N/A' ? (
                  <a href={`https://basescan.org/address/${token.creator}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {abbreviateAddress(token.creator)}
                </a>
                ) : (
                  <span className="text-text-secondary">N/A</span>
                )}
            </td>
            <td className="p-3 text-xs text-text-secondary">
              {timeAgo(token.timestamp)}
            </td>
            <td className="p-3 font-mono text-xs">
                <a href={`https://basescan.org/address/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {abbreviateAddress(token.address)}
              </a>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <Card title="Latest Tokens Created">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3">Token</th>
              <th className="p-3">Creator</th>
              <th className="p-3">Created</th>
              <th className="p-3">Address</th>
            </tr>
          </thead>
          <tbody>
            {renderBodyContent()}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LatestTokens;