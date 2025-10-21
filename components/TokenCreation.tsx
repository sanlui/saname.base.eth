
import React, { useState } from 'react';
import Card from './Card';
import SuccessModal from './SuccessModal';
import { contractAddress, contractABI } from '../constants';
import type { Token } from '../types';
import { ethers, BrowserProvider, Contract } from 'ethers';

interface TokenCreationProps {
  accountAddress: string | null;
  provider: BrowserProvider | null;
  baseFee: string | null;
  onTokenCreated: (event: any) => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ accountAddress, provider, baseFee, onTokenCreated }) => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newTokenDetails, setNewTokenDetails] = useState<Token | null>(null);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !provider) {
        setFeedback({ type: 'error', message: 'Please connect your wallet first.' });
        return;
    }

    if (!tokenName || !tokenSymbol || !tokenSupply || Number(tokenSupply) <= 0) {
      setFeedback({ type: 'error', message: 'Please fill out all fields with valid values.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);

      const supply = ethers.toBigInt(tokenSupply);
      const feeInWei = ethers.parseEther(baseFee || '0');

      const tx = await contract.createToken(tokenName, tokenSymbol, supply, { value: feeInWei });
      setFeedback({ type: 'info', message: `Transaction in progress... Waiting for confirmation.` });
      
      const receipt = await tx.wait();
      
      let parsedEvent = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
            try {
                const event = contract.interface.parseLog(log);
                if (event && event.name === 'TokenCreated') {
                    parsedEvent = { ...log, args: event.args, name: event.name };
                    break;
                }
            } catch (e) {
                // Not a log from this contract's ABI, ignore
            }
        }
      }
      
      if (parsedEvent && parsedEvent.args) {
          // Guaranteed UI update by passing the confirmed event data up to the parent.
          onTokenCreated(parsedEvent);

          const createdToken: Token = {
              name: parsedEvent.args.name,
              symbol: parsedEvent.args.symbol,
              supply: parsedEvent.args.supply.toString(),
              address: parsedEvent.args.tokenAddress,
              creator: parsedEvent.args.creator,
              txHash: receipt.hash,
          };
          setNewTokenDetails(createdToken);
          setIsSuccessModalOpen(true);
      } else {
        setFeedback({ type: 'error', message: 'Token creation transaction succeeded, but the event was not found. Please check Basescan.' });
      }
      
      setTokenName('');
      setTokenSymbol('');
      setTokenSupply('');
      setFeedback(null);

    } catch (error: any) {
      console.error("Error creating token:", error);
      const errorMessage = error.reason || "An unexpected error occurred. Check the console.";
      setFeedback({ type: 'error', message: `Transaction error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setNewTokenDetails(null);
  }

  const inputStyles = "w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition duration-200";

  if (!accountAddress) {
    return (
      <Card title="Create Your ERC20 Token">
        <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
          <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m12 0V6a2.25 2.25 0 00-2.25-2.25H9.75A2.25 2.25 0 007.5 6v3" />
          </svg>
          <p className="mt-4 text-lg text-text-secondary">Please connect your wallet to create a token.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Create Your ERC20 Token">
        <form onSubmit={handleCreateToken} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tokenName" className="block text-sm font-medium text-text-secondary mb-2">Token Name</label>
              <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g., Base Pepe" className={inputStyles} />
            </div>
            <div>
              <label htmlFor="tokenSymbol" className="block text-sm font-medium text-text-secondary mb-2">Token Symbol</label>
              <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g., BPEPE" className={inputStyles} />
            </div>
          </div>
          <div>
            <label htmlFor="tokenSupply" className="block text-sm font-medium text-text-secondary mb-2">Total Supply</label>
            <input type="number" id="tokenSupply" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="e.g., 1,000,000" min="1" className={inputStyles} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Creation Fee</label>
              <div className="w-full bg-background border border-border rounded-lg p-3 flex justify-between items-center">
                  <span className="text-text-secondary">{baseFee ? `${baseFee} ETH` : 'Loading fee...'}</span>
              </div>
          </div>
          
          {feedback && (
            <div className={`text-center p-3 rounded-lg text-sm break-words ${
              feedback.type === 'success' ? 'bg-success/20 text-green-300' : 
              feedback.type === 'error' ? 'bg-error/20 text-red-300' :
              'bg-info/20 text-blue-300'
            }`}>
              {feedback.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !baseFee} 
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center shadow-md shadow-primary/20"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Token...
              </>
            ) : (
              'Create Token'
            )}
          </button>
        </form>
      </Card>
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        tokenDetails={newTokenDetails}
      />
    </>
  );
};

export default TokenCreation;