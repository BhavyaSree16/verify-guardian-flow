import { useState } from "react";
import { Upload, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface IPFSData {
  cid: string;
  url: string;
  timestamp: string;
}

interface IPFSUploaderProps {
  enabled?: boolean;
  onUploadComplete?: (data: IPFSData) => void;
}

export const IPFSUploader = ({ enabled = false, onUploadComplete }: IPFSUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ipfsData, setIpfsData] = useState<IPFSData | null>(null);

  const uploadToIPFS = () => {
    setUploading(true);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(() => {
      const mockCID = "Qm" + Array.from({ length: 44 }, () => 
        "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
      ).join("");
      
      const data: IPFSData = {
        cid: mockCID,
        url: `https://ipfs.io/ipfs/${mockCID}`,
        timestamp: new Date().toISOString(),
      };

      setIpfsData(data);
      setUploading(false);
      onUploadComplete?.(data);
      toast({
        title: "Upload Complete",
        description: "KYC data uploaded to IPFS",
      });
    }, 3500);
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              IPFS Storage
            </CardTitle>
            <CardDescription>Decentralized data storage</CardDescription>
          </div>
          {ipfsData && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Uploaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!ipfsData ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                Your KYC proof will be stored on IPFS, ensuring decentralized and
                permanent availability of your verification data.
              </p>
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <Button
              onClick={uploadToIPFS}
              disabled={!enabled || uploading}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to IPFS...
                </>
              ) : (
                "Upload to IPFS"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">IPFS CID</p>
              <div className="p-3 bg-muted/30 rounded border border-border font-mono text-xs break-all">
                {ipfsData.cid}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(ipfsData.url, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on IPFS
            </Button>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Uploaded at {new Date(ipfsData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
