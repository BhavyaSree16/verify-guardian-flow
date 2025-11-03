import { useState } from "react";
import { Award, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface NFTData {
  tokenId: string;
  contract: string;
  metadata: {
    ageVerified: boolean;
    nationalityVerified: boolean;
    issueDate: string;
  };
}

interface NFTMinterProps {
  enabled?: boolean;
  onMintComplete?: (nft: NFTData) => void;
}

export const NFTMinter = ({ enabled = false, onMintComplete }: NFTMinterProps) => {
  const [minting, setMinting] = useState(false);
  const [nft, setNft] = useState<NFTData | null>(null);

  const mintNFT = () => {
    setMinting(true);
    // Simulate NFT minting
    setTimeout(() => {
      const mockNFT: NFTData = {
        tokenId: Math.floor(Math.random() * 100000).toString(),
        contract: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        metadata: {
          ageVerified: true,
          nationalityVerified: true,
          issueDate: new Date().toISOString(),
        },
      };
      setNft(mockNFT);
      setMinting(false);
      onMintComplete?.(mockNFT);
      toast({
        title: "NFT Minted",
        description: "Your KYC NFT has been created successfully",
      });
    }, 3500);
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              KYC NFT
            </CardTitle>
            <CardDescription>Mint verification badge</CardDescription>
          </div>
          {nft && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Minted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!nft ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-secondary rounded-lg text-white">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6" />
                <h4 className="font-semibold">Verification Badge NFT</h4>
              </div>
              <p className="text-sm text-white/90">
                Mint a non-fungible token that serves as your permanent KYC verification badge.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                This NFT will contain your verified attributes and can be used across
                multiple platforms as proof of your KYC status.
              </p>
            </div>
            <Button
              onClick={mintNFT}
              disabled={!enabled || minting}
              className="w-full bg-gradient-secondary hover:shadow-glow transition-all duration-300"
            >
              {minting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting NFT...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Mint KYC NFT
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-secondary rounded-lg text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  <h4 className="font-semibold">KYC Verification NFT</h4>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  #{nft.tokenId}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Age Verified: {nft.metadata.ageVerified ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Nationality Verified: {nft.metadata.nationalityVerified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Token ID</p>
              <div className="p-3 bg-muted/30 rounded border border-border font-mono text-sm">
                {nft.tokenId}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Contract Address</p>
              <div className="p-3 bg-muted/30 rounded border border-border font-mono text-xs break-all">
                {nft.contract}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://opensea.io/assets/${nft.contract}/${nft.tokenId}`, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on OpenSea
            </Button>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Issued {new Date(nft.metadata.issueDate).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
