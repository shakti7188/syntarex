import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

// Fallback projectId for development - replace with actual WalletConnect Cloud projectId
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID';

if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  console.warn('⚠️ WalletConnect projectId not configured. Please add VITE_WALLETCONNECT_PROJECT_ID secret.');
}

export const wagmiConfig = getDefaultConfig({
  appName: 'SynteraX',
  projectId,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});
