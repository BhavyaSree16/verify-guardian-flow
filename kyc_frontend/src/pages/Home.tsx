import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ConnectWallet, useAddress } from '@thirdweb-dev/react';

const features = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Proofs',
    description: 'Verify your identity without revealing sensitive data',
  },
  {
    icon: Globe,
    title: 'Decentralized Storage',
    description: 'Your data stored securely on IPFS',
  },
  {
    icon: Shield,
    title: 'Blockchain Verified',
    description: 'Immutable verification on the blockchain',
  },
  {
    icon: CheckCircle,
    title: 'NFT Badge',
    description: 'Get a unique NFT representing your verification',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const address = useAddress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Welcome to REGKYC
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Privacy-Preserving Blockchain KYC Verification System
          </p>
          
          {!address ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-muted-foreground">Connect your wallet to get started</p>
              <ConnectWallet
                theme="dark"
                btnTitle="Connect Wallet"
                modalTitle="Select Wallet"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-success font-medium">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/profile')}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  View Profile
                </Button>
                <Button
                  onClick={() => navigate('/kyc')}
                  size="lg"
                  variant="outline"
                >
                  Start KYC Verification
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-glow transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-card p-8 rounded-lg border border-border/50"
        >
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Connect Wallet', 'Complete KYC Form', 'Generate ZK Proof', 'Mint NFT Badge'].map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm font-medium">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
