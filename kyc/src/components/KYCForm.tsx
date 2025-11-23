import { useState } from "react";
import { CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface KYCFormData {
  age: string;
  nationality: string;
  attributes: string;
}

interface KYCFormProps {
  onVerificationComplete?: (data: KYCFormData) => void;
}

export const KYCForm = ({ onVerificationComplete }: KYCFormProps) => {
  const [formData, setFormData] = useState<KYCFormData>({
    age: "",
    nationality: "",
    attributes: "",
  });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.age || parseInt(formData.age) < 0) {
      toast({
        title: "Invalid Age",
        description: "Please enter a valid age (≥ 0)",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.nationality || formData.nationality.trim().length < 2) {
      toast({
        title: "Invalid Nationality",
        description: "Please enter a valid nationality",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleVerify = () => {
    if (!validateForm()) return;

    setVerifying(true);
    // Simulate verification process
    setTimeout(() => {
      setVerified(true);
      setVerifying(false);
      onVerificationComplete?.(formData);
      toast({
        title: "Verification Successful",
        description: "Your KYC data has been validated",
      });
    }, 2000);
  };

  return (
    <Card className="shadow-card hover:shadow-glow transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              KYC Information
            </CardTitle>
            <CardDescription>Enter your verification details</CardDescription>
          </div>
          {verified && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            disabled={verified}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input
            id="nationality"
            placeholder="Enter your nationality"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            disabled={verified}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attributes">Additional Attributes (Optional)</Label>
          <Input
            id="attributes"
            placeholder="e.g., profession, location"
            value={formData.attributes}
            onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
            disabled={verified}
          />
        </div>
        {!verified ? (
          <Button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            {verifying ? "Verifying..." : "Verify Information"}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">Verification Passed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
