
import React from 'react';
import type { Token } from '../types';
import Card from './Card';

const mockTokens: Token[] = [
  { name: 'Base Pepe', symbol: 'BPEPE', creator: '0x1a2b...c3d4', timestamp: '2 mins ago', address: '0xe5f6...g7h8' },
  { name: 'Factory Coin', symbol: 'FCT', creator: '0x5e6f...g7h8', timestamp: '5 mins ago', address: '0x9i0j...k1l2' },
  { name: 'Test Token', symbol: 'TEST', creator: '0x9i0j...k1l2', timestamp: '12 mins ago', address: '0x3m4n...o5p6' },
  { name: 'Blue Sky', symbol: 'BLUE', creator: '0x3m4n...o5p6', timestamp: '28 mins ago', address: '0x7q8r...s9t0' },
  { name: 'Rocket Ship', symbol: 'ROCK', creator: '0x7q8r...s9t0', timestamp: '1 hour ago', address: '0x1u2v...w3x4' },
];

const LatestTokens: React.FC = () => {
  return (
    <Card title="Latest Tokens Created">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700 text-base-text-secondary">
            <tr>
              <th className="p-3">Token Name</th>
              <th className="p-3">Symbol</th>
              <th className="p-3 hidden md:table-cell">Creator</th>
              <th className="p-3 hidden md:table-cell">Timestamp</th>
              <th className="p-3">Token Address</th>
            </tr>
          </thead>
          <tbody>
            {mockTokens.map((token, index) => (
              <tr key={index} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors">
                <td className="p-3 font-medium text-base-blue">{token.name}</td>
                <td className="p-3">{token.symbol}</td>
                <td className="p-3 hidden md:table-cell font-mono text-sm">{token.creator}</td>
                <td className="p-3 hidden md:table-cell">{token.timestamp}</td>
                <td className="p-3 font-mono text-sm">{token.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LatestTokens;
