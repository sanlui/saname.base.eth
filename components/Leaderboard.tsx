
import React from 'react';
import type { Creator } from '../types';
import Card from './Card';

const mockCreators: Creator[] = [
  { rank: 1, address: '0x1a2b...c3d4', tokensCreated: 152 },
  { rank: 2, address: '0x5e6f...g7h8', tokensCreated: 110 },
  { rank: 3, address: '0x9i0j...k1l2', tokensCreated: 98 },
  { rank: 4, address: '0x3m4n...o5p6', tokensCreated: 76 },
  { rank: 5, address: '0x7q8r...s9t0', tokensCreated: 51 },
];

const Leaderboard: React.FC = () => {
  return (
    <Card title="Creators Leaderboard">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700 text-base-text-secondary">
            <tr>
              <th className="p-3">Rank</th>
              <th className="p-3">Creator Address</th>
              <th className="p-3 text-right">Tokens Created</th>
            </tr>
          </thead>
          <tbody>
            {mockCreators.map((creator) => (
              <tr key={creator.rank} className="border-b border-slate-800 hover:bg-slate-700/50 transition-colors">
                <td className="p-3 font-bold">{creator.rank}</td>
                <td className="p-3 font-mono text-sm text-base-blue">{creator.address}</td>
                <td className="p-3 text-right font-medium">{creator.tokensCreated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default Leaderboard;
