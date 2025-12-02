import { 
  ThirdwebSDK, 
  SmartContract, 
  TransactionResult, 
  ContractEvent 
} from "@thirdweb-dev/sdk";
import { ethers } from "ethers";
import NFT_ABI from "../abi/NFT_abi.json";
import VERIFIER_ABI from "../abi/verifier_abi.json";
import KYC_REGISTRY_ABI from "../abi/kyc_registry_abi.json";

// Contract configuration
const CONTRACT_ADDRESS = "0xEA8a7082dB298bf6Df74c663b037d325e8201275";
const VERIFIER_CONTRACT_ADDRESS = "0xFe92BD0feC67BdF0628fE045353f1EfC807ce771";
const KYC_REGISTRY_CONTRACT_ADDRESS = "0xA8203a772db7091d874b10E4cFD001c325ADFe3f"; // TODO: Add deployed KYC Registry address
const CHAIN_ID = 11155111; // Sepolia testnet, change as needed

// Types for contract interactions
export interface BadgeMetadata {
  name: string;
  description: string;
  image: string;
  level: string;
  tier: string;
}

export interface ContractBadgeInfo {
  tokenId: number;
  metadata: BadgeMetadata;
  price: string;
  maxSupply: string;
  totalMinted: string;
  claimed: boolean;
}

export interface ClaimResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  tokenId: number;
}

export interface ContractStats {
  maxTotalSupply: string;
  totalMintedGlobal: string;
  nextTokenId: string;
  owner: string;
}

// Types for ZK Proof verification
export interface ZKProofData {
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];
  pubSignals: [string, string, string];
}

export interface VerificationResult {
  isValid: boolean;
  transactionHash?: string;
  gasUsed?: string;
  error?: string;
}

// Types for KYC Registry
export interface CredentialMetadata {
  level: number;
  statusBits: string;
  updatedAt: string;
  owner: string;
  exists: boolean;
}

export interface KYCSubmissionResult {
  success: boolean;
  transactionHash?: string;
  credentialHash?: string;
  level?: number;
  gasUsed?: string;
  error?: string;
}

export interface KYCStatus {
  hasCredential: boolean;
  credentialHash?: string;
  metadata?: CredentialMetadata;
}

/**
 * ZK Proof Verifier Contract Interface using Thirdweb SDK
 */
export class ZKProofVerifier {
  private sdk: ThirdwebSDK | null = null;
  private verifierContract: SmartContract | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {}

  /**
   * Initialize the verifier contract
   */
  async initialize(signer: ethers.Signer): Promise<void> {
    try {
      if (!VERIFIER_CONTRACT_ADDRESS) {
        throw new Error("Verifier contract address not configured");
      }
      
      this.signer = signer;
      this.sdk = ThirdwebSDK.fromSigner(signer, CHAIN_ID);
      this.verifierContract = await this.sdk.getContract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI);
      console.log("ZK Proof Verifier Contract initialized successfully");
    } catch (error) {
      console.error("Failed to initialize verifier contract:", error);
      throw new Error(`Verifier contract initialization failed: ${error}`);
    }
  }

  /**
   * Get verifier contract instance (throws if not initialized)
   */
  private getVerifierContract(): SmartContract {
    if (!this.verifierContract) {
      throw new Error("Verifier contract not initialized. Call initialize() first.");
    }
    return this.verifierContract;
  }

  /**
   * Verify ZK proof on-chain
   */
  async verifyProof(proofData: ZKProofData): Promise<VerificationResult> {
    try {
      const contract = this.getVerifierContract();
      
      // Call the verifyProof function
      const result = await contract.call("verifyProof", [
        proofData.pA,
        proofData.pB, 
        proofData.pC,
        proofData.pubSignals
      ]);

      return {
        isValid: result,
        transactionHash: undefined // This is a view function, no transaction
      };
    } catch (error: any) {
      console.error("Error verifying ZK proof:", error);
      return {
        isValid: false,
        error: error.message || "Failed to verify proof"
      };
    }
  }

  /**
   * Verify ZK proof with transaction (for gas estimation or if needed)
   */
  async verifyProofWithTransaction(proofData: ZKProofData): Promise<VerificationResult> {
    try {
      const contract = this.getVerifierContract();
      
      // First check if proof is valid using view function
      const isValid = await this.verifyProof(proofData);
      if (!isValid.isValid) {
        return isValid;
      }

      // If we need to make it a transaction (though verifyProof is typically a view function)
      // This would be useful if you modify the contract to store verification results
      const tx = await contract.call("verifyProof", [
        proofData.pA,
        proofData.pB,
        proofData.pC, 
        proofData.pubSignals
      ]);

      return {
        isValid: true,
        transactionHash: tx.hash || tx.receipt?.transactionHash,
        gasUsed: tx.receipt?.gasUsed?.toString()
      };
    } catch (error: any) {
      console.error("Error verifying ZK proof with transaction:", error);
      return {
        isValid: false,
        error: error.message || "Failed to verify proof with transaction"
      };
    }
  }

  /**
   * Format proof data from snarkjs output to contract format
   */
  static formatProofForContract(proof: any, publicSignals: string[]): ZKProofData {
    return {
      pA: [proof.pi_a[0], proof.pi_a[1]],
      pB: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      pC: [proof.pi_c[0], proof.pi_c[1]], 
      pubSignals: [publicSignals[0], publicSignals[1], publicSignals[2]] as [string, string, string]
    };
  }

  /**
   * Validate proof structure before submission
   */
  static validateProofData(proofData: ZKProofData): boolean {
    try {
      // Check if all required fields exist
      if (!proofData.pA || !proofData.pB || !proofData.pC || !proofData.pubSignals) {
        return false;
      }

      // Check array lengths
      if (proofData.pA.length !== 2) return false;
      if (proofData.pB.length !== 2 || proofData.pB[0].length !== 2 || proofData.pB[1].length !== 2) return false;
      if (proofData.pC.length !== 2) return false;
      if (proofData.pubSignals.length !== 3) return false;

      // Check if all values are valid hex strings or numbers
      const allValues = [
        ...proofData.pA,
        ...proofData.pB.flat(),
        ...proofData.pC,
        ...proofData.pubSignals
      ];

      return allValues.every(val => {
        if (typeof val === 'string') {
          // Check if it's a valid number string or hex
          return !isNaN(Number(val)) || /^0x[0-9a-fA-F]+$/.test(val);
        }
        return typeof val === 'number';
      });
    } catch (error) {
      console.error("Error validating proof data:", error);
      return false;
    }
  }
}

/**
 * KYC Registry Contract Interface using Thirdweb SDK
 */
export class KYCRegistryContract {
  private sdk: ThirdwebSDK | null = null;
  private registryContract: SmartContract | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {}

  /**
   * Initialize the KYC Registry contract
   */
  async initialize(signer: ethers.Signer): Promise<void> {
    try {
      if (!KYC_REGISTRY_CONTRACT_ADDRESS) {
        throw new Error("KYC Registry contract address not configured");
      }
      
      this.signer = signer;
      this.sdk = ThirdwebSDK.fromSigner(signer, CHAIN_ID);
      this.registryContract = await this.sdk.getContract(KYC_REGISTRY_CONTRACT_ADDRESS, KYC_REGISTRY_ABI);
      console.log("KYC Registry Contract initialized successfully");
    } catch (error) {
      console.error("Failed to initialize KYC Registry contract:", error);
      throw new Error(`KYC Registry contract initialization failed: ${error}`);
    }
  }

  /**
   * Get KYC Registry contract instance (throws if not initialized)
   */
  private getRegistryContract(): SmartContract {
    if (!this.registryContract) {
      throw new Error("KYC Registry contract not initialized. Call initialize() first.");
    }
    return this.registryContract;
  }

  // ========================
  // MAIN KYC FUNCTIONS
  // ========================

  /**
   * Submit KYC proof for verification and registration
   */
  async submitKYCProof(proofData: ZKProofData): Promise<KYCSubmissionResult> {
    try {
      const contract = this.getRegistryContract();
      
      // Submit proof to contract
      const tx = await contract.call("submitKYCProof", [
        proofData.pA,
        proofData.pB,
        proofData.pC,
        proofData.pubSignals
      ]);

      // Extract credential hash and level from public signals
      const credentialHash = proofData.pubSignals[2];
      const level = parseInt(proofData.pubSignals[1]);

      return {
        success: true,
        transactionHash: tx.hash || tx.receipt?.transactionHash,
        credentialHash,
        level,
        gasUsed: tx.receipt?.gasUsed?.toString()
      };
    } catch (error: any) {
      console.error("Error submitting KYC proof:", error);
      return {
        success: false,
        error: error.message || "Failed to submit KYC proof"
      };
    }
  }

  // ========================
  // VIEW FUNCTIONS
  // ========================

  /**
   * Get user's latest credential hash
   */
  async getCredentialOf(userAddress: string): Promise<string> {
    try {
      const contract = this.getRegistryContract();
      const credentialHash = await contract.call("getCredentialOf", [userAddress]);
      return credentialHash.toString();
    } catch (error) {
      console.error(`Error getting credential for ${userAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get credential metadata by hash
   */
  async getMetadata(credentialHash: string): Promise<CredentialMetadata> {
    try {
      const contract = this.getRegistryContract();
      const metadata = await contract.call("getMetadata", [credentialHash]);
      
      return {
        level: parseInt(metadata[0].toString()),
        statusBits: metadata[1].toString(),
        updatedAt: metadata[2].toString(),
        owner: metadata[3],
        exists: metadata[4]
      };
    } catch (error) {
      console.error(`Error getting metadata for credential ${credentialHash}:`, error);
      throw error;
    }
  }

  /**
   * Get complete KYC status for a user
   */
  async getKYCStatus(userAddress: string): Promise<KYCStatus> {
    try {
      const credentialHash = await this.getCredentialOf(userAddress);
      
      if (credentialHash === "0" || !credentialHash) {
        return {
          hasCredential: false
        };
      }

      const metadata = await this.getMetadata(credentialHash);
      
      return {
        hasCredential: metadata.exists,
        credentialHash,
        metadata
      };
    } catch (error) {
      console.error(`Error getting KYC status for ${userAddress}:`, error);
      return {
        hasCredential: false
      };
    }
  }

  /**
   * Check if user has completed KYC
   */
  async hasKYC(userAddress: string): Promise<boolean> {
    try {
      const status = await this.getKYCStatus(userAddress);
      return status.hasCredential;
    } catch (error) {
      console.error(`Error checking KYC status for ${userAddress}:`, error);
      return false;
    }
  }

  /**
   * Get user's KYC level
   */
  async getUserKYCLevel(userAddress: string): Promise<number> {
    try {
      const status = await this.getKYCStatus(userAddress);
      return status.metadata?.level || 0;
    } catch (error) {
      console.error(`Error getting KYC level for ${userAddress}:`, error);
      return 0;
    }
  }

  /**
   * Verify credential exists and get its details
   */
  async verifyCredential(credentialHash: string): Promise<CredentialMetadata | null> {
    try {
      const metadata = await this.getMetadata(credentialHash);
      return metadata.exists ? metadata : null;
    } catch (error) {
      console.error(`Error verifying credential ${credentialHash}:`, error);
      return null;
    }
  }

  // ========================
  // ADMIN FUNCTIONS (Owner Only)
  // ========================

  /**
   * Register credential for user (admin only)
   */
  async registerCredentialForUser(
    userAddress: string,
    credentialHash: string,
    level: number,
    statusBits: string
  ): Promise<KYCSubmissionResult> {
    try {
      const contract = this.getRegistryContract();
      
      const tx = await contract.call("registerCredentialForUser", [
        userAddress,
        credentialHash,
        level,
        statusBits
      ]);

      return {
        success: true,
        transactionHash: tx.hash || tx.receipt?.transactionHash,
        credentialHash,
        level,
        gasUsed: tx.receipt?.gasUsed?.toString()
      };
    } catch (error: any) {
      console.error("Error registering credential for user:", error);
      return {
        success: false,
        error: error.message || "Failed to register credential for user"
      };
    }
  }

  /**
   * Force register credential for user (admin only, can overwrite)
   */
  async forceRegisterCredentialForUser(
    userAddress: string,
    credentialHash: string,
    level: number,
    statusBits: string
  ): Promise<KYCSubmissionResult> {
    try {
      const contract = this.getRegistryContract();
      
      const tx = await contract.call("forceRegisterCredentialForUser", [
        userAddress,
        credentialHash,
        level,
        statusBits
      ]);

      return {
        success: true,
        transactionHash: tx.hash || tx.receipt?.transactionHash,
        credentialHash,
        level,
        gasUsed: tx.receipt?.gasUsed?.toString()
      };
    } catch (error: any) {
      console.error("Error force registering credential for user:", error);
      return {
        success: false,
        error: error.message || "Failed to force register credential for user"
      };
    }
  }

  /**
   * Set new verifier contract (admin only)
   */
  async setVerifier(newVerifierAddress: string): Promise<TransactionResult> {
    try {
      const contract = this.getRegistryContract();
      const tx = await contract.call("setVerifier", [newVerifierAddress]);
      console.log("Verifier contract updated successfully");
      return tx;
    } catch (error) {
      console.error("Error setting new verifier:", error);
      throw error;
    }
  }

  /**
   * Get current verifier contract address
   */
  async getVerifier(): Promise<string> {
    try {
      const contract = this.getRegistryContract();
      const verifierAddress = await contract.call("verifier");
      return verifierAddress;
    } catch (error) {
      console.error("Error getting verifier address:", error);
      throw error;
    }
  }

  /**
   * Get contract owner address
   */
  async getOwner(): Promise<string> {
    try {
      const contract = this.getRegistryContract();
      const owner = await contract.call("owner");
      return owner;
    } catch (error) {
      console.error("Error getting contract owner:", error);
      throw error;
    }
  }

  /**
   * Check if address is contract owner
   */
  async isOwner(address: string): Promise<boolean> {
    try {
      const owner = await this.getOwner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Error checking owner status:", error);
      return false;
    }
  }

  // ========================
  // EVENT LISTENERS
  // ========================

  /**
   * Listen to KYCUpdated events
   */
  async onKYCUpdated(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getRegistryContract();
      await contract.events.addEventListener("KYCUpdated", callback);
    } catch (error) {
      console.error("Error setting up KYCUpdated listener:", error);
      throw error;
    }
  }

  /**
   * Listen to KYCRegisteredByAdmin events
   */
  async onKYCRegisteredByAdmin(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getRegistryContract();
      await contract.events.addEventListener("KYCRegisteredByAdmin", callback);
    } catch (error) {
      console.error("Error setting up KYCRegisteredByAdmin listener:", error);
      throw error;
    }
  }

  /**
   * Listen to KYCForceRegistered events
   */
  async onKYCForceRegistered(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getRegistryContract();
      await contract.events.addEventListener("KYCForceRegistered", callback);
    } catch (error) {
      console.error("Error setting up KYCForceRegistered listener:", error);
      throw error;
    }
  }

  // ========================
  // UTILITY FUNCTIONS
  // ========================

  /**
   * Format timestamp to readable date
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  }

  /**
   * Get level name from number
   */
  static getLevelName(level: number): string {
    switch (level) {
      case 1:
        return "Basic";
      case 2:
        return "Verified";
      case 3:
        return "Premium";
      default:
        return "Unknown";
    }
  }

  /**
   * Get level color for UI
   */
  static getLevelColor(level: number): string {
    switch (level) {
      case 1:
        return "#CD7F32"; // Bronze
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#FFD700"; // Gold
      default:
        return "#666666"; // Gray
    }
  }

  /**
   * Parse status bits to human-readable verification methods
   */
  static parseStatusBits(statusBits: string): string[] {
    const bits = parseInt(statusBits);
    const verifications: string[] = [];

    if (bits & 1) verifications.push("Email Verified");
    if (bits & 2) verifications.push("Phone Verified");
    if (bits & 4) verifications.push("ID Document Verified");
    if (bits & 8) verifications.push("Address Verified");
    if (bits & 16) verifications.push("Biometric Verified");
    if (bits & 32) verifications.push("Bank Account Verified");
    if (bits & 64) verifications.push("Employment Verified");
    if (bits & 128) verifications.push("Credit Check Verified");

    return verifications;
  }
}

/**
 * KYC Badge Contract Interface using Thirdweb SDK
 */
export class KYCBadgeContract {
  private sdk: ThirdwebSDK | null = null;
  private contract: SmartContract | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {}

  /**
   * Initialize the contract with wallet connection
   */
  async initialize(signer: ethers.Signer): Promise<void> {
    try {
      this.signer = signer;
      this.sdk = ThirdwebSDK.fromSigner(signer, CHAIN_ID);
      this.contract = await this.sdk.getContract(CONTRACT_ADDRESS, NFT_ABI);
      console.log("KYC Badge Contract initialized successfully");
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      throw new Error(`Contract initialization failed: ${error}`);
    }
  }

  /**
   * Get contract instance (throws if not initialized)
   */
  private getContract(): SmartContract {
    if (!this.contract) {
      throw new Error("Contract not initialized. Call initialize() first.");
    }
    return this.contract;
  }

  // ========================
  // READ FUNCTIONS
  // ========================

  /**
   * Get badge metadata by token ID
   */
  async getBadgeMetadata(tokenId: number): Promise<BadgeMetadata> {
    try {
      const contract = this.getContract();
      const metadata = await contract.call("metadataOf", [tokenId]);
      
      return {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        level: metadata.level,
        tier: metadata.tier
      };
    } catch (error) {
      console.error(`Error getting badge metadata for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get badge price in wei
   */
  async getBadgePrice(tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const price = await contract.call("prices", [tokenId]);
      return price.toString();
    } catch (error) {
      console.error(`Error getting badge price for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get badge price in ETH
   */
  async getBadgePriceInEth(tokenId: number): Promise<string> {
    const priceWei = await this.getBadgePrice(tokenId);
    return ethers.utils.formatEther(priceWei);
  }

  /**
   * Get max supply for a token
   */
  async getMaxSupply(tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const maxSupply = await contract.call("maxSupply", [tokenId]);
      return maxSupply.toString();
    } catch (error) {
      console.error(`Error getting max supply for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get total minted for a token
   */
  async getTotalMinted(tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const totalMinted = await contract.call("totalMinted", [tokenId]);
      return totalMinted.toString();
    } catch (error) {
      console.error(`Error getting total minted for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has claimed a specific badge
   */
  async hasUserClaimed(userAddress: string, tokenId: number): Promise<boolean> {
    try {
      const contract = this.getContract();
      const claimed = await contract.call("hasClaimed", [userAddress, tokenId]);
      return claimed;
    } catch (error) {
      console.error(`Error checking claim status for ${userAddress}, token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Verify if user owns a badge
   */
  async verifyClaim(userAddress: string, tokenId: number): Promise<boolean> {
    try {
      const contract = this.getContract();
      const verified = await contract.call("verifyClaim", [userAddress, tokenId]);
      return verified;
    } catch (error) {
      console.error(`Error verifying claim for ${userAddress}, token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's balance for a specific token
   */
  async getUserBalance(userAddress: string, tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const balance = await contract.call("balanceOf", [userAddress, tokenId]);
      return balance.toString();
    } catch (error) {
      console.error(`Error getting balance for ${userAddress}, token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get batch balances for multiple tokens
   */
  async getBatchBalances(accounts: string[], tokenIds: number[]): Promise<string[]> {
    try {
      const contract = this.getContract();
      const balances = await contract.call("balanceOfBatch", [accounts, tokenIds]);
      return balances.map((balance: any) => balance.toString());
    } catch (error) {
      console.error("Error getting batch balances:", error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats> {
    try {
      const contract = this.getContract();
      
      const [maxTotalSupply, totalMintedGlobal, nextTokenId, owner] = await Promise.all([
        contract.call("maxTotalSupply"),
        contract.call("totalMintedGlobal"),
        contract.call("nextTokenId"),
        contract.call("owner")
      ]);

      return {
        maxTotalSupply: maxTotalSupply.toString(),
        totalMintedGlobal: totalMintedGlobal.toString(),
        nextTokenId: nextTokenId.toString(),
        owner: owner
      };
    } catch (error) {
      console.error("Error getting contract stats:", error);
      throw error;
    }
  }

  /**
   * Get complete badge information
   */
  async getBadgeInfo(tokenId: number, userAddress?: string): Promise<ContractBadgeInfo> {
    try {
      const [metadata, price, maxSupply, totalMinted] = await Promise.all([
        this.getBadgeMetadata(tokenId),
        this.getBadgePrice(tokenId),
        this.getMaxSupply(tokenId),
        this.getTotalMinted(tokenId)
      ]);

      let claimed = false;
      if (userAddress) {
        claimed = await this.hasUserClaimed(userAddress, tokenId);
      }

      return {
        tokenId,
        metadata,
        price,
        maxSupply,
        totalMinted,
        claimed
      };
    } catch (error) {
      console.error(`Error getting complete badge info for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get token URI (on-chain metadata)
   */
  async getTokenURI(tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const uri = await contract.call("uri", [tokenId]);
      return uri;
    } catch (error) {
      console.error(`Error getting token URI for token ${tokenId}:`, error);
      throw error;
    }
  }

  // ========================
  // WRITE FUNCTIONS
  // ========================

  /**
   * Claim a badge (pay the required price)
   */
  async claimBadge(tokenId: number): Promise<ClaimResult> {
    try {
      const contract = this.getContract();
      
      // Get the price first
      const price = await this.getBadgePrice(tokenId);
      
      // Execute the claim transaction
      const tx = await contract.call("claim", [tokenId], {
        value: price
      });

      return {
        success: true,
        transactionHash: tx.hash || tx.receipt?.transactionHash,
        gasUsed: tx.receipt?.gasUsed?.toString(),
        tokenId
      };
    } catch (error: any) {
      console.error(`Error claiming badge ${tokenId}:`, error);
      return {
        success: false,
        error: error.message || "Failed to claim badge",
        tokenId
      };
    }
  }

  /**
   * Burn a badge (remove from wallet)
   */
  async burnBadge(tokenId: number): Promise<TransactionResult> {
    try {
      const contract = this.getContract();
      const tx = await contract.call("burn", [tokenId]);
      console.log(`Badge ${tokenId} burned successfully`);
      return tx;
    } catch (error) {
      console.error(`Error burning badge ${tokenId}:`, error);
      throw error;
    }
  }

  // ========================
  // OWNER FUNCTIONS
  // ========================

  /**
   * Create a new badge (owner only)
   */
  async createBadge(
    name: string,
    description: string,
    image: string,
    level: string,
    tier: string,
    priceWei: string,
    maxSupply: string
  ): Promise<TransactionResult> {
    try {
      const contract = this.getContract();
      const tx = await contract.call("createBadge", [
        name,
        description,
        image,
        level,
        tier,
        priceWei,
        maxSupply
      ]);
      console.log("Badge created successfully");
      return tx;
    } catch (error) {
      console.error("Error creating badge:", error);
      throw error;
    }
  }

  /**
   * Set global max supply (owner only)
   */
  async setGlobalMaxSupply(maxTotal: string): Promise<TransactionResult> {
    try {
      const contract = this.getContract();
      const tx = await contract.call("setGlobalMaxSupply", [maxTotal]);
      console.log("Global max supply updated");
      return tx;
    } catch (error) {
      console.error("Error setting global max supply:", error);
      throw error;
    }
  }

  /**
   * Withdraw contract balance (owner only)
   */
  async withdraw(toAddress: string): Promise<TransactionResult> {
    try {
      const contract = this.getContract();
      const tx = await contract.call("withdraw", [toAddress]);
      console.log("Funds withdrawn successfully");
      return tx;
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      throw error;
    }
  }

  // ========================
  // EVENT LISTENERS
  // ========================

  /**
   * Listen to BadgeClaimed events
   */
  async onBadgeClaimed(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getContract();
      await contract.events.addEventListener("BadgeClaimed", callback);
    } catch (error) {
      console.error("Error setting up BadgeClaimed listener:", error);
      throw error;
    }
  }

  /**
   * Listen to BadgeBurned events
   */
  async onBadgeBurned(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getContract();
      await contract.events.addEventListener("BadgeBurned", callback);
    } catch (error) {
      console.error("Error setting up BadgeBurned listener:", error);
      throw error;
    }
  }

  /**
   * Listen to ConfigUpdated events
   */
  async onConfigUpdated(callback: (event: ContractEvent) => void): Promise<void> {
    try {
      const contract = this.getContract();
      await contract.events.addEventListener("ConfigUpdated", callback);
    } catch (error) {
      console.error("Error setting up ConfigUpdated listener:", error);
      throw error;
    }
  }

  // ========================
  // UTILITY FUNCTIONS
  // ========================

  /**
   * Convert Wei to ETH
   */
  static weiToEth(wei: string): string {
    return ethers.utils.formatEther(wei);
  }

  /**
   * Convert ETH to Wei
   */
  static ethToWei(eth: string): string {
    return ethers.utils.parseEther(eth).toString();
  }

  /**
   * Check if address is owner
   */
  async isOwner(address: string): Promise<boolean> {
    try {
      const stats = await this.getContractStats();
      return stats.owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Error checking owner status:", error);
      return false;
    }
  }

  /**
   * Get all available badges (by iterating through nextTokenId)
   */
  async getAllAvailableBadges(userAddress?: string): Promise<ContractBadgeInfo[]> {
    try {
      const stats = await this.getContractStats();
      const nextTokenId = parseInt(stats.nextTokenId);
      const badges: ContractBadgeInfo[] = [];

      // Iterate through all created badges (1 to nextTokenId - 1)
      for (let tokenId = 1; tokenId < nextTokenId; tokenId++) {
        try {
          const badgeInfo = await this.getBadgeInfo(tokenId, userAddress);
          badges.push(badgeInfo);
        } catch (error) {
          console.warn(`Could not fetch info for token ${tokenId}:`, error);
        }
      }

      return badges;
    } catch (error) {
      console.error("Error getting all available badges:", error);
      throw error;
    }
  }

  /**
   * Get user's owned badges
   */
  async getUserOwnedBadges(userAddress: string): Promise<ContractBadgeInfo[]> {
    try {
      const allBadges = await this.getAllAvailableBadges(userAddress);
      return allBadges.filter(badge => badge.claimed);
    } catch (error) {
      console.error("Error getting user owned badges:", error);
      throw error;
    }
  }

  /**
   * Estimate gas for claiming a badge
   */
  async estimateClaimGas(tokenId: number): Promise<string> {
    try {
      const contract = this.getContract();
      const price = await this.getBadgePrice(tokenId);
      
      // This is a rough estimate - actual gas estimation would need the contract instance
      // For now, return a reasonable estimate
      return "100000"; // Typical gas limit for NFT claims
    } catch (error) {
      console.error("Error estimating gas:", error);
      throw error;
    }
  }

  /**
   * Check if a badge is available for claiming
   */
  async isBadgeAvailable(tokenId: number): Promise<{
    available: boolean;
    reason?: string;
    price: string;
    maxSupply: string;
    totalMinted: string;
  }> {
    try {
      const [price, maxSupply, totalMinted] = await Promise.all([
        this.getBadgePrice(tokenId),
        this.getMaxSupply(tokenId),
        this.getTotalMinted(tokenId)
      ]);

      // Check if badge exists (price > 0)
      if (price === "0") {
        return {
          available: false,
          reason: "Badge does not exist or is not claimable",
          price,
          maxSupply,
          totalMinted
        };
      }

      // Check supply limits
      const maxSupplyNum = parseInt(maxSupply);
      const totalMintedNum = parseInt(totalMinted);

      if (maxSupplyNum > 0 && totalMintedNum >= maxSupplyNum) {
        return {
          available: false,
          reason: "Maximum supply reached",
          price,
          maxSupply,
          totalMinted
        };
      }

      return {
        available: true,
        price,
        maxSupply,
        totalMinted
      };
    } catch (error) {
      console.error(`Error checking badge availability for token ${tokenId}:`, error);
      throw error;
    }
  }
}

/**
 * Combined KYC System Contract Interface
 * Integrates ZK Proof Verification, KYC Registry, and KYC Badge functionality
 */
export class KYCSystemContract {
  private zkVerifier: ZKProofVerifier;
  private kycRegistry: KYCRegistryContract;
  private kycBadge: KYCBadgeContract;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.zkVerifier = new ZKProofVerifier();
    this.kycRegistry = new KYCRegistryContract();
    this.kycBadge = new KYCBadgeContract();
  }

  /**
   * Initialize all contracts
   */
  async initialize(signer: ethers.Signer): Promise<void> {
    this.signer = signer;
    
    // Initialize all contracts
    await Promise.all([
      this.kycBadge.initialize(signer),
      KYC_REGISTRY_CONTRACT_ADDRESS ? this.kycRegistry.initialize(signer) : Promise.resolve(),
      VERIFIER_CONTRACT_ADDRESS ? this.zkVerifier.initialize(signer) : Promise.resolve()
    ]);
  }

  /**
   * Complete KYC workflow: Submit ZK proof to registry and optionally claim badge
   */
  async completeKYCWorkflow(
    proofData: ZKProofData,
    badgeTokenId?: number
  ): Promise<{
    registrySubmission: KYCSubmissionResult;
    proofVerification?: VerificationResult;
    badgeClaim?: ClaimResult;
    success: boolean;
  }> {
    try {
      // Step 1: Submit proof to KYC Registry (this includes verification)
      console.log("Step 1: Submitting ZK proof to KYC Registry...");
      const registrySubmission = await this.kycRegistry.submitKYCProof(proofData);
      
      if (!registrySubmission.success) {
        return {
          registrySubmission,
          success: false
        };
      }

      let badgeClaim: ClaimResult | undefined;
      
      // Step 2: Optionally claim KYC badge
      if (badgeTokenId !== undefined) {
        console.log("Step 2: Claiming KYC badge...");
        badgeClaim = await this.kycBadge.claimBadge(badgeTokenId);
      }

      return {
        registrySubmission,
        badgeClaim,
        success: registrySubmission.success && (badgeTokenId === undefined || badgeClaim?.success === true)
      };
    } catch (error) {
      console.error("Error in complete KYC workflow:", error);
      return {
        registrySubmission: {
          success: false,
          error: "Workflow failed"
        },
        success: false
      };
    }
  }

  /**
   * Verify KYC status (check registry credentials and optionally badge ownership)
   */
  async verifyKYCStatus(
    userAddress: string,
    badgeTokenId?: number,
    proofData?: ZKProofData
  ): Promise<{
    registryStatus: KYCStatus;
    hasValidBadge?: boolean;
    proofIsValid?: boolean;
    badgeInfo?: ContractBadgeInfo;
  }> {
    try {
      // Check KYC Registry status
      const registryStatus = await this.kycRegistry.getKYCStatus(userAddress);

      let hasValidBadge: boolean | undefined;
      let badgeInfo: ContractBadgeInfo | undefined;
      
      // Check badge ownership if badgeTokenId provided
      if (badgeTokenId !== undefined) {
        hasValidBadge = await this.kycBadge.verifyClaim(userAddress, badgeTokenId);
        badgeInfo = await this.kycBadge.getBadgeInfo(badgeTokenId, userAddress);
      }

      let proofIsValid: boolean | undefined;
      if (proofData && VERIFIER_CONTRACT_ADDRESS) {
        const verification = await this.zkVerifier.verifyProof(proofData);
        proofIsValid = verification.isValid;
      }

      return {
        registryStatus,
        hasValidBadge,
        proofIsValid,
        badgeInfo
      };
    } catch (error) {
      console.error("Error verifying KYC status:", error);
      return {
        registryStatus: {
          hasCredential: false
        },
        hasValidBadge: false,
        proofIsValid: false
      };
    }
  }

  // Expose individual contract interfaces
  get verifier(): ZKProofVerifier {
    return this.zkVerifier;
  }

  get registry(): KYCRegistryContract {
    return this.kycRegistry;
  }

  get badge(): KYCBadgeContract {
    return this.kycBadge;
  }
}

// Export singleton instances
export const kycRegistryContract = new KYCRegistryContract();
export const kycBadgeContract = new KYCBadgeContract();
export const zkProofVerifier = new ZKProofVerifier();
export const kycSystemContract = new KYCSystemContract();

// Export utility functions
export const contractUtils = {
  weiToEth: KYCBadgeContract.weiToEth,
  ethToWei: KYCBadgeContract.ethToWei,
  formatProofForContract: ZKProofVerifier.formatProofForContract,
  validateProofData: ZKProofVerifier.validateProofData,
  formatTimestamp: KYCRegistryContract.formatTimestamp,
  getLevelName: KYCRegistryContract.getLevelName,
  getLevelColor: KYCRegistryContract.getLevelColor,
  parseStatusBits: KYCRegistryContract.parseStatusBits,
  CONTRACT_ADDRESS,
  VERIFIER_CONTRACT_ADDRESS,
  KYC_REGISTRY_CONTRACT_ADDRESS,
  CHAIN_ID
};
