import { useState } from "react";
import { Send, Loader2, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface TransactionData {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
}

interface BlockchainSubmitProps {
  enabled?: boolean;
  onSubmitComplete?: (tx: TransactionData) => void;
}

export const BlockchainSubmit = ({ enabled = false, onSubmitComplete }: BlockchainSubmitProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [kycStatus, setKycStatus] = useState<"verified" | "not-verified" | null>(null);
  const [checking, setChecking] = useState(false);

  const submitProof = () => {
    setSubmitting(true);
    // Simulate blockchain transaction
    setTimeout(() => {
      const tx: TransactionData = {
        hash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        status: "confirmed",
        timestamp: new Date().toISOString(),
      };
      setTransaction(tx);
      setSubmitting(false);
      onSubmitComplete?.(tx);
      toast({
        title: "Proof Submitted",
        description: "Transaction confirmed on blockchain",
      });
    }, 4000);
  };

  const checkKYCStatus = () => {
    setChecking(true);
    setTimeout(() => {
      setKycStatus(Math.random() > 0.3 ? "verified" : "not-verified");
      setChecking(false);
      toast({
        title: "Status Retrieved",
        description: "KYC verification status updated",
      });
    }, 2000);
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Blockchain Submission
            </CardTitle>
            <CardDescription>Submit proof on-chain</CardDescription>
          </div>
          {transaction && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!transaction ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                Submit your proof to the smart contract. This creates an immutable
                record of your KYC verification on the blockchain.
              </p>
            </div>
            <Button
              onClick={submitProof}
              disabled={!enabled || submitting}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting to Blockchain...
                </>
              ) : (
                "Submit Proof On-Chain"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Transaction Hash</p>
              <div className="p-3 bg-muted/30 rounded border border-border font-mono text-xs break-all">
                {transaction.hash}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  transaction.status === "confirmed"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }
              >
                {transaction.status === "confirmed" ? "Confirmed" : "Pending"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </Button>
            <div className="pt-4 border-t border-border space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={checkKYCStatus}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Check KYC Status
                  </>
                )}
              </Button>
              {kycStatus && (
                <div
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                    kycStatus === "verified"
                      ? "bg-success/10 border-success/20"
                      : "bg-warning/10 border-warning/20"
                  }`}
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${kycStatus === "verified" ? "text-success" : "text-warning"}`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      kycStatus === "verified" ? "text-success" : "text-warning"
                    }`}
                  >
                    {kycStatus === "verified" ? "KYC Verified" : "KYC Not Verified"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
