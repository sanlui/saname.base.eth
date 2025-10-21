
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { contractAddress, contractABI } from '../constants';

interface TokenCreationProps {
  accountAddress: string | null;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ accountAddress }) => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [baseFee, setBaseFee] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const fetchBaseFee = async () => {
      if (window.ethereum) {
        try {
          const provider = new window.ethers.providers.Web3Provider(window.ethereum);
          const contract = new window.ethers.Contract(contractAddress, contractABI, provider);
          const fee = await contract.baseFee();
          setBaseFee(window.ethers.utils.formatEther(fee));
        } catch (error) {
          console.error("Error fetching base fee:", error);
          setFeedback({ type: 'error', message: 'Could not fetch creation fee from the contract.' });
        }
      }
    };
    fetchBaseFee();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !baseFee) {
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
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new window.ethers.Contract(contractAddress, contractABI, signer);

      const supply = window.ethers.BigNumber.from(tokenSupply);
      const feeInWei = window.ethers.utils.parseEther(baseFee);

      const tx = await contract.createToken(tokenName, tokenSymbol, supply, { value: feeInWei });
      setFeedback({ type: 'info', message: `Transaction in progress... Waiting for confirmation.` });
      
      await tx.wait();
      
      setFeedback({ type: 'success', message: 'Token creation successful! Your new token will appear in the "Latest Tokens" list shortly.' });
      setTokenName('');
      setTokenSymbol('');
      setTokenSupply('');

    } catch (error: any) {
      console.error("Error creating token:", error);
      const errorMessage = error.reason || "An unexpected error occurred. Check the console.";
      setFeedback({ type: 'error', message: `Transaction error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full bg-base-dark border border-slate-600 rounded-md p-3 text-base-text placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-base-blue transition";

  if (!accountAddress) {
    return (
      <Card title="Create Your ERC20 Token">
        <div className="text-center p-8 border-2 border-dashed border-slate-600 rounded-lg">
          <p className="text-lg text-slate-400">Please connect your wallet to create a token.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Create Your ERC20 Token">
      <form onSubmit={handleCreateToken} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tokenName" className="block text-sm font-medium text-base-text-secondary mb-2">Token Name</label>
            <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g., Base Pepe" className={inputStyles} />
          </div>
          <div>
            <label htmlFor="tokenSymbol" className="block text-sm font-medium text-base-text-secondary mb-2">Token Symbol</label>
            <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g., BPEPE" className={inputStyles} />
          </div>
        </div>
        <div>
          <label htmlFor="tokenSupply" className="block text-sm font-medium text-base-text-secondary mb-2">Total Supply</label>
          <input type="number" id="tokenSupply" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="e.g., 1000000" min="1" className={inputStyles} />
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg flex justify-between items-center text-sm">
            <span className="text-base-text-secondary">Creation Fee</span>
            <span className="font-bold text-base-text text-base">{baseFee ? `${baseFee} ETH` : 'Loading fee...'}</span>
        </div>
        
        {feedback && (
          <div className={`text-center p-3 rounded-lg text-sm break-words ${
            feedback.type === 'success' ? 'bg-green-500/20 text-green-300' : 
            feedback.type === 'error' ? 'bg-red-500/20 text-red-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {feedback.message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading || !baseFee} 
          className="w-full bg-base-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
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
  );
};

export default TokenCreation;
