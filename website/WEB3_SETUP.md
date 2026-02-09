# Web3 Integration Setup Guide

## WalletConnect Project ID Setup

To enable WalletConnect (for mobile wallet connections), you need to obtain a free Project ID:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID
5. Update `src/lib/web3-config.ts` and replace `YOUR_WALLETCONNECT_PROJECT_ID` with your actual Project ID

## Supported Features

✅ **MetaMask** - Browser extension wallet
✅ **WalletConnect** - Mobile wallets (Trust Wallet, Rainbow, etc.)
✅ **Coinbase Wallet** - Via RainbowKit
✅ **Signature Verification** - Cryptographic proof of wallet ownership
✅ **Multi-chain Support** - Ethereum, Polygon, Optimism, Arbitrum, Base

## How It Works

### 1. Connect Wallet
Users can connect their Web3 wallet using the "Connect Wallet" button in the dashboard header.

### 2. Link to Account
After connecting, users must link their wallet to their authenticated account by:
- Clicking "Link This Wallet" in the Wallet tab
- Signing a message to prove ownership (no gas fees)
- The signature verifies they control the wallet address

### 3. Unique Wallet Constraint
Each wallet address can only be linked to one account. This prevents:
- Multiple accounts claiming the same wallet
- Duplicate payouts
- Identity confusion

### 4. Claim Settlements
Once linked, users can claim their weekly settlements directly to their wallet address using the smart contract integration.

## Security Features

- **Signature-based verification**: Users must sign a challenge message to prove wallet ownership
- **Unique constraint**: Prevents wallet address reuse across multiple accounts
- **Database-backed**: Wallet addresses stored securely in profiles table
- **RLS protected**: Users can only update their own wallet address

## Next Steps

After wallet linking is complete, users will be able to:
1. View their linked wallet in the dashboard
2. Claim weekly settlements on-chain via Merkle proof verification
3. Receive USDT/MUSD payments directly to their wallet
