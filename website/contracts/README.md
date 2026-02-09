# Hybrid Payout Vault Smart Contract

## Overview

The `HybridPayoutVault` is a production-ready Solidity smart contract for managing weekly commission payouts using Merkle tree verification. All commission calculations (40% cap, binary, direct, override) are performed off-chain by the commission engine, and the contract only handles on-chain claims with cryptographic verification.

## Key Features

### 🔐 Security
- ✅ **OpenZeppelin Standards**: Uses battle-tested contracts (Ownable, ReentrancyGuard, Pausable)
- ✅ **Merkle Proof Verification**: Cryptographically secure claim validation
- ✅ **Double-Claim Prevention**: Per-user, per-week claim tracking
- ✅ **Reentrancy Protection**: SafeERC20 and ReentrancyGuard
- ✅ **Emergency Controls**: Pausable + emergency withdraw

### 💰 Token Support
- Configurable payout token (USDT, MUSD, or any ERC-20)
- Owner can update token address if needed
- SafeERC20 for secure transfers

### 📊 Weekly Settlement Model
1. **Off-chain**: Commission engine calculates all payouts with 40% cap logic
2. **Admin**: Sets weekly Merkle root on-chain
3. **Users**: Claim with Merkle proof (gas-efficient)
4. **Contract**: Verifies proof + prevents double-claims

### ⚡ Gas Optimization
- Merkle proofs (more efficient than signatures)
- Batch claim support for multiple weeks
- Minimal storage (roots only, no per-user arrays)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Off-Chain (Backend)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Commission Engine (Supabase Edge Function)     │   │
│  │  • Calculate direct L1/L2/L3 commissions        │   │
│  │  • Calculate binary weak-leg commissions        │   │
│  │  • Calculate override bonuses                   │   │
│  │  • Apply 40% total cap with scaling             │   │
│  │  • Generate Merkle tree from final amounts      │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Merkle Root Generation                         │   │
│  │  • Create leaf: keccak256(user, amount)         │   │
│  │  • Build tree: MerkleTree(leaves)               │   │
│  │  • Store root + proofs in database              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ setWeeklyRoot(weekId, root)
                          ▼
┌─────────────────────────────────────────────────────────┐
│              On-Chain (Smart Contract)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  HybridPayoutVault                              │   │
│  │  • Store Merkle root per week                   │   │
│  │  • Verify user claims with Merkle proof         │   │
│  │  • Prevent double-claims (mapping)              │   │
│  │  • Transfer ERC-20 tokens (USDT/MUSD)           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ claim(weekId, amount, proof)
                          ▼
                  User receives tokens
```

## Contract Functions

### Admin Functions (Owner Only)

#### `setPayoutToken(address _payoutToken)`
Set or update the ERC-20 token used for payouts.

```solidity
vault.setPayoutToken(0x...USDT_ADDRESS);
```

#### `setWeekRoot(uint256 weekStart, bytes32 root)`
Set the Merkle root for a specific week after off-chain calculation.

```solidity
// weekStart: Unix timestamp of week start (e.g., 1704672000)
// root: Root hash from Merkle tree of (user, weekStart, amount) tuples
vault.setWeekRoot(1704672000, 0x1234...);
```

#### `pause()` / `unpause()`
Emergency pause/unpause claims.

#### `emergencyWithdraw(address token, uint256 amount, address recipient)`
Emergency withdrawal of tokens (admin only).

### User Functions

#### `claim(uint256 weekStart, uint256 amount, bytes32[] calldata proof)`
Claim weekly payout using Merkle proof.

**Implementation:**
1. Verifies `address = msg.sender` (implicit)
2. Rebuilds leaf: `keccak256(abi.encode(msg.sender, weekStart, amount))`
3. Verifies Merkle proof against `weekRoot[weekStart]`
4. Checks `!claimed[weekStart][msg.sender]`
5. Transfers amount of payout token to `msg.sender`
6. Marks as claimed

```solidity
// User calls this from frontend with proof from database
vault.claim(
    1704672000,           // weekStart (Unix timestamp)
    5000e6,               // amount (5k USDT, 6 decimals)
    [0xabc..., 0xdef...] // proof from backend
);
```

#### `claimMultiple(uint256[] weekStarts, uint256[] amounts, bytes32[][] proofs)`
Batch claim multiple weeks at once (saves gas).

```solidity
vault.claimMultiple(
    [1704672000, 1705276800],        // 2 weeks
    [5000e6, 6000e6],                // amounts
    [[proof1], [proof2]]             // proofs
);
```

### View Functions

- `weekRoot(uint256 weekStart) → bytes32` - Get Merkle root for a week
- `claimed(uint256 weekStart, address user) → bool` - Check if user claimed
- `getContractBalance() → uint256` - Get contract's token balance
- `payoutToken() → IERC20` - Get current payout token address

## Deployment Guide

### Prerequisites
```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

### Deploy Script Example
```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // Ethereum mainnet
  
  const HybridPayoutVault = await hre.ethers.getContractFactory("HybridPayoutVault");
  const vault = await HybridPayoutVault.deploy(USDT_ADDRESS);
  
  await vault.deployed();
  
  console.log("HybridPayoutVault deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy to Networks

```bash
# Ethereum Mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Polygon
npx hardhat run scripts/deploy.js --network polygon

# BSC
npx hardhat run scripts/deploy.js --network bsc

# Arbitrum
npx hardhat run scripts/deploy.js --network arbitrum
```

## Token Addresses

### USDT (6 decimals)
- Ethereum: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- Polygon: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- BSC: `0x55d398326f99059fF775485246999027B3197955`
- Arbitrum: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`

### USDC (6 decimals) - Alternative
- Ethereum: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Polygon: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

## Security Considerations

### ✅ What's Protected
- Double-claim prevention
- Reentrancy attacks
- Unauthorized admin actions
- Invalid Merkle proofs
- Integer overflow (Solidity 0.8+)

### ⚠️ Trust Assumptions
- Admin key security (use multisig!)
- Off-chain calculation correctness
- Merkle proof database integrity

### 🔒 Best Practices
1. Use a **Gnosis Safe multisig** as owner (3-of-5 recommended)
2. Time-lock for `setPayoutToken` changes (24h delay)
3. Monitor contract balance vs. allocated amounts
4. Regular audits of Merkle tree generation
5. Test on testnet first (Sepolia, Mumbai, etc.)

## Testing

```javascript
// test/HybridPayoutVault.test.js
const { expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("HybridPayoutVault", function () {
  it("Should allow valid claims with Merkle proof", async function () {
    const [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy mock USDT
    const MockToken = await ethers.getContractFactory("MockERC20");
    const usdt = await MockToken.deploy("Mock USDT", "USDT", 6);
    
    // Deploy vault
    const Vault = await ethers.getContractFactory("HybridPayoutVault");
    const vault = await Vault.deploy(usdt.address);
    
    const weekStart = 1704672000;
    
    // Create Merkle tree with (address, weekStart, amount)
    const leaves = [
      keccak256(ethers.utils.solidityPack(
        ["address", "uint256", "uint256"], 
        [user1.address, weekStart, 1000e6]
      )),
      keccak256(ethers.utils.solidityPack(
        ["address", "uint256", "uint256"], 
        [user2.address, weekStart, 2000e6]
      ))
    ];
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getRoot();
    
    // Set weekly root
    await vault.setWeekRoot(weekStart, "0x" + root.toString("hex"));
    
    // Fund contract
    await usdt.mint(vault.address, 10000e6);
    
    // User1 claims
    const leaf = leaves[0];
    const proof = tree.getHexProof(leaf);
    await vault.connect(user1).claim(weekStart, 1000e6, proof);
    
    expect(await usdt.balanceOf(user1.address)).to.equal(1000e6);
    expect(await vault.claimed(weekStart, user1.address)).to.be.true;
  });
});
```

## Integration with Backend

See `supabase/functions/generate-merkle-proofs/` for the edge function that:
1. Fetches weekly settlements from database
2. Generates Merkle tree
3. Stores root + proofs
4. Calls `setWeeklyRoot()` on contract

## Gas Estimates

- `claim()`: ~80k gas (~$2-5 depending on network)
- `claimMultiple(5 weeks)`: ~250k gas
- `setWeeklyRoot()`: ~45k gas

## License

MIT
