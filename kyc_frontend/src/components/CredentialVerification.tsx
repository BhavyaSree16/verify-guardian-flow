import { useState, useEffect } from "react";
import { useAddress, useSigner, useConnectionStatus } from "@thirdweb-dev/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, User, Hash, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { kycSystemContract, contractUtils } from "../apis/chain_index";

interface CredentialVerificationProps {
  className?: string;
}

export const CredentialVerification = ({ className }: CredentialVerificationProps) => {
  const address = useAddress();
  const signer = useSigner();
  const connectionStatus = useConnectionStatus();
  
  // Contract initialization state
  const [contractInitialized, setContractInitialized] = useState(false);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [credentialHashToVerify, setCredentialHashToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState({
    totalCredentials: 0,
    validCredentials: 0,
    myCredentials: [] as any[],
    recentActivity: 0
  });

  // Initialize smart contracts when wallet is connected
  useEffect(() => {
    const initializeContracts = async () => {
      if (signer && connectionStatus === 'connected' && !contractInitialized && address) {
        try {
          await kycSystemContract.initialize(signer);
          setContractInitialized(true);
          console.log('Smart contracts initialized successfully');
        } catch (error) {
          console.error('Failed to initialize smart contracts:', error);
          toast.error('Failed to initialize smart contracts');
        }
      }
    };

    initializeContracts();
  }, [signer, connectionStatus, contractInitialized, address]);

  // Verification Functions
  const handleCredentialVerification = async () => {
    if (!credentialHashToVerify.trim()) {
      setVerificationError('Please enter a credential hash to verify');
      return;
    }

    if (!credentialHashToVerify.startsWith('0x')) {
      setVerificationError('Credential hash must start with 0x');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      // Use KYC Registry getMetadata function directly from ABI
      const metadata = await kycSystemContract.registry.getMetadata(credentialHashToVerify);
      
      if (metadata && metadata.exists) {
        setVerificationResult({
          isValid: true,
          owner: metadata.owner,
          level: parseInt(metadata.level.toString()),
          timestamp: parseInt(metadata.updatedAt.toString()),
          statusBits: metadata.statusBits.toString(),
          verificationMethods: contractUtils.parseStatusBits(metadata.statusBits.toString()),
          credentialHash: credentialHashToVerify
        });
        toast.success('Credential verified successfully!');
      } else {
        setVerificationResult({
          isValid: false,
          credentialHash: credentialHashToVerify
        });
        toast.error('Credential not found or invalid');
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      setVerificationError(error.message || 'Failed to verify credential');
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyMyCredential = async () => {
    if (!address) return;

    setIsVerifying(true);
    try {
      // Get user's credential hash first
      const credentialHash = await kycSystemContract.registry.getCredentialOf(address);
      
      if (credentialHash && credentialHash.toString() !== '0') {
        // Get detailed metadata using getMetadata function
        const metadata = await kycSystemContract.registry.getMetadata(credentialHash);
        
        if (metadata && metadata.exists) {
          const credentials = [{
            hash: credentialHash.toString(),
            isValid: true,
            timestamp: parseInt(metadata.updatedAt.toString()),
            level: parseInt(metadata.level.toString()),
            owner: metadata.owner,
            statusBits: metadata.statusBits.toString(),
            verificationMethods: contractUtils.parseStatusBits(metadata.statusBits.toString())
          }];
          
          setVerificationStatus(prev => ({
            ...prev,
            myCredentials: credentials,
            validCredentials: credentials.length
          }));
          
          toast.success(`Found ${credentials.length} credential(s) for your address`);
        } else {
          setVerificationStatus(prev => ({
            ...prev,
            myCredentials: [],
            validCredentials: 0
          }));
          
          toast.warning('Credential hash found but metadata not available');
        }
      } else {
        setVerificationStatus(prev => ({
          ...prev,
          myCredentials: [],
          validCredentials: 0
        }));
        
        toast.info('No credentials found for your address');
      }
    } catch (error: any) {
      console.error('Error checking credentials:', error);
      setVerificationError(error.message || 'Failed to check credentials');
    } finally {
      setIsVerifying(false);
    }
  };

  // Load verification statistics on contract initialization
  useEffect(() => {
    const loadVerificationStats = async () => {
      if (!contractInitialized || !address) return;

      try {
        // This is a simplified version - in a real app you might want to get actual stats
        // from the contract events or a more comprehensive query
        setVerificationStatus(prev => ({
          ...prev,
          totalCredentials: 0, // Could be fetched from contract events
          recentActivity: 0    // Could be calculated from recent events
        }));
      } catch (error) {
        console.error('Error loading verification stats:', error);
      }
    };

    loadVerificationStats();
  }, [contractInitialized, address]);

  if (!address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              Credential Verification
            </CardTitle>
            <CardDescription>
              Connect your wallet to verify credential hashes on-chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please connect your wallet to access credential verification features
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Credential Verification
          </CardTitle>
          <CardDescription>
            Verify stored credential hashes and check KYC status on blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Verification Interface */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* My Credentials */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    My Credentials
                  </CardTitle>
                  <CardDescription>
                    Your stored credential hashes and verification status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationStatus.myCredentials.length > 0 ? (
                    <div className="space-y-3">
                      {verificationStatus.myCredentials.map((cred, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${
                              cred.isValid ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="text-sm font-medium">
                              {cred.isValid ? 'Verified' : 'Invalid'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground break-all">
                            Hash: {cred.hash.slice(0, 20)}...{cred.hash.slice(-10)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level: {contractUtils.getLevelName(cred.level)} ({cred.level})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status Bits: {cred.statusBits}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Methods: {cred.verificationMethods?.join(', ') || 'None'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last Updated: {new Date(cred.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        No credentials found for your address
                      </p>
                      <Button
                        onClick={verifyMyCredential}
                        disabled={isVerifying || !contractInitialized}
                        variant="outline"
                        size="sm"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Checking...
                          </>
                        ) : (
                          'Check My Credentials'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Verification */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Verify Credential
                  </CardTitle>
                  <CardDescription>
                    Enter a credential hash to verify its authenticity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter credential hash (0x...)"
                      value={credentialHashToVerify}
                      onChange={(e) => setCredentialHashToVerify(e.target.value)}
                      className="w-full p-3 border rounded-lg text-sm font-mono"
                    />
                    <Button
                      onClick={handleCredentialVerification}
                      disabled={isVerifying || !credentialHashToVerify.trim() || !contractInitialized}
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Credential'
                      )}
                    </Button>
                  </div>

                  {verificationResult && (
                    <div className={`p-4 rounded-lg border ${
                      verificationResult.isValid 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verificationResult.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          verificationResult.isValid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {verificationResult.isValid ? 'Valid Credential' : 'Invalid Credential'}
                        </span>
                      </div>
                      {verificationResult.isValid && (
                        <div className="space-y-1 text-sm text-green-700">
                          <p><strong>Credential Hash:</strong> {verificationResult.credentialHash?.slice(0, 20)}...{verificationResult.credentialHash?.slice(-10)}</p>
                          <p><strong>Owner:</strong> {verificationResult.owner?.slice(0, 10)}...{verificationResult.owner?.slice(-8)}</p>
                          <p><strong>Level:</strong> {contractUtils.getLevelName(verificationResult.level)} ({verificationResult.level})</p>
                          <p><strong>Status Bits:</strong> {verificationResult.statusBits}</p>
                          <p><strong>Verification Methods:</strong> {verificationResult.verificationMethods?.join(', ') || 'None specified'}</p>
                          <p><strong>Last Updated:</strong> {verificationResult.timestamp ? new Date(verificationResult.timestamp * 1000).toLocaleString() : 'Unknown'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Verification Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Verification Statistics
                </CardTitle>
                <CardDescription>
                  Overview of credential verification activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {verificationStatus.totalCredentials}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Stored
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {verificationStatus.validCredentials}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Valid
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {verificationStatus.myCredentials.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      My Credentials
                    </p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {verificationStatus.recentActivity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recent (24h)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Error Handling */}
            {verificationError && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start gap-3 text-red-600">
                  <XCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Verification Error</p>
                    <p className="text-sm text-red-700 mt-1">{verificationError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setVerificationError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Loading State */}
            {!contractInitialized && address && (
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div>
                    <p className="font-medium">Initializing Smart Contracts</p>
                    <p className="text-sm text-blue-700 mt-1">Please wait while we connect to the blockchain...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CredentialVerification;