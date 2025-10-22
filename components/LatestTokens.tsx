
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

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;

    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;

    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h ago`;

    const days = hours / 24;
    if (days < 30) return `${Math.floor(days)}d ago`;

    const months = days / 30;
    if (months < 12) return `${Math.floor(months)}mo ago`;

    const years = days / 365;
    return `${Math.floor(years)}y ago`;
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
            <p>Be the first to launch a token!</p>
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
    <Card title="Live on Base">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3">Token</th>
              <th className="p-3">Creator</th>
              <th className="p-3">Age</th>
              <th className="p-3">Contract</th>
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
