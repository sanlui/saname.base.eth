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

const TokenCreation: React.FC<TokenCreationProps> = ({ 
  accountAddress, 
  provider, 
  baseFee, 
  onTokenCreated, 
  onTokenCreatedWithMetadata 
}) => {
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

      // Pre-flight check
      setFeedback({ type: 'info', message: 'Estimating transaction cost...' });
      
      const estimatedGas = await contract.createToken.estimateGas(tokenName, tokenSymbol, supply, { value: feeInWei });
      const feeData = await provider.getFeeData();
      
      const gasPriceForEstimation = feeData.maxFeePerGas ?? feeData.gasPrice;
      if (!gasPriceForEstimation) {
        throw new Error("Could not get current gas price from the network.");
      }

      // CORREZIONE: Rimuovi BigInt() non necessario
      const estimatedGasCost = (estimatedGas * gasPriceForEstimation * 120n) / 100n;
      const totalCost = feeInWei + estimatedGasCost;
      const balance = await provider.getBalance(accountAddress);

      if (balance < totalCost) {
        const formattedTotal = ethers.formatEther(totalCost).substring(0, 8);
        const formattedBalance = ethers.formatEther(balance).substring(0, 8);
        setFeedback({ 
          type: 'error', 
          message: `Insufficient funds. You need ~${formattedTotal} ETH, but you only have ${formattedBalance} ETH.` 
        });
        setIsLoading(false);
        return;
      }

      const gasLimitWithBuffer = (estimatedGas * 120n) / 100n;
      
      const tx = await contract.createToken(tokenName, tokenSymbol, supply, { 
        value: feeInWei,
        gasLimit: gasLimitWithBuffer 
      });

      setFeedback({ type: 'info', message: `Transaction submitted... Waiting for confirmation.` });
      
      const receipt = await tx.wait();
      
      // CORREZIONE: Gestione eventi semplificata
      let tokenAddress: string | null = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'TokenCreated') {
              tokenAddress = parsed.args.tokenAddress;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      if (tokenAddress) {
        const createdToken: Token = {
          name: tokenName,
          symbol: tokenSymbol,
          supply: tokenSupply,
          address: tokenAddress,
          creator: accountAddress,
          txHash: receipt.hash,
          decimals: 18,
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
        setFeedback({ 
          type: 'error', 
          message: "Token created but event not found. Check Basescan for details." 
        });
      }
      
      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setTokenSupply('');
      setDescription('');
      setWebsite('');
      setTwitter('');
      setTelegram('');
      setImagePreview(null);

    } catch (error: any) {
      console.error("Error creating token:", error);
      
      // CORREZIONE: Gestione errori migliorata
      let message = "An unexpected error occurred. Please try again.";
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        message = "Transaction cancelled in wallet.";
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        message = "Insufficient funds for transaction.";
      } else if (error.info?.error) {
        message = `Blockchain error: ${error.info.error.message}`;
      } else if (error.message) {
        // Prendi solo la prima parte del messaggio per evitare errori lunghi
        message = error.message.split('.')[0] + '.';
      }
      
      setFeedback({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  // ... resto del codice rimane uguale (handleCloseSuccessModal, handleImageUploadClick, etc.)

  return (
    // ... JSX rimane uguale
  );
};

export default TokenCreation;
