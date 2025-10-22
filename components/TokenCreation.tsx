
import React, { useState } from 'react';
import SuccessModal from './SuccessModal';
import { contractAddress, contractABI } from '../constants';
import type { Token } from '../types';
import { ethers, BrowserProvider, Contract } from 'ethers';

interface TokenCreationProps {
  accountAddress: string | null;
  provider: BrowserProvider | null;
  baseFee: string | null;
  onTokenCreated: () => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ accountAddress, provider, baseFee, onTokenCreated }) => {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  // Decimals are fixed at 18 for tokens created by this factory.
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
      setFeedback({ type: 'error', message: 'Please fill out all required fields with valid values.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, contractABI, signer);
      
      const decimals = 18;
      const supply = ethers.parseUnits(tokenSupply, decimals);
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
          onTokenCreated();

          const createdToken: Token = {
              name: parsedEvent.args.name,
              symbol: parsedEvent.args.symbol,
              supply: parsedEvent.args.supply.toString(),
              address: parsedEvent.args.tokenAddress,
              creator: parsedEvent.args.creator,
              txHash: receipt.hash,
              decimals: decimals,
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
  const labelStyles = "block text-sm font-medium text-text-secondary mb-2";

  return (
    <>
      <div className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 animate-fade-in">
        <form onSubmit={handleCreateToken} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg text-center h-full min-h-[200px]">
                    <svg className="w-10 h-10 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <h3 className="font-semibold mt-2 text-text-primary">Upload Coin Image</h3>
                    <p className="text-sm text-text-secondary mt-1">PNG, JPG, GIF up to 2MB</p>
                </div>
                <div className="lg:col-span-3 space-y-4">
                     <div>
                        <label htmlFor="tokenName" className={labelStyles}>Coin Name</label>
                        <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g. Galactic Credits" className={inputStyles} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tokenSymbol" className={labelStyles}>Ticker</label>
                            <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g. GLX" className={inputStyles} required />
                        </div>
                        <div>
                            <label htmlFor="tokenSupply" className={labelStyles}>Total Supply</label>
                            <input type="number" id="tokenSupply" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="1000000" min="1" className={inputStyles} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tokenStandard" className={labelStyles}>Token Standard</label>
                             <div className="relative">
                                <select id="tokenStandard" className={inputStyles + ' appearance-none pr-8'}>
                                    <option>ERC20</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="blockchainNetwork" className={labelStyles}>Blockchain Network</label>
                            <div className={inputStyles}>Base Mainnet</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <label htmlFor="description" className={labelStyles}>Description (Optional)</label>
                <textarea id="description" rows={3} placeholder="A new digital currency for the cosmos." className={inputStyles}></textarea>
            </div>
            <div>
                <label htmlFor="iconUrl" className={labelStyles}>Icon URL (Optional)</label>
                <input type="url" id="iconUrl" placeholder="https://example.com/token-image.png" className={inputStyles} />
            </div>

            <div className="border-t border-border pt-6">
                <div className="text-center">
                    <p className="text-sm text-text-secondary mb-4">
                        A one-time fee of <span className="font-mono text-green-400">{baseFee ? `${baseFee} ETH` : 'Loading...'}</span> will be sent to the factory contract.
                    </p>
                    
                    {!accountAddress && (
                         <p className="text-yellow-400 font-semibold mb-4">Please connect your wallet to create a token.</p>
                    )}
                    
                    {feedback && (
                        <div className={`text-center p-3 rounded-lg text-sm break-words mb-4 ${
                        feedback.type === 'success' ? 'bg-success/20 text-green-300' : 
                        feedback.type === 'error' ? 'bg-error/20 text-red-300' :
                        'bg-info/20 text-blue-300'
                        }`}>
                        {feedback.message}
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading || !baseFee || !accountAddress} 
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
            </div>
        </form>
      </div>
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        tokenDetails={newTokenDetails}
      />
    </>
  );
};

export default TokenCreation;