const hre = require("hardhat");

// Token addresses for different networks
const TOKEN_ADDRESSES = {
  // Ethereum Mainnet
  mainnet: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  // Polygon
  polygon: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  // BSC
  bsc: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
  },
  // Arbitrum
  arbitrum: {
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
  },
  // Optimism
  optimism: {
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
  },
  // Base
  base: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  },
  // Sepolia Testnet (Mock tokens - deploy your own)
  sepolia: {
    USDT: process.env.SEPOLIA_USDT || "0x0000000000000000000000000000000000000000"
  }
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log("Deploying HybridPayoutVault...");
  console.log("Network:", network);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Get token address for network
  const tokenAddresses = TOKEN_ADDRESSES[network];
  
  if (!tokenAddresses) {
    throw new Error(`No token addresses configured for network: ${network}`);
  }

  // Use USDT by default, or override with env variable
  const payoutToken = process.env.PAYOUT_TOKEN || tokenAddresses.USDT || tokenAddresses.USDC;
  
  if (!payoutToken || payoutToken === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Invalid payout token address for network: ${network}`);
  }

  console.log("Payout Token:", payoutToken);

  // Deploy contract
  const HybridPayoutVault = await hre.ethers.getContractFactory("HybridPayoutVault");
  const vault = await HybridPayoutVault.deploy(payoutToken);

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("\n✅ HybridPayoutVault deployed to:", vaultAddress);
  console.log("\nNext steps:");
  console.log("1. Verify contract:");
  console.log(`   npx hardhat verify --network ${network} ${vaultAddress} ${payoutToken}`);
  console.log("\n2. Fund the contract with tokens:");
  console.log(`   Transfer USDT/MUSD to: ${vaultAddress}`);
  console.log("\n3. Set up weekly Merkle roots:");
  console.log(`   vault.setWeeklyRoot(weekId, merkleRoot, totalAllocated)`);
  console.log("\n4. Update frontend contract address:");
  console.log(`   VITE_PAYOUT_VAULT_ADDRESS=${vaultAddress}`);

  // Save deployment info
  const deployment = {
    network,
    contractAddress: vaultAddress,
    payoutToken,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("\nDeployment info:", JSON.stringify(deployment, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
