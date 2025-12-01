import { useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { useNavigate } from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";
// Removed KYC validation components - using new workflow\n// TODO: Pass aadhaarUploadResult?.extractedPhoto to FaceVerification component
import { ProgressTracker } from "@/components/ProgressTracker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { AadhaarUploadSteps, AadhaarUploadResult } from "@/components/AadhaarUploadSteps";
import { FaceVerification, FaceVerificationResult } from "../components/FaceVerification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationTab } from "@/components/VerificationTab";
import { Shield, FileText, Camera, Verified } from "lucide-react";
import { motion } from "framer-motion";

interface KYCData {
  age: string;
  nationality: string;
  attributes: string;
}

const KYCDashboard = () => {
  const address = useAddress();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  
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
    proofGeneration: false
  });

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
      setActiveTab("status");
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
                { id: '4', label: 'NFT Minting & Credential Hash', completed: currentStep >= 4 },
              ]} 
            />

            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Aadhaar Upload
                  </TabsTrigger>
                  <TabsTrigger value="verify" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Face Verification
                  </TabsTrigger>
                  <TabsTrigger value="status" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    ZK Proof & NFT
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



                {/* Tab 3: ZK Proof & NFT Status */}
                <TabsContent value="status" className="mt-6">
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
                              ZK Proof Generation & NFT Minting
                            </CardTitle>
                            <CardDescription>
                              Your KYC data will be processed through zero-knowledge circuits for privacy-preserving verification
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
                              
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                  Ready to generate zero-knowledge proof and mint your KYC NFT
                                </p>
                                <motion.button
                                  className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    // This will trigger the ZK circuit processing
                                    console.log('Starting ZK proof generation...');
                                    console.log('Aadhaar data:', aadhaarUploadResult);
                                    console.log('Face verification:', faceVerificationResult);
                                  }}
                                >
                                  Generate ZK Proof & Mint NFT
                                </motion.button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <VerificationTab
                          userWalletAddress={address}
                          aadhaarUploadResult={aadhaarUploadResult}
                          faceVerificationResult={faceVerificationResult}
                          kycData={kycData}
                          proofData={proofData}
                          ipfsHash={ipfsHash}
                          txHash={txHash}
                        />
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
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KYCDashboard;
