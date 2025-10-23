

import React, { useState } from 'react';
import type { Token } from '../types';
import Card from './Card';

interface LatestTokensProps {
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const TOKENS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(tokens.length / TOKENS_PER_PAGE);
  const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
  const endIndex = startIndex + TOKENS_PER_PAGE;
  const paginatedTokens = tokens.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderBodyContent = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-8 text-text-secondary">
            <p>Loading latest tokens...</p>
          </td>
        </tr>
      );
    }
    
    if (error) {
       return (
          <tr>
            <td colSpan={5}>
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
          <td colSpan={5} className="text-center py-8 text-text-secondary">
            <p>Be the first to launch a token!</p>
          </td>
        </tr>
      );
    }

    return (
      <>
        {paginatedTokens.map((token) => (
          <tr key={token.address} className="border-b border-border hover:bg-white/5 transition-colors">
            <td className="p-3">
                <div className="font-semibold text-text-primary text-sm">{token.name}</div>
                <div className="text-xs text-text-secondary">{token.symbol}</div>
            </td>
              <td className="p-3 font-mono text-xs">
                {token.creator && token.creator !== 'N/A' ? (
                  <a href={`https://basescan.org/address/${token.creator}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" aria-label="View creator on Basescan">
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
                <a href={`https://basescan.org/address/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" aria-label="View token contract on Basescan">
                {abbreviateAddress(token.address)}
              </a>
            </td>
            <td className="p-3">
              <div className="flex items-center gap-3 justify-start">
                {token.website && (
                  <a href={token.website} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Website">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><title>Website Icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </a>
                )}
                {token.twitter && (
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Twitter">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>Twitter logo</title><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {token.telegram && (
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" aria-label="Telegram">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>Telegram logo</title><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.6-2.32 2.2a1.2 1.2 0 01-.86.32z"/></svg>
                  </a>
                )}
                {!token.website && !token.twitter && !token.telegram && (
                  <span className="text-text-secondary text-xs">N/A</span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  const renderPagination = () => {
    if (isLoading || error || tokens.length <= TOKENS_PER_PAGE) {
      return null;
    }

    return (
      <div className="flex justify-between items-center p-3 text-sm border-t border-border">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="bg-border hover:bg-border/80 text-text-primary font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-text-secondary">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="bg-border hover:bg-border/80 text-text-primary font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <Card title="Live on Base">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-h-[400px]">
          <thead className="border-b border-border text-text-secondary uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3">Token</th>
              <th className="p-3">Creator</th>
              <th className="p-3">Age</th>
              <th className="p-3">Contract</th>
              <th className="p-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {renderBodyContent()}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </Card>
  );
};

export default LatestTokens;
