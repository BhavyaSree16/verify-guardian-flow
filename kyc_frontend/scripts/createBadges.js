/**
 * Script to create KYC badges as contract owner
 * Run this script to initialize badges before users can mint them
 */

const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { ethers } = require("ethers");

// Contract configuration
const CONTRACT_ADDRESS = "0xEA8a7082dB298bf6Df74c663b037d325e8201275";
const CHAIN_ID = 11155111; // Sepolia

// Badge configurations
const badgeConfigs = [
  {
    name: "KYC Basic Badge",
    description: "Basic KYC verification completed with essential identity documents",
    image: "https://ipfs.io/ipfs/QmYourImageHashHere/basic-badge.png",
    level: "Basic",
    tier: "Bronze",
    priceEth: "0.001", // 0.001 ETH
    maxSupply: "1000"
  },
  {
    name: "KYC Verified Badge", 
    description: "Advanced KYC verification with enhanced security checks",
    image: "https://ipfs.io/ipfs/QmYourImageHashHere/verified-badge.png",
    level: "Verified",
    tier: "Silver", 
    priceEth: "0.005", // 0.005 ETH
    maxSupply: "500"
  },
  {
    name: "KYC Premium Badge",
    description: "Premium KYC verification with comprehensive identity validation", 
    image: "https://ipfs.io/ipfs/QmYourImageHashHere/premium-badge.png",
    level: "Premium",
    tier: "Gold",
    priceEth: "0.01", // 0.01 ETH
    maxSupply: "100"
  }
];

async function createBadges() {
  try {
    // Initialize SDK with your private key (MAKE SURE YOU'RE THE CONTRACT OWNER)
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Please set PRIVATE_KEY environment variable");
    }

    const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_KEY");
    const wallet = new ethers.Wallet(privateKey, provider);
    const sdk = ThirdwebSDK.fromSigner(wallet, CHAIN_ID);

    // Get contract
    const contract = await sdk.getContract(CONTRACT_ADDRESS);
    
    // Verify you're the owner
    const owner = await contract.call("owner");
    const yourAddress = await wallet.getAddress();
    
    if (owner.toLowerCase() !== yourAddress.toLowerCase()) {
      throw new Error(`You are not the contract owner. Owner: ${owner}, Your address: ${yourAddress}`);
    }

    console.log("✅ Verified as contract owner");
    console.log("🚀 Starting badge creation...\n");

    // Create each badge
    for (let i = 0; i < badgeConfigs.length; i++) {
      const config = badgeConfigs[i];
      const priceWei = ethers.utils.parseEther(config.priceEth).toString();
      
      console.log(`Creating badge ${i + 1}: ${config.name}`);
      console.log(`  - Price: ${config.priceEth} ETH`);
      console.log(`  - Max Supply: ${config.maxSupply}`);
      
      try {
        const tx = await contract.call("createBadge", [
          config.name,
          config.description,
          config.image,
          config.level,
          config.tier,
          priceWei,
          config.maxSupply
        ]);

        console.log(`  ✅ Badge created! TX: ${tx.receipt.transactionHash}`);
        console.log(`  📝 Token ID: ${i + 1}\n`);
        
      } catch (error) {
        console.error(`  ❌ Failed to create badge ${i + 1}:`, error.message);
      }
    }

    // Get updated contract stats
    const stats = await Promise.all([
      contract.call("nextTokenId"),
      contract.call("totalMintedGlobal"),
      contract.call("maxTotalSupply")
    ]);

    console.log("📊 Contract Status:");
    console.log(`  - Next Token ID: ${stats[0]}`);
    console.log(`  - Total Minted: ${stats[1]}`);
    console.log(`  - Max Total Supply: ${stats[2]}`);
    
  } catch (error) {
    console.error("❌ Error creating badges:", error);
  }
}

// Run the script
if (require.main === module) {
  createBadges();
}

module.exports = { createBadges, badgeConfigs };