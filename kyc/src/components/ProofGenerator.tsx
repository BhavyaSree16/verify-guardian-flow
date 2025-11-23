import { useState } from "react";
import { Shield, Loader2, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface ProofData {
  hash: string;
  publicSignals: string[];
  timestamp: string;
}

interface ProofGeneratorProps {
  enabled?: boolean;
  onProofGenerated?: (proof: ProofData) => void;
}

export const ProofGenerator = ({ enabled = false, onProofGenerated }: ProofGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [proof, setProof] = useState<ProofData | null>(null);

  const generateProof = () => {
    setGenerating(true);
    // Simulate ZK proof generation
    setTimeout(() => {
      const mockProof: ProofData = {
        hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        publicSignals: [
          "ageVerified:true",
          "nationalityVerified:true",
          "timestamp:" + Date.now(),
        ],
        timestamp: new Date().toISOString(),
      };
      setProof(mockProof);
      setGenerating(false);
      onProofGenerated?.(mockProof);
      toast({
        title: "Proof Generated",
        description: "ZK proof created successfully",
      });
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Proof hash copied to clipboard",
    });
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Zero-Knowledge Proof
            </CardTitle>
            <CardDescription>Generate cryptographic proof</CardDescription>
          </div>
          {proof && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Generated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!proof ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                Zero-knowledge proofs allow verification without revealing private data.
                Your KYC information will remain confidential.
              </p>
            </div>
            <Button
              onClick={generateProof}
              disabled={!enabled || generating}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Proof...
                </>
              ) : (
                "Generate Proof"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Proof Hash</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(proof.hash)}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-3 bg-muted/30 rounded border border-border font-mono text-xs break-all">
                {proof.hash}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Public Signals</p>
              <div className="space-y-1">
                {proof.publicSignals.map((signal, index) => (
                  <div
                    key={index}
                    className="p-2 bg-accent/50 rounded border border-accent text-xs font-mono"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Generated at {new Date(proof.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
