import React, { useState, useEffect } from 'react';
import { useAddress, useSigner } from "@thirdweb-dev/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { kycSystemContract, contractUtils } from "@/apis/chain_index";
import { Loader2, Plus, Trash2, Eye } from "lucide-react";
import type { ContractBadgeInfo } from "@/apis/chain_index";

interface BadgeCreateForm {
  name: string;
  description: string;
  image: string;
  level: string;
  tier: string;
  priceEth: string;
  maxSupply: string;
}

export const AdminBadgeManager: React.FC = () => {
  const address = useAddress();
  const signer = useSigner();
  
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<ContractBadgeInfo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState<BadgeCreateForm>({
    name: 'KYC Basic Badge',
    description: 'Basic KYC verification completed with essential identity documents',
    image: 'https://via.placeholder.com/200x200/0066CC/FFFFFF?text=KYC+Badge',
    level: 'Basic',
    tier: 'Bronze',
    priceEth: '0.001',
    maxSupply: '1000'
  });

  // Initialize contract and check owner status
  useEffect(() => {
    const initializeContract = async () => {
      if (!signer || !address) return;
      
      try {
        setIsLoading(true);
        await kycSystemContract.initialize(signer);
        
        const ownerStatus = await kycSystemContract.badge.isOwner(address);
        setIsOwner(ownerStatus);
        
        if (ownerStatus) {
          await loadAvailableBadges();
        }
      } catch (error) {
        console.error('Error initializing admin panel:', error);
        toast.error('Failed to initialize admin panel');
      } finally {
        setIsLoading(false);
      }
    };

    initializeContract();
  }, [signer, address]);

  // Load available badges
  const loadAvailableBadges = async () => {
    try {
      const badges = await kycSystemContract.badge.getAllAvailableBadges();
      setAvailableBadges(badges);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof BadgeCreateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create a new badge
  const createBadge = async () => {
    if (!signer || !isOwner) {
      toast.error('Only contract owner can create badges');
      return;
    }

    try {
      setIsCreating(true);
      
      // Validate inputs
      if (!formData.name || !formData.description || !formData.priceEth || !formData.maxSupply) {
        toast.error('Please fill in all required fields');
        return;
      }

      const priceWei = contractUtils.ethToWei(formData.priceEth);
      
      toast.info('Creating badge...');
      
      const tx = await kycSystemContract.badge.createBadge(
        formData.name,
        formData.description,
        formData.image,
        formData.level,
        formData.tier,
        priceWei,
        formData.maxSupply
      );

      toast.success(`Badge created successfully! TX: ${tx.receipt?.transactionHash}`);
      
      // Reload badges list
      await loadAvailableBadges();
      
      // Reset form to next badge template
      setFormData(prev => ({
        ...prev,
        name: prev.tier === 'Bronze' ? 'KYC Verified Badge' : 'KYC Premium Badge',
        tier: prev.tier === 'Bronze' ? 'Silver' : 'Gold',
        level: prev.tier === 'Bronze' ? 'Verified' : 'Premium',
        priceEth: prev.tier === 'Bronze' ? '0.005' : '0.01',
        maxSupply: prev.tier === 'Bronze' ? '500' : '100'
      }));
      
    } catch (error: any) {
      console.error('Error creating badge:', error);
      toast.error(`Failed to create badge: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Quick setup - create default badges
  const createDefaultBadges = async () => {
    if (!signer || !isOwner) {
      toast.error('Only contract owner can create badges');
      return;
    }

    const defaultBadges = [
      {
        name: "KYC Basic Badge",
        description: "Basic KYC verification completed with essential identity documents",
        image: "https://via.placeholder.com/200x200/CD7F32/FFFFFF?text=Basic+KYC",
        level: "Basic",
        tier: "Bronze",
        priceEth: "0.001",
        maxSupply: "1000"
      },
      {
        name: "KYC Verified Badge",
        description: "Advanced KYC verification with enhanced security checks",
        image: "https://via.placeholder.com/200x200/C0C0C0/FFFFFF?text=Verified+KYC",
        level: "Verified", 
        tier: "Silver",
        priceEth: "0.005",
        maxSupply: "500"
      },
      {
        name: "KYC Premium Badge",
        description: "Premium KYC verification with comprehensive identity validation",
        image: "https://via.placeholder.com/200x200/FFD700/FFFFFF?text=Premium+KYC",
        level: "Premium",
        tier: "Gold",
        priceEth: "0.01",
        maxSupply: "100"
      }
    ];

    try {
      setIsCreating(true);
      toast.info('Creating default badge set...');
      
      for (const badge of defaultBadges) {
        const priceWei = contractUtils.ethToWei(badge.priceEth);
        
        await kycSystemContract.badge.createBadge(
          badge.name,
          badge.description,
          badge.image,
          badge.level,
          badge.tier,
          priceWei,
          badge.maxSupply
        );
        
        toast.info(`Created: ${badge.name}`);
      }
      
      toast.success('All default badges created successfully!');
      await loadAvailableBadges();
      
    } catch (error: any) {
      console.error('Error creating default badges:', error);
      toast.error(`Failed to create default badges: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Badge Manager</CardTitle>
          <CardDescription>Connect your wallet to access admin functions</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Admin Panel...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Badge Manager</CardTitle>
          <CardDescription>
            You are not the contract owner. Only the owner can manage badges.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Badge Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Badge
          </CardTitle>
          <CardDescription>
            Create new KYC badges for users to claim
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Badge Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="KYC Basic Badge"
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                id="level" 
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                placeholder="Basic"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description*</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Badge description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Input
                id="tier"
                value={formData.tier}
                onChange={(e) => handleInputChange('tier', e.target.value)}
                placeholder="Bronze"
              />
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceEth">Price (ETH)*</Label>
              <Input
                id="priceEth"
                type="number"
                step="0.001"
                value={formData.priceEth}
                onChange={(e) => handleInputChange('priceEth', e.target.value)}
                placeholder="0.001"
              />
            </div>
            <div>
              <Label htmlFor="maxSupply">Max Supply*</Label>
              <Input
                id="maxSupply"
                type="number"
                value={formData.maxSupply}
                onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={createBadge} 
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Badge
            </Button>
            
            <Button 
              onClick={createDefaultBadges}
              disabled={isCreating}
              variant="outline"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Default Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Available Badges ({availableBadges.length})
          </CardTitle>
          <CardDescription>
            Currently available badges in the contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableBadges.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No badges created yet. Create some badges for users to claim.
            </p>
          ) : (
            <div className="space-y-2">
              {availableBadges.map((badge) => (
                <div 
                  key={badge.tokenId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{badge.metadata.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Token ID: {badge.tokenId} • 
                      Price: {contractUtils.weiToEth(badge.price)} ETH • 
                      Supply: {badge.totalMinted}/{badge.maxSupply}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-white ${
                      badge.metadata.tier === 'Gold' ? 'bg-yellow-500' :
                      badge.metadata.tier === 'Silver' ? 'bg-gray-400' :
                      'bg-orange-600'
                    }`}>
                      {badge.metadata.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBadgeManager;