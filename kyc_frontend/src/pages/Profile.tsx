import { useNavigate } from 'react-router-dom';
import { useAddress, useSigner } from '@thirdweb-dev/react';
import { User, Edit, Shield, CheckCircle, XCircle, ExternalLink, Hash, Award, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { kycSystemContract, contractUtils, type KYCStatus, type ContractBadgeInfo } from '@/apis/chain_index';

const Profile = () => {
  const navigate = useNavigate();
  const address = useAddress();
  const signer = useSigner();
  
  // KYC Data State
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [userBadges, setUserBadges] = useState<ContractBadgeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contractStats, setContractStats] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize contracts and fetch data
  useEffect(() => {
    const initializeAndFetch = async () => {
      if (!signer || !address) return;
      
      try {
        setIsLoading(true);
        await kycSystemContract.initialize(signer);
        await fetchKYCData();
      } catch (error) {
        console.error('Error initializing contracts:', error);
        toast.error('Failed to load KYC data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndFetch();
  }, [signer, address]);

  // Fetch KYC data from contracts
  const fetchKYCData = async () => {
    if (!address) return;
    
    try {
      // Get KYC Registry status
      const status = await kycSystemContract.registry.getKYCStatus(address);
      setKycStatus(status);
      
      // Get user's owned badges
      const badges = await kycSystemContract.badge.getUserOwnedBadges(address);
      setUserBadges(badges);
      
      // Get contract statistics
      const stats = await kycSystemContract.badge.getContractStats();
      setContractStats(stats);
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      toast.error('Failed to fetch KYC data');
    }
  };

  // Refresh data manually
  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchKYCData();
    setIsLoading(false);
    toast.success('Profile data refreshed!');
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile</h1>
              <p className="text-muted-foreground">Your KYC verification details and NFT badges</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastRefresh.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => navigate('/kyc')}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Edit className="mr-2 h-4 w-4" />
                Update KYC
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-muted rounded-md text-sm font-mono flex-1">
                      {address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(address)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Network</p>
                  <p className="font-medium">Sepolia Testnet</p>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <p className="font-medium">KYC Registry Status</p>
                  {kycStatus?.hasCredential ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified (Level {kycStatus.metadata?.level})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>

                {kycStatus?.hasCredential && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Credential Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 bg-muted rounded-md text-xs font-mono flex-1 break-all">
                        {kycStatus.credentialHash}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => kycStatus.credentialHash && navigator.clipboard.writeText(kycStatus.credentialHash)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">NFT Badges Owned</p>
                  <p className="font-medium">{userBadges.length} Badge{userBadges.length !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>

            {/* KYC Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Your current KYC level and badges</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {kycStatus?.hasCredential ? (
                  <>
                    <div className="h-32 w-32 rounded-full flex items-center justify-center mx-auto mb-4"
                         style={{ backgroundColor: contractUtils.getLevelColor(kycStatus.metadata?.level || 0) }}>
                      <Shield className="h-16 w-16 text-white" />
                    </div>
                    <p className="font-medium mb-2">
                      {contractUtils.getLevelName(kycStatus.metadata?.level || 0)} KYC
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Level {kycStatus.metadata?.level} • {userBadges.length} NFT Badge{userBadges.length !== 1 ? 's' : ''}
                    </p>
                    {kycStatus.metadata?.updatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Verified: {contractUtils.formatTimestamp(kycStatus.metadata.updatedAt)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-2 text-muted-foreground">Not Verified</p>
                    <p className="text-xs text-muted-foreground">Complete KYC to get verified</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* KYC Registry Details */}
            {kycStatus?.hasCredential && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    KYC Registry Details
                  </CardTitle>
                  <CardDescription>Your verified credential information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Verification Level</p>
                      <p className="font-medium">{contractUtils.getLevelName(kycStatus.metadata?.level || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Level Number</p>
                      <p className="font-medium">Level {kycStatus.metadata?.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                      <p className="font-medium">
                        {kycStatus.metadata?.updatedAt ? contractUtils.formatTimestamp(kycStatus.metadata.updatedAt) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Owner Address</p>
                      <p className="font-medium text-xs font-mono">{kycStatus.metadata?.owner}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Verification Methods</p>
                    <div className="flex flex-wrap gap-2">
                      {contractUtils.parseStatusBits(kycStatus.metadata?.statusBits || '0').map((method, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Credential Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 bg-muted rounded-md text-xs font-mono flex-1 break-all">
                        {kycStatus.credentialHash}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => kycStatus.credentialHash && navigator.clipboard.writeText(kycStatus.credentialHash)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NFT Badges Collection */}
            <Card className={kycStatus?.hasCredential ? "lg:col-span-1" : "lg:col-span-3"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  NFT Badge Collection
                </CardTitle>
                <CardDescription>
                  Your owned KYC badges ({userBadges.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="space-y-3">
                    {userBadges.map((badge) => (
                      <div key={badge.tokenId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: contractUtils.getLevelColor(parseInt(badge.metadata.level) || 0) }}
                          >
                            #{badge.tokenId}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{badge.metadata.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.metadata.tier} • {badge.metadata.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            Owned
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Price: {contractUtils.weiToEth(badge.price)} ETH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No NFT badges owned yet</p>
                    <p className="text-sm text-muted-foreground">Complete KYC verification to earn your first badge</p>
                    {!kycStatus?.hasCredential && (
                      <Button 
                        onClick={() => navigate('/kyc')} 
                        className="mt-4"
                        size="sm"
                      >
                        Start KYC Process
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Information */}
            {contractStats && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Contract Information
                  </CardTitle>
                  <CardDescription>KYC Badge contract statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{contractStats.nextTokenId - 1}</p>
                      <p className="text-sm text-muted-foreground">Available Badges</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{contractStats.totalMintedGlobal}</p>
                      <p className="text-sm text-muted-foreground">Total Minted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{contractStats.maxTotalSupply || '∞'}</p>
                      <p className="text-sm text-muted-foreground">Max Supply</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{userBadges.length}</p>
                      <p className="text-sm text-muted-foreground">Your Badges</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Badge Contract:</span>
                      <code className="text-xs font-mono">{contractUtils.CONTRACT_ADDRESS}</code>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Registry Contract:</span>
                      <code className="text-xs font-mono">{contractUtils.KYC_REGISTRY_CONTRACT_ADDRESS}</code>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Chain ID:</span>
                      <span className="font-mono">{contractUtils.CHAIN_ID}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
