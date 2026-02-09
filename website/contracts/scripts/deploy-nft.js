const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying SynteraXPurchaseNFT with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the NFT contract
  const SynteraXPurchaseNFT = await hre.ethers.getContractFactory("SynteraXPurchaseNFT");
  const nft = await SynteraXPurchaseNFT.deploy(deployer.address);

  await nft.waitForDeployment();

  const contractAddress = await nft.getAddress();
  console.log("SynteraXPurchaseNFT deployed to:", contractAddress);

  // Log initial settings
  const soulboundEnabled = await nft.soulboundEnabled();
  console.log("Soulbound enabled:", soulboundEnabled);

  // Verify on block explorer (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    // Wait for 5 block confirmations
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log("Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [deployer.address],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification error:", error.message);
    }
  }

  // Output deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Owner:", deployer.address);
  console.log("Soulbound Enabled:", soulboundEnabled);
  console.log("========================\n");

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    owner: deployer.address,
    deployedAt: new Date().toISOString(),
    soulboundEnabled: soulboundEnabled
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}-nft.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployments/${hre.network.name}-nft.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
