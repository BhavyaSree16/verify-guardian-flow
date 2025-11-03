import { useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { useNavigate } from "react-router-dom";
import { WalletConnect } from "@/components/WalletConnect";
import { KYCForm } from "@/components/KYCForm";
import { ProofGenerator } from "@/components/ProofGenerator";
import { IPFSUploader } from "@/components/IPFSUploader";
import { BlockchainSubmit } from "@/components/BlockchainSubmit";
import { NFTMinter } from "@/components/NFTMinter";
import { ProgressTracker } from "@/components/ProgressTracker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
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
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [proofData, setProofData] = useState<any>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleKYCSubmit = (data: KYCData) => {
    setKycData(data);
    setCurrentStep(1);
  };

  const handleProofGenerated = (proof: any) => {
    setProofData(proof);
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
                { id: '1', label: 'KYC Information', completed: currentStep >= 1 },
                { id: '2', label: 'Generate Proof', completed: currentStep >= 2 },
                { id: '3', label: 'Upload to IPFS', completed: currentStep >= 3 },
                { id: '4', label: 'Submit On-Chain', completed: currentStep >= 4 },
              ]} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <KYCForm onVerificationComplete={handleKYCSubmit} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ProofGenerator
                  enabled={!!kycData}
                  onProofGenerated={handleProofGenerated}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <IPFSUploader
                  enabled={!!proofData}
                  onUploadComplete={handleIPFSUpload}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <BlockchainSubmit
                  enabled={!!ipfsHash}
                  onSubmitComplete={handleBlockchainSubmit}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="lg:col-span-2"
              >
                <NFTMinter enabled={!!txHash} />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KYCDashboard;
