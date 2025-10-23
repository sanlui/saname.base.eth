

import React, { useState, useRef } from 'react';
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
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newTokenDetails, setNewTokenDetails] = useState<Token | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (tokenName.length > 50) {
      setFeedback({ type: 'error', message: 'Token name cannot exceed 50 characters.' });
      return;
    }

    if (tokenSymbol.length > 10) {
      setFeedback({ type: 'error', message: 'Token symbol cannot exceed 10 characters.' });
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
              website: website || undefined,
              twitter: twitter || undefined,
              telegram: telegram || undefined,
              description: description || undefined,
          };
          setNewTokenDetails(createdToken);
          setIsSuccessModalOpen(true);
      } else {
        setFeedback({ type: 'error', message: "Your token was likely created, but we couldn't confirm it automatically. Please check your transaction on Basescan to verify its status." });
      }
      
      setTokenName('');
      setTokenSymbol('');
      setTokenSupply('');
      setDescription('');
      setWebsite('');
      setTwitter('');
      setTelegram('');
      setFeedback(null);

    } catch (error: any) {
      console.error("Error creating token:", error);
      let message = "An unexpected error occurred. Please try again or check the console for details.";
      // Check for user rejection first
      if (error.code === 'ACTION_REJECTED' || (error.reason && error.reason.toLowerCase().includes('user rejected'))) {
          message = "Transaction cancelled in wallet.";
      } else if (error.reason && error.reason.toLowerCase().includes('insufficient funds')) {
          message = "Transaction failed. Please ensure your wallet has enough ETH for the fee and gas costs.";
      }
      setFeedback({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setNewTokenDetails(null);
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Invalid file type. Please use PNG, JPG, or GIF.' });
      return;
    }

    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      setFeedback({ type: 'error', message: 'File is too large. Maximum size is 2MB.' });
      return;
    }
    
    setFeedback(null);

    const reader = new FileReader();
    reader.onloadend = () => {
        setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = ""; 
      }
  }

  const inputStyles = "w-full bg-background border border-border rounded-lg p-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition duration-200";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-2";

  return (
    <>
      <div className="bg-surface border border-border rounded-xl shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
        <div className="p-6 md:p-8">
            <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-2xl font-bold text-text-primary font-display">Create Your Custom ERC20 Token</h2>
                <p className="text-text-secondary mt-1">Fill in the details to deploy your token.</p>
            </div>
            <form onSubmit={handleCreateToken} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div 
                        className="relative lg:col-span-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg text-center h-full min-h-[200px] cursor-pointer hover:border-primary transition-colors"
                        onClick={handleImageUploadClick}
                        onKeyDown={(e) => e.key === 'Enter' && handleImageUploadClick()}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload coin image"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/png, image/jpeg, image/gif"
                            className="hidden"
                        />
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview of the uploaded token icon." className="w-full h-full max-h-[180px] object-contain rounded-lg" />
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80 transition-colors"
                                    aria-label="Remove image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <title>Remove icon</title>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <svg className="w-10 h-10 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <title>Upload icon</title>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
                                <p className="font-semibold mt-2 text-text-primary">Upload Token Icon</p>
                                <p className="text-sm text-text-secondary mt-1">(Optional) PNG, JPG, GIF. Max 2MB.</p>
                            </>
                        )}
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                         <div>
                            <label htmlFor="tokenName" className={labelStyles}>Token Name *</label>
                            <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g. Galactic Credits" className={inputStyles} required maxLength={50} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tokenSymbol" className={labelStyles}>Symbol *</label>
                                <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g. GLX" className={inputStyles} required maxLength={10} />
                            </div>
                            <div>
                                <label htmlFor="tokenSupply" className={labelStyles}>Total Supply *</label>
                                <input type="number" id="tokenSupply" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="1000000" min="1" className={inputStyles} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tokenStandard" className={labelStyles}>Token Standard</label>
                                 <div className="relative">
                                    <select id="tokenStandard" className={inputStyles + ' appearance-none pr-8 bg-background cursor-not-allowed'}>
                                        <option>ERC20</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="blockchainNetwork" className={labelStyles}>Blockchain Network</label>
                                <div className={inputStyles + ' bg-background cursor-not-allowed'}>Base Mainnet</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-text-primary font-display mb-1">Optional Metadata</h3>
                    <p className="text-text-secondary text-sm mb-4">This information is for display purposes only and is not stored on-chain.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="description" className={labelStyles}>Description (Max 200 chars)</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of your token's utility." className={inputStyles} rows={3} maxLength={200}></textarea>
                        </div>
                        <div>
                            <label htmlFor="website" className={labelStyles}>Website URL</label>
                            <input type="url" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourproject.com" className={inputStyles} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="twitter" className={labelStyles}>Twitter (X) URL</label>
                                <input type="url" id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/yourhandle" className={inputStyles} />
                            </div>
                            <div>
                                <label htmlFor="telegram" className={labelStyles}>Telegram URL</label>
                                <input type="url" id="telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/yourgroup" className={inputStyles} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-6">
                    <div className="text-center mb-4 min-h-[120px]">
                        <p className="text-sm text-text-primary">
                          Deployment Fee: <span className="font-mono text-green-400 font-bold">{baseFee ? `${baseFee} ETH` : 'Loading...'}</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-1">One-time fee to launch on Base. No hidden costs.</p>
                        
                        <p className="text-xs text-text-secondary mt-4">
                          By proceeding, you acknowledge you are deploying a smart contract and assume all responsibility for the token created.
                        </p>
                        
                        {!accountAddress && (
                             <p className="text-yellow-400 font-semibold mt-4">Please connect your wallet to create a token.</p>
                        )}
                        
                        {feedback && (
                            <div className={`text-center p-3 rounded-lg text-sm break-words mt-4 ${
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
                            <title>Loading spinner</title>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deploying your token...
                        </>
                        ) : (
                        'Launch Token Now'
                        )}
                    </button>
                </div>
            </form>
        </div>
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