import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// HybridPayoutVault ABI (only the functions we need)
const PAYOUT_VAULT_ABI = [
  {
    inputs: [
      { name: 'weekStart', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' }
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'weekStart', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    name: 'claimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export interface ClaimableSettlement {
  weekStart: number;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  amountWei: string;
  merkleProof: string[];
  merkleRoot: string;
  status: string;
  txHash?: string;
}

export const useClaimSettlement = (contractAddress: `0x${string}`) => {
  const { address } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const claimSettlement = async (settlement: ClaimableSettlement) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsClaiming(true);
      
      console.log('Claiming settlement:', {
        weekStart: settlement.weekStart,
        amount: settlement.amountWei,
        proofLength: settlement.merkleProof.length,
      });

      // Call the smart contract - wagmi automatically handles account/chain from context
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: PAYOUT_VAULT_ABI,
        functionName: 'claim',
        args: [
          BigInt(settlement.weekStart),
          BigInt(settlement.amountWei),
          settlement.merkleProof as `0x${string}`[],
        ],
      } as any); // Type assertion needed for wagmi v2

      setTxHash(hash);

      // Update database after confirmation
      if (hash) {
        const { error } = await supabase
          .from('weekly_settlements')
          .update({
            blockchain_status: 'claimed',
            blockchain_tx_hash: hash,
            claimed_at: new Date().toISOString(),
          })
          .eq('week_start_date', settlement.weekStartDate);

        if (error) {
          console.error('Error updating claim status:', error);
        }

        toast.success('Settlement claimed successfully!', {
          description: `${settlement.amount} USDT claimed for week ${settlement.weekStartDate}`,
        });
      }

    } catch (error: any) {
      console.error('Error claiming settlement:', error);
      toast.error('Failed to claim settlement', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claimSettlement,
    isClaiming: isClaiming || isConfirming,
    isConfirmed,
    txHash,
  };
};
