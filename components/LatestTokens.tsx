
import React from 'react';
import type { Token } from '../types';
import Card from './Card';

interface LatestTokensProps {
  tokens: Token[];
  isLoading: boolean;
}

const LatestTokens: React.FC<LatestTokensProps> = ({ tokens, isLoading }) => {
  const abbreviateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-base-text-secondary">
          <p>Loading latest tokens...</p>
        </div>
      );
    }

    if (tokens.length === 0) {
      return (
        <div className="text-center py-8 text-base-text-secondary">
          <p>No tokens have been created recently.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700 text-base-text-secondary">
            <tr>
              <th className="p-3">Creator</th>
              <th className="p-3">Token Address</th>
              <th className="p-3">Name</th>
              <th className="p-3">Symbol</th>
              <th className="p-3 text-right">Supply</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <tr key={`${token.address}-${index}`} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors">
                <td className="p-3 font-mono text-sm">
                   <a href={`https://basescan.org/address/${token.creator}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">
                    {abbreviateAddress(token.creator)}
                  </a>
                </td>
                 <td className="p-3 font-mono text-sm">
                   <a href={`https://basescan.org/address/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-base-blue hover:underline">
                    {abbreviateAddress(token.address)}
                  </a>
                </td>
                <td className="p-3 font-medium">{token.name}</td>
                <td className="p-3">{token.symbol}</td>
                <td className="p-3 text-right font-medium">{Number(token.supply).toLocaleString()}</td>
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
