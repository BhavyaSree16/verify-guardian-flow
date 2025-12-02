import { useState, useEffect } from "react";
import { useAddress, useSigner, useConnectionStatus } from "@thirdweb-dev/react";
import { useNavigate } from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";
// Removed KYC validation components - using new workflow\n// TODO: Pass aadhaarUploadResult?.extractedPhoto to FaceVerification component
import { ProgressTracker } from "@/components/ProgressTracker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { AadhaarUploadSteps, AadhaarUploadResult } from "@/components/AadhaarUploadSteps";
import { FaceVerification, FaceVerificationResult } from "../components/FaceVerification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VerificationTab } from "@/components/VerificationTab";
import { Shield, FileText, Camera, Verified, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { generateKycProof, prepareKycOnchainData, type KycInputs } from "../utils/zkp";
import { kycSystemContract, contractUtils, type ZKProofData } from "../apis/chain_index";

interface KYCData {
  age: string;
  nationality: string;
  attributes: string;
}

// Registry Status Check Component
const RegistryStatusCheck = ({ address }: { address: string }) => {
  const [registryStatus, setRegistryStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Owner state for admin functions
  const [isContractOwner, setIsContractOwner] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const status = await kycSystemContract.registry.getKYCStatus(address);
        setRegistryStatus(status);
      } catch (error) {
        console.error('Registry status check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      checkStatus();
    }
  }, [address]);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking registry status...</span>
        </div>
      </div>
    );
  }

  if (!registryStatus) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Registry Status:</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Unable to check registry status</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Registry Status:</h4>
      {registryStatus.hasCredential ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Credentials Found
            </span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Level:</strong> {contractUtils.getLevelName(registryStatus.metadata?.level || 0)} ({registryStatus.metadata?.level})</p>
            <p><strong>Hash:</strong> {registryStatus.credentialHash?.substring(0, 20)}...</p>
            <p><strong>Updated:</strong> {contractUtils.formatTimestamp(registryStatus.metadata?.updatedAt || '0')}</p>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💡 You can generate a new proof to potentially upgrade your level
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 dark:text-orange-300">
            No credentials found - Generate your first ZK proof!
          </span>
        </div>
      )}
    </div>
  );
};

const KYCDashboard = () => {
  const address = useAddress();
  const signer = useSigner();
  const connectionStatus = useConnectionStatus();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const [contractInitialized, setContractInitialized] = useState(false);
  
  // Original KYC flow state
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // New KYC features state
  const [aadhaarUploadResult, setAadhaarUploadResult] = useState<AadhaarUploadResult | null>(null);
  const [faceVerificationResult, setFaceVerificationResult] = useState<FaceVerificationResult | null>(null);
  const [kycStepCompleted, setKycStepCompleted] = useState({
    aadhaarUpload: false,
    faceVerification: false,
    kycForm: false,
    proofGeneration: false,
    nftMinting: false
  });

  // ZK Proof state
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [zkProofResult, setZkProofResult] = useState<any>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // NFT Minting state
  const [isMintingNFT, setIsMintingNFT] = useState(false);
  const [nftResult, setNftResult] = useState<any>(null);
  const [mintingError, setMintingError] = useState<string | null>(null);
  const [proofJson, setProofJson] = useState<any>(null);
  const [publicJson, setPublicJson] = useState<any>(null);
  
  // Admin state
  const [isContractOwner, setIsContractOwner] = useState(false);

  // Initialize smart contracts when wallet is connected
  useEffect(() => {
    const initializeContracts = async () => {
      if (signer && connectionStatus === 'connected' && !contractInitialized && address) {
        try {
          await kycSystemContract.initialize(signer);
          setContractInitialized(true);
          console.log('Smart contracts initialized successfully');
          
          // Check if user is contract owner for admin functions
          const ownerStatus = await kycSystemContract.badge.isOwner(address);
          setIsContractOwner(ownerStatus);
          
        } catch (error) {
          console.error('Failed to initialize smart contracts:', error);
          toast.error('Failed to initialize smart contracts');
        }
      }
    };

    initializeContracts();
  }, [signer, connectionStatus, contractInitialized, address]);

  const handleKYCSubmit = (data: KYCData) => {
    setKycData(data);
    setKycStepCompleted(prev => ({ ...prev, kycForm: true }));
    setCurrentStep(1);
  };

  const handleProofGenerated = (proof: any) => {
    setProofData(proof);
    setKycStepCompleted(prev => ({ ...prev, proofGeneration: true }));
    setCurrentStep(2);
  };

  const handleIPFSUpload = (data: { cid: string }) => {
    setIpfsHash(data.cid);
    setCurrentStep(3);
  };

  const handleBlockchainSubmit = (tx: any) => {
    setTxHash(tx.hash);
    setCurrentStep(4);
  };

  const handleAadhaarUpload = (result: AadhaarUploadResult) => {
    setAadhaarUploadResult(result);
    setKycStepCompleted(prev => ({ ...prev, aadhaarUpload: true }));
  };

  const handleFaceVerification = (result: FaceVerificationResult) => {
    setFaceVerificationResult(result);
    setKycStepCompleted(prev => ({ ...prev, faceVerification: true }));
  };

  const moveToNextTab = () => {
    if (activeTab === "upload") {
      setActiveTab("verify");
    } else if (activeTab === "verify") {
      setActiveTab("proof");
    } else if (activeTab === "proof") {
      setActiveTab("nft");
    }
  };

  // Check KYC Registry status
  const checkKYCRegistryStatus = async () => {
    if (!address || !contractInitialized) {
      return null;
    }
    
    try {
      const status = await kycSystemContract.registry.getKYCStatus(address);
      return status;
    } catch (error) {
      console.error('Error checking KYC registry status:', error);
      return null;
    }
  };

  // Extract KYC verification inputs for ZK proof
  const extractKycInputs = (): KycInputs => {
    // Age verification: Check if user is 18+ from Aadhaar DOB
    let ageVerified = false;
    if (aadhaarUploadResult?.extractedData?.dob) {
      const dob = new Date(aadhaarUploadResult.extractedData.dob);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      ageVerified = age >= 18;
    }

    // Government ID verification: Check if Aadhaar data extraction was successful
    const govtIdVerified = aadhaarUploadResult?.extractedData?.success === true;

    // Face verification: Check if all face matches passed
    const faceVerified = faceVerificationResult?.details?.passportAadhaarMatch === true;

    // Liveliness verification: Check if live photo matches both Aadhaar and passport
    const livenessVerified = (
      faceVerificationResult?.details?.aadhaarLiveMatch === true &&
      faceVerificationResult?.details?.passportLiveMatch === true
    );

    // Generate random salt for privacy
    const salt = Math.floor(Math.random() * 1000000);

    console.log('KYC Inputs extracted:', {
      ageVerified,
      govtIdVerified,
      faceVerified,
      livenessVerified,
      salt
    });

    return {
      ageNatOK: ageVerified ? 1 : 0,
      govtIdOK: govtIdVerified ? 1 : 0,
      faceOK: faceVerified ? 1 : 0,
      livenessOK: livenessVerified ? 1 : 0,
      salt: salt
    };
  };

  // Generate ZK proof and submit to KYC Registry
  const handleGenerateZkProof = async () => {
    if (!aadhaarUploadResult || !faceVerificationResult) {
      toast.error('Please complete Aadhaar upload and face verification first');
      return;
    }

    if (!contractInitialized) {
      toast.error('Smart contracts not initialized. Please reconnect your wallet.');
      return;
    }

    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsGeneratingProof(true);
    setProofError(null);
    
    // Check if user already has credentials in registry
    try {
      const existingStatus = await checkKYCRegistryStatus();
      if (existingStatus?.hasCredential) {
        const proceed = window.confirm(
          `You already have KYC credentials in the registry (Level: ${contractUtils.getLevelName(existingStatus.metadata?.level || 0)}). ` +
          `Do you want to generate a new proof that may upgrade your level?`
        );
        if (!proceed) {
          setIsGeneratingProof(false);
          return;
        }
      }
    } catch (error) {
      console.warn('Could not check existing registry status:', error);
    }
    
    try {
      const inputs = extractKycInputs();
      
      console.log('Starting ZK proof generation with inputs:', inputs);
      toast.info('Generating zero-knowledge proof... This may take a few minutes.');
      
      // Step 1: Generate the proof with verification and Solidity calldata
      const result = await prepareKycOnchainData(inputs);
      
      console.log('ZK proof generated successfully:', result);
      
      if (!result.isValidOffchain) {
        throw new Error('ZK proof failed off-chain verification');
      }
      
      setZkProofResult(result);
      setProofData(result); // Update the existing proofData state
      
      // Step 2: Submit proof to KYC Registry contract
      toast.info('Submitting ZK proof to blockchain registry...');
      
      const proofData = contractUtils.formatProofForContract(
        result.proof, 
        result.publicSignals
      );
      
      if (!contractUtils.validateProofData(proofData)) {
        throw new Error('Invalid proof data structure');
      }
      
      const registryResult = await kycSystemContract.registry.submitKYCProof(proofData);
      
      if (!registryResult.success) {
        throw new Error(registryResult.error || 'Failed to submit proof to registry');
      }
      
      console.log('Proof submitted to registry successfully:', registryResult);
      
      // Create proof.json and public.json for download
      const proofJsonData = {
        proof: result.proof,
        calldata: result.calldata,
        registryTxHash: registryResult.transactionHash,
        credentialHash: registryResult.credentialHash,
        timestamp: new Date().toISOString(),
        algorithm: "Groth16",
        curve: "bn128"
      };
      
      const publicJsonData = {
        publicSignals: result.publicSignals,
        statusBits: result.statusBits?.toString(),
        level: result.level?.toString(),
        credentialHash: result.credentialHash?.toString(),
        registryCredentialHash: registryResult.credentialHash,
        isValidOffchain: result.isValidOffchain,
        isOnChain: true,
        registryTxHash: registryResult.transactionHash,
        timestamp: new Date().toISOString()
      };
      
      setProofJson(proofJsonData);
      setPublicJson(publicJsonData);
      
      setKycStepCompleted(prev => ({ ...prev, proofGeneration: true }));
      setCurrentStep(3);
      
      toast.success(
        `🎉 ZK proof generated and stored on-chain! ` +
        `Credential Hash: ${registryResult.credentialHash?.substring(0, 10)}...` +
        ` | Level: ${contractUtils.getLevelName(registryResult.level || 0)}`
      );
      
      // Auto-move to NFT tab after successful proof generation and registry submission
      setTimeout(() => {
        setActiveTab("nft");
        toast.info("🚀 Ready to mint your KYC Badge NFT with verified credentials!");
      }, 3000);
      
    } catch (error: any) {
      console.error('ZK proof generation or registry submission failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred during proof generation';
      setProofError(errorMessage);
      toast.error(`ZK proof process failed: ${errorMessage}`);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  // Mint NFT using KYC Registry credentials
  const handleMintNFT = async () => {
    if (!zkProofResult) {
      toast.error('Please generate ZK proof first');
      return;
    }

    if (!contractInitialized) {
      toast.error('Smart contracts not initialized. Please reconnect your wallet.');
      return;
    }

    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    setIsMintingNFT(true);
    setMintingError(null);
    
    try {
      const tokenId = 1; // Default token ID (badges start at 1, not 0)
      
      console.log('Starting NFT minting process with token ID:', tokenId);
      
      // Step 1: Verify KYC Registry status first
      toast.info('Verifying KYC credentials in registry...');
      const kycStatus = await kycSystemContract.registry.getKYCStatus(address);
      
      if (!kycStatus.hasCredential) {
        throw new Error('No KYC credentials found in registry. Please complete ZK proof submission first.');
      }
      
      const userLevel = kycStatus.metadata?.level || 0;
      const credentialHash = kycStatus.credentialHash;
      
      console.log('KYC Registry Status:', {
        hasCredential: kycStatus.hasCredential,
        level: userLevel,
        credentialHash: credentialHash?.substring(0, 10) + '...'
      });
      
      toast.success(`KYC Registry verified! Level: ${contractUtils.getLevelName(userLevel)}`);
      
      // Step 2: Check if badge is available and get pricing info
      toast.info('Checking badge availability and pricing...');
      let badgeAvailability = await kycSystemContract.badge.isBadgeAvailable(tokenId);
      
      // If badge doesn't exist and user is owner, create it automatically
      if (!badgeAvailability.available && badgeAvailability.reason?.includes('Badge does not exist')) {
        const isOwner = await kycSystemContract.badge.isOwner(address);
        if (isOwner) {
          toast.info('Creating basic KYC badge as contract owner...');
          try {
            await kycSystemContract.badge.createBadge(
              "KYC Basic Badge",
              "Basic KYC verification completed with essential identity documents",
              "https://via.placeholder.com/200x200/0066CC/FFFFFF?text=KYC+Badge",
              "Basic",
              "Bronze",
              contractUtils.ethToWei("0.001"), // 0.001 ETH
              "1000" // Max supply
            );
            toast.success('Badge created successfully!');
            
            // Recheck availability
            badgeAvailability = await kycSystemContract.badge.isBadgeAvailable(tokenId);
          } catch (createError) {
            console.error('Error creating badge:', createError);
            toast.error('Failed to create badge. Please create badges manually as contract owner.');
            throw new Error('Badge does not exist and could not be created automatically');
          }
        } else {
          throw new Error(
            'Badge does not exist. Please contact the contract owner to create badges first. ' +
            'The owner needs to call createBadge() to initialize available badges.'
          );
        }
      }
      
      if (!badgeAvailability.available) {
        throw new Error(badgeAvailability.reason || 'Badge not available');
      }

      // Step 3: Check if user already claimed this badge
      const alreadyClaimed = await kycSystemContract.badge.hasUserClaimed(address, tokenId);
      if (alreadyClaimed) {
        throw new Error('You have already claimed this KYC badge');
      }

      // Step 4: Get badge info for display
      const badgeInfo = await kycSystemContract.badge.getBadgeInfo(tokenId, address);
      const priceInEth = contractUtils.weiToEth(badgeInfo.price);
      
      toast.info(`Badge price: ${priceInEth} ETH. Confirming transaction...`);
      
      // Step 5: Optional - Verify ZK proof on-chain if verifier is available
      let zkVerificationResult = null;
      if (zkProofResult.proof && zkProofResult.publicSignals && contractUtils.VERIFIER_CONTRACT_ADDRESS) {
        try {
          const proofData = contractUtils.formatProofForContract(
            zkProofResult.proof, 
            zkProofResult.publicSignals
          );
          
          if (contractUtils.validateProofData(proofData)) {
            toast.info('Additional ZK proof verification...');
            zkVerificationResult = await kycSystemContract.verifier.verifyProof(proofData);
            
            if (zkVerificationResult.isValid) {
              toast.success('Additional ZK proof verification passed!');
            }
          }
        } catch (zkError) {
          console.warn('Additional ZK proof verification failed, continuing with registry credentials:', zkError);
        }
      }
      
      // Step 6: Claim the NFT badge
      toast.info('Minting KYC NFT badge... Please confirm transaction in your wallet.');
      
      const claimResult = await kycSystemContract.badge.claimBadge(tokenId);
      
      if (!claimResult.success) {
        throw new Error(claimResult.error || 'Failed to claim badge');
      }
      
      // Step 7: Get the final badge info and create comprehensive result
      const finalBadgeInfo = await kycSystemContract.badge.getBadgeInfo(tokenId, address);
      
      const nftResult = {
        tokenId: tokenId.toString(),
        contractAddress: contractUtils.CONTRACT_ADDRESS,
        txHash: claimResult.transactionHash || '',
        credentialHash: credentialHash,
        registryLevel: userLevel,
        registryLevelName: contractUtils.getLevelName(userLevel),
        statusBits: kycStatus.metadata?.statusBits,
        verificationMethods: contractUtils.parseStatusBits(kycStatus.metadata?.statusBits || '0'),
        mintedAt: new Date().toISOString(),
        updatedAt: contractUtils.formatTimestamp(kycStatus.metadata?.updatedAt || '0'),
        owner: address,
        verified: true,
        badgeMetadata: finalBadgeInfo.metadata,
        price: priceInEth,
        gasUsed: claimResult.gasUsed,
        zkVerified: zkVerificationResult?.isValid || false,
        registryVerified: true
      };
      
      setNftResult(nftResult);
      setTxHash(claimResult.transactionHash || '');
      setKycStepCompleted(prev => ({ ...prev, nftMinting: true }));
      setCurrentStep(4);
      
      toast.success(
        `🎉 KYC Badge NFT minted successfully! ` +
        `Token ID: ${tokenId} | Level: ${contractUtils.getLevelName(userLevel)}`
      );
      
    } catch (error: any) {
      console.error('NFT minting failed:', error);
      const errorMessage = error?.message || 'Unknown error occurred during NFT minting';
      setMintingError(errorMessage);
      toast.error(`NFT minting failed: ${errorMessage}`);
    } finally {
      setIsMintingNFT(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KYC Verification Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete your privacy-preserving KYC verification using zero-knowledge proofs
            and blockchain technology.
          </p>
        </motion.div>

        {!address ? (
          <div className="max-w-md mx-auto">
            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your wallet to start the KYC verification process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WalletConnect onWalletChange={() => {}} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <ProgressTracker 
              steps={[
                { id: '1', label: 'Aadhaar Upload & Extraction', completed: kycStepCompleted.aadhaarUpload },
                { id: '2', label: 'Face Verification & Liveliness', completed: kycStepCompleted.faceVerification },
                { id: '3', label: 'ZK Circuit Processing', completed: kycStepCompleted.proofGeneration },
                { id: '4', label: 'NFT Minting & Blockchain', completed: kycStepCompleted.nftMinting },
              ]} 
            />

            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Aadhaar Upload
                  </TabsTrigger>
                  <TabsTrigger value="verify" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Face Verification
                  </TabsTrigger>
                  <TabsTrigger value="proof" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    ZK Proof
                  </TabsTrigger>
                  <TabsTrigger value="nft" className="flex items-center gap-2">
                    <Verified className="h-4 w-4" />
                    NFT & Blockchain
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Aadhaar Upload */}
                <TabsContent value="upload" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <AadhaarUploadSteps
                      onUploadComplete={handleAadhaarUpload}
                      onNext={moveToNextTab}
                      userWalletAddress={address}
                    />
                  </motion.div>
                </TabsContent>

                {/* Tab 2: Face Verification */}
                <TabsContent value="verify" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {kycStepCompleted.aadhaarUpload ? (
                      <FaceVerification
                        onVerificationComplete={handleFaceVerification}
                        onNext={moveToNextTab}
                        userWalletAddress={address}
                        aadhaarPhotoFromAPI={aadhaarUploadResult?.extractedPhoto}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Complete Aadhaar Upload First</CardTitle>
                          <CardDescription>
                            You need to upload your Aadhaar ZIP file before proceeding to face verification.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <motion.button
                            onClick={() => setActiveTab("upload")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Go to Upload Tab
                          </motion.button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>



                {/* Tab 3: ZK Proof Generation */}
                <TabsContent value="proof" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {kycStepCompleted.aadhaarUpload && kycStepCompleted.faceVerification ? (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="h-6 w-6" />
                              Zero-Knowledge Proof Generation
                            </CardTitle>
                            <CardDescription>
                              Generate cryptographic proofs of your KYC verification without revealing personal data
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2">KYC Validation Criteria:</h4>
                                <ul className="space-y-1 text-sm">
                                  <li>✓ Age verification (18+)</li>
                                  <li>✓ Nationality verification</li>
                                  <li>✓ Government ID validation</li>
                                  <li>✓ Liveliness detection + Face matching</li>
                                </ul>
                              </div>
                              
                              {/* Registry Status Check */}
                              {contractInitialized && address && (
                                <RegistryStatusCheck address={address} />
                              )}
                              
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                  Ready to generate zero-knowledge proof and mint your KYC NFT
                                </p>
                                <motion.button
                                  className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  whileHover={{ scale: isGeneratingProof ? 1 : 1.05 }}
                                  whileTap={{ scale: isGeneratingProof ? 1 : 0.95 }}
                                  onClick={handleGenerateZkProof}
                                  disabled={isGeneratingProof}
                                >
                                  {isGeneratingProof ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Generating ZK Proof...
                                    </>
                                  ) : (
                                    'Generate Zero-Knowledge Proof'
                                  )}
                                </motion.button>
                              </div>
                              
                              {/* ZK Proof Status */}
                              {(zkProofResult || proofError || isGeneratingProof) && (
                                <div className="mt-4 p-4 border rounded-lg">
                                  {isGeneratingProof && (
                                    <div className="flex items-center gap-3 text-blue-600">
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <div>
                                        <p className="font-medium">Generating Zero-Knowledge Proof</p>
                                        <p className="text-sm text-gray-600">This process may take 2-5 minutes depending on your device...</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {zkProofResult && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-medium">ZK Proof Generated Successfully!</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-600">Status Bits:</span>
                                          <p className="font-mono">{zkProofResult.statusBits?.toString()}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">KYC Level:</span>
                                          <p className="font-mono">{zkProofResult.level?.toString()}</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Credential Hash:</span>
                                          <p className="font-mono text-xs">{zkProofResult.credentialHash?.toString().substring(0, 20)}...</p>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Off-chain Verification:</span>
                                          <p className={`font-medium ${zkProofResult.isValidOffchain ? 'text-green-600' : 'text-red-600'}`}>
                                            {zkProofResult.isValidOffchain ? 'PASSED' : 'FAILED'}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {/* Download Proof Files */}
                                      <div className="flex gap-2 mt-4">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([JSON.stringify(proofJson, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `proof-${Date.now()}.json`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            URL.revokeObjectURL(url);
                                            toast.success('Proof file downloaded');
                                          }}
                                        >
                                          Download proof.json
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([JSON.stringify(publicJson, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `public-${Date.now()}.json`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            URL.revokeObjectURL(url);
                                            toast.success('Public signals file downloaded');
                                          }}
                                        >
                                          Download public.json
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            moveToNextTab();
                                          }}
                                        >
                                          Continue to NFT Minting →
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {proofError && (
                                    <div className="flex items-start gap-3 text-red-600">
                                      <AlertCircle className="h-5 w-5 mt-0.5" />
                                      <div>
                                        <p className="font-medium">ZK Proof Generation Failed</p>
                                        <p className="text-sm text-gray-600 mt-1">{proofError}</p>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="mt-2"
                                          onClick={() => {
                                            setProofError(null);
                                            handleGenerateZkProof();
                                          }}
                                        >
                                          Retry
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Complete Previous Steps</CardTitle>
                          <CardDescription>
                            Please complete Aadhaar upload and face verification before proceeding to ZK proof generation.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {kycStepCompleted.aadhaarUpload ? (
                                <div className="h-4 w-4 rounded-full bg-green-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-gray-300" />
                              )}
                              <span>Aadhaar Upload & Extraction</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {kycStepCompleted.faceVerification ? (
                                <div className="h-4 w-4 rounded-full bg-green-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-gray-300" />
                              )}
                              <span>Face Verification & Liveliness</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>

                {/* Tab 4: NFT Minting & Blockchain */}
                <TabsContent value="nft" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {kycStepCompleted.proofGeneration ? (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Verified className="h-6 w-6" />
                              NFT Minting & Blockchain Integration
                            </CardTitle>
                            <CardDescription>
                              Mint your soulbound NFT and store the credential hash on blockchain
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Admin Badge Creation Section */}
                              {isContractOwner && (
                                <Card className="border-blue-200 bg-blue-50/50">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Shield className="h-5 w-5" />
                                      Contract Owner Actions
                                    </CardTitle>
                                    <CardDescription>
                                      Create badges for users to claim. Required before NFT minting can work.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <Button
                                      onClick={async () => {
                                        try {
                                          toast.info('Creating default badge set...');
                                          
                                          const priceWei = contractUtils.ethToWei("0.001");
                                          await kycSystemContract.badge.createBadge(
                                            "KYC Basic Badge",
                                            "Basic KYC verification completed with essential identity documents",
                                            "https://via.placeholder.com/200x200/CD7F32/FFFFFF?text=Basic+KYC",
                                            "Basic",
                                            "Bronze",
                                            priceWei,
                                            "1000"
                                          );
                                          
                                          toast.success('Basic KYC Badge created! Users can now mint NFTs.');
                                        } catch (error: any) {
                                          console.error('Error creating badge:', error);
                                          toast.error(`Failed to create badge: ${error.message}`);
                                        }
                                      }}
                                      className="w-full"
                                      variant="outline"
                                    >
                                      Create Basic Badge (0.001 ETH)
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                      This will create tokenId 1 which is required for NFT minting to work.
                                    </p>
                                  </CardContent>
                                </Card>
                              )}
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2">Blockchain Deployment:</h4>
                                <ul className="space-y-1 text-sm">
                                  <li>✓ Deploy verification contract</li>
                                  <li>✓ Submit ZK proof for on-chain verification</li>
                                  <li>✓ Mint soulbound NFT credential</li>
                                  <li>✓ Store credential hash permanently</li>
                                </ul>
                              </div>
                              
                              {!nftResult ? (
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground mb-4">
                                    Ready to mint your KYC verification NFT and store on blockchain
                                  </p>
                                  <motion.button
                                    className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                    whileHover={{ scale: isMintingNFT ? 1 : 1.05 }}
                                    whileTap={{ scale: isMintingNFT ? 1 : 0.95 }}
                                    onClick={() => handleMintNFT()}
                                    disabled={isMintingNFT}
                                  >
                                    {isMintingNFT ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Minting NFT...
                                      </>
                                    ) : (
                                      'Mint KYC NFT & Deploy to Blockchain'
                                    )}
                                  </motion.button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">KYC Badge NFT Minted Successfully!</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Token ID:</span> {nftResult.tokenId}
                                    </div>
                                    <div>
                                      <span className="font-medium">Badge Name:</span> {nftResult.badgeMetadata?.name || 'KYC Badge'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Contract:</span> 
                                      <a 
                                        href={`https://sepolia.etherscan.io/address/${nftResult.contractAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline ml-1"
                                      >
                                        {nftResult.contractAddress?.slice(0, 10)}...
                                      </a>
                                    </div>
                                    <div>
                                      <span className="font-medium">Price Paid:</span> {nftResult.price} ETH
                                    </div>
                                    <div>
                                      <span className="font-medium">Transaction:</span>
                                      <a 
                                        href={`https://sepolia.etherscan.io/tx/${nftResult.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline ml-1"
                                      >
                                        {nftResult.txHash?.slice(0, 10)}...
                                      </a>
                                    </div>
                                    <div>
                                      <span className="font-medium">ZK Verified:</span> 
                                      <span className={nftResult.zkVerified ? 'text-green-600' : 'text-yellow-600'}>
                                        {nftResult.zkVerified ? 'Yes ✓' : 'Skipped ⚠️'}
                                      </span>
                                    </div>
                                  </div>
                                  {nftResult.gasUsed && (
                                    <div className="text-xs text-muted-foreground">
                                      Gas used: {nftResult.gasUsed}
                                    </div>
                                  )}
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        window.open(`https://sepolia.etherscan.io/tx/${nftResult.txHash}`, '_blank');
                                      }}
                                    >
                                      View on Etherscan
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        navigate('/profile');
                                      }}
                                    >
                                      View Profile
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* NFT Minting Status */}
                              {(isMintingNFT || mintingError) && (
                                <div className="mt-4 p-4 border rounded-lg">
                                  {isMintingNFT && (
                                    <div className="flex items-center gap-3 text-blue-600">
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <div>
                                        <p className="font-medium">Minting NFT & Deploying to Blockchain</p>
                                        <p className="text-sm text-gray-600">Please confirm the transaction in your wallet...</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {mintingError && (
                                    <div className="flex items-start gap-3 text-red-600">
                                      <AlertCircle className="h-5 w-5 mt-0.5" />
                                      <div>
                                        <p className="font-medium">NFT Minting Failed</p>
                                        <p className="text-sm text-gray-600 mt-1">{mintingError}</p>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="mt-2"
                                          onClick={() => {
                                            setMintingError(null);
                                            handleMintNFT();
                                          }}
                                        >
                                          Retry
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <VerificationTab
                          userWalletAddress={address}
                          aadhaarUploadResult={aadhaarUploadResult}
                          faceVerificationResult={faceVerificationResult}
                          kycData={kycData}
                          proofData={zkProofResult || proofData}
                          ipfsHash={ipfsHash}
                          txHash={nftResult?.txHash || txHash}
                          proofJson={proofJson}
                          publicJson={publicJson}
                        />
                      </div>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Generate ZK Proof First</CardTitle>
                          <CardDescription>
                            Please complete ZK proof generation before proceeding to NFT minting.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <motion.button
                            onClick={() => setActiveTab("proof")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Go to ZK Proof Tab
                          </motion.button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KYCDashboard;
