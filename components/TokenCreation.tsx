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
  onTokenCreatedWithMetadata: (token: Token) => void;
}

const TokenCreation: React.FC<TokenCreationProps> = ({ accountAddress, provider, baseFee, onTokenCreated, onTokenCreatedWithMetadata }) => {
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

      // --- Pre-flight gas estimation and balance check ---
      setFeedback({ type: 'info', message: 'Estimating transaction cost...' });
      
      const estimatedGas = await contract.createToken.estimateGas(tokenName, tokenSymbol, supply, { value: feeInWei });
      
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      if (!gasPrice) {
          throw new Error("Could not get current gas price from the network. Please try again.");
      }

      const estimatedGasCost = estimatedGas * gasPrice;
      const totalCost = feeInWei + estimatedGasCost;
      const balance = await provider.getBalance(accountAddress);

      if (balance < totalCost) {
          const formattedTotal = ethers.formatEther(totalCost).substring(0, 8);
          const formattedBalance = ethers.formatEther(balance).substring(0, 8);
          setFeedback({ type: 'error', message: `Insufficient funds. You need ~${formattedTotal} ETH for the fee and gas, but you only have ${formattedBalance} ETH.` });
          setIsLoading(false);
          return;
      }
      // --- End of pre-flight check ---

      // Add a 20% buffer to the gas limit for safety
      const gasLimitWithBuffer = (estimatedGas * 120n) / 100n; 
      
      const tx = await contract.createToken(tokenName, tokenSymbol, supply, { 
        value: feeInWei,
        gasLimit: gasLimitWithBuffer 
      });

      setFeedback({ type: 'info', message: `Transaction submitted... Waiting for confirmation.` });
      
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
          onTokenCreatedWithMetadata(createdToken);
          onTokenCreated();

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
      if (error.code === 'ACTION_REJECTED' || (error.reason && error.reason.toLowerCase().includes('user rejected'))) {
          message = "Transaction cancelled in wallet.";
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
          message = "Your balance is insufficient to cover the transaction fee and gas costs. Please top up your wallet.";
      } else if (error.code === 'CALL_EXCEPTION' || (error.reason && error.reason.toLowerCase().includes('reverted'))) {
        message = `The transaction would fail. This can happen if token details are invalid or contract conditions are not met. Reason: ${error.reason || 'Execution reverted'}.`;
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

  const inputStyles = "w-full bg-background border border-border rounded-xl p-3 text-text-primary placeholder-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary transition duration-200";
  const labelStyles = "block text-sm font-medium text-text-secondary mb-2";

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl shadow-lg animate-fade-in-up" style={{animationDelay: '0.4s'}}>
        <div className="p-6 md:p-8">
            <div className="border-b border-border pb-6 mb-8">
                <h2 className="text-3xl font-bold text-text-primary font-display">Create Your Custom ERC20 Token</h2>
                <p className="text-text-secondary mt-2">Fill in the details below to deploy your token on the Base network.</p>
            </div>
            <form onSubmit={handleCreateToken} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <label className={labelStyles}>Token Icon (Optional)</label>
                        <div 
                            className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl text-center h-full min-h-[200px] cursor-pointer hover:border-primary transition-colors group"
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
                                        className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100"
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
                                    <svg className="w-12 h-12 text-text-secondary/50 group-hover:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <title>Upload icon</title>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                    <p className="font-semibold mt-4 text-text-primary">Click to upload</p>
                                    <p className="text-xs text-text-secondary mt-1">PNG, JPG, GIF (Max 2MB)</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-3 space-y-6">
                         <div>
                            <label htmlFor="tokenName" className={labelStyles}>Token Name *</label>
                            <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g. Galactic Credits" className={inputStyles} required maxLength={50} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="tokenSymbol" className={labelStyles}>Symbol *</label>
                                <input type="text" id="tokenSymbol" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} placeholder="e.g. GLX" className={inputStyles} required maxLength={10} />
                            </div>
                            <div>
                                <label htmlFor="tokenSupply" className={labelStyles}>Total Supply *</label>
                                <input type="number" id="tokenSupply" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} placeholder="1000000" min="1" className={inputStyles} required />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-text-primary font-display mb-2">Optional Metadata</h3>
                    <p className="text-text-secondary text-sm mb-4">This information is for display purposes on this site and is not stored on-chain.</p>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="description" className={labelStyles}>Description (Max 200 chars)</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief description of your token's purpose or utility." className={inputStyles} rows={3} maxLength={200}></textarea>
                        </div>
                        <div>
                            <label htmlFor="website" className={labelStyles}>Website URL</label>
                            <input type="url" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourproject.com" className={inputStyles} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                <div className="border-t border-border pt-8 space-y-6">
                    <div className="text-left text-sm p-4 bg-background rounded-xl border-l-4 border-info">
                        <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                                <title>Security information icon</title>
                                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Review Your Transaction
                        </h4>
                        <ul className="list-disc list-inside space-y-2 text-text-secondary text-xs pl-2 mt-3">
                            <li>
                                You are interacting with our audited factory contract:
                                <a 
                                    href={`https://basescan.org/address/${contractAddress}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-primary hover:underline font-mono ml-1"
                                    aria-label="View contract on Basescan"
                                >
                                    {`${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}`}
                                </a>.
                            </li>
                            <li>You will be executing the <code className="bg-border text-primary font-mono text-xs px-1 py-0.5 rounded">createToken</code> function.</li>
                            <li>The transaction value is a one-time fee of <span className="font-mono text-green-400 font-bold">{baseFee ? `${baseFee} ETH` : '...'}</span> + Base network gas.</li>
                            <li>A new, unique ERC20 contract will be deployed, and you will be the sole owner.</li>
                        </ul>
                    </div>

                    <div className="text-center space-y-4">
                        {feedback && (
                            <div className={`text-center p-3 rounded-lg text-sm break-words flex items-center justify-center gap-2 ${
                            feedback.type === 'success' ? 'bg-success/10 text-green-400' : 
                            feedback.type === 'error' ? 'bg-error/10 text-red-400' :
                            'bg-info/10 text-blue-400'
                            }`}>
                             {feedback.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                            {feedback.message}
                            </div>
                        )}
                        {!accountAddress && (
                            <div className="text-center p-3 rounded-lg text-sm bg-yellow-400/10 text-yellow-400">Please connect your wallet to deploy a token.</div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !baseFee || !accountAddress} 
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg shadow-lg hover:shadow-glow-primary disabled:shadow-none"
                    >
                        {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <title>Loading spinner</title>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deploying Your Token...
                        </>
                        ) : (
                        `Launch Token (${baseFee ? `${baseFee} ETH + Gas` : '...'})`
                        )}
                    </button>
                    <p className="text-xs text-text-secondary text-center px-4">
                        By proceeding, you agree you are deploying a smart contract and are responsible for the token you create.
                    </p>
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