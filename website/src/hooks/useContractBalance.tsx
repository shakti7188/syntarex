import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';

export const useContractBalance = (
  tokenAddress: `0x${string}`,
  contractAddress: `0x${string}`
) => {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [contractAddress],
  });

  return {
    balance: balance ? Number(balance) / 1e6 : 0, // Convert from wei (6 decimals for USDT)
    balanceWei: balance?.toString() || '0',
    isLoading,
    refetch,
  };
};
