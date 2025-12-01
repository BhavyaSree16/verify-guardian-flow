import { useNavigate } from 'react-router-dom';
import { useAddress } from '@thirdweb-dev/react';
import { User, Edit, Shield, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const address = useAddress();

  // Mock data - in production, fetch from contract or local storage
  const kycData = {
    verified: true,
    age: 25,
    nationality: 'United States',
    ipfsHash: 'QmXyZ123...abc789',
    verificationDate: '2024-01-15',
    nftTokenId: '#1234',
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
              <p className="text-muted-foreground">Manage your KYC verification details</p>
            </div>
            <Button
              onClick={() => navigate('/kyc')}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Edit className="mr-2 h-4 w-4" />
              Update KYC
            </Button>
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
                  <p className="font-medium">Polygon Mumbai Testnet</p>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <p className="font-medium">KYC Status</p>
                  {kycData.verified ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KYC Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Badge</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="h-32 w-32 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-16 w-16 text-white" />
                </div>
                <p className="font-medium mb-2">KYC Verified</p>
                <p className="text-xs text-muted-foreground">NFT Token {kycData.nftTokenId}</p>
              </CardContent>
            </Card>

            {/* KYC Details */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  KYC Details
                </CardTitle>
                <CardDescription>Your verified information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Age Verification</p>
                    <p className="font-medium">{kycData.age}+ years old</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nationality</p>
                    <p className="font-medium">{kycData.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Verification Date</p>
                    <p className="font-medium">{new Date(kycData.verificationDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">NFT Token ID</p>
                    <p className="font-medium">{kycData.nftTokenId}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">IPFS Storage Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-muted rounded-md text-xs font-mono flex-1 break-all">
                      {kycData.ipfsHash}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://ipfs.io/ipfs/${kycData.ipfsHash}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
