import React, { useState } from 'react';
import { ethers, Contract } from 'ethers';
import { contractAddress, contractABI } from '../constants';
import type { BrowserProvider } from 'ethers';

interface TokenCreationProps {
  accountAddress: string | null;
  provider: BrowserProvider | null;
  baseFee: string | null;
  onTokenCreated?: (event: any) => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ accountAddress, provider, baseFee, onTokenCreated }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateToken = async () => {
    if (!provider || !accountAddress) {
      alert("Connect your wallet first!");
      return;
    }
    if (!name || !symbol || !supply) {
      alert("Fill all fields!");
      return;
    }

    try {
      setIsCreating(true);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const fee = baseFee ? ethers.parseEther(baseFee) : ethers.parseEther('0.00005');
      const tx = await contract.createToken(name, symbol, supply, { value: fee });
      const receipt = await tx.wait();

      // Get TokenCreated event from receipt
      const event = receipt.events?.find(e => e.event === 'TokenCreated');
      if (event && onTokenCreated) {
        // Pass event to parent for immediate UI update
        onTokenCreated(event);
      }

      alert(`Token created successfully! Address: ${event?.args?.tokenAddress}`);
      setName('');
      setSymbol('');
      setSupply('');
    } catch (err) {
      console.error("Error creating token:", err);
      alert("Failed to create token. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-base-dark rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold mb-4">Create New Token</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Token Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 rounded border border-gray-600 bg-base-dark text-white"
        />
        <input
          type="text"
          placeholder="Token Symbol"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          className="w-full p-2 rounded border border-gray-600 bg-base-dark text-white"
        />
        <input
          type="number"
          placeholder="Initial Supply"
          value={supply}
          onChange={e => setSupply(e.target.value)}
          className="w-full p-2 rounded border border-gray-600 bg-base-dark text-white"
        />
        <button
          onClick={handleCreateToken}
          disabled={isCreating || !accountAddress}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : `Create Token (Fee: ${baseFee || '0.00005'} ETH)`}
        </button>
      </div>
    </div>
  );
};

export default TokenCreation;
