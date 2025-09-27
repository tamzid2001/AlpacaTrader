import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function SageMakerEULA() {
  const [agreed, setAgreed] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAcceptEULA = async () => {
    if (!agreed) return;
    
    setIsAccepting(true);
    try {
      await apiRequest("POST", "/api/accept-sagemaker-eula", {});
      toast({
        title: "Agreement Accepted",
        description: "You can now use AWS SageMaker AutoML features.",
      });
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept agreement",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">AWS SageMaker End User License Agreement</h1>
        <p className="text-muted-foreground">
          Please review and accept the terms to use AWS SageMaker AutoML features
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Important Legal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-md p-4">
            <div className="space-y-4 text-sm">
              <h3 className="font-bold text-lg">AWS SageMaker AutoML Service Agreement</h3>
              
              <section>
                <h4 className="font-semibold">1. Service Description</h4>
                <p>By using our AWS SageMaker AutoML integration, you acknowledge that:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>We provide automated machine learning model creation using Amazon SageMaker</li>
                  <li>Your data will be processed on AWS infrastructure in accordance with AWS privacy policies</li>
                  <li>We act as a service provider facilitating your use of AWS SageMaker services</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">2. Data Processing and Privacy</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Your uploaded CSV data is transmitted securely to AWS SageMaker for processing</li>
                  <li>AWS SageMaker may temporarily store your data during model training</li>
                  <li>All data processing follows AWS security and privacy standards</li>
                  <li>You retain ownership of your data and resulting models</li>
                  <li>We do not access, view, or store your raw training data beyond processing requirements</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">3. Usage Responsibilities</h4>
                <p>You agree to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Only upload data you have the right to process</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not use the service for illegal, harmful, or unethical purposes</li>
                  <li>Ensure your data does not contain personally identifiable information unless properly authorized</li>
                  <li>Accept responsibility for the accuracy and legality of your data</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">4. Service Limitations</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>AutoML results are provided "as-is" without guarantees of accuracy</li>
                  <li>Service availability depends on AWS SageMaker infrastructure</li>
                  <li>Processing times may vary based on data size and complexity</li>
                  <li>We reserve the right to implement usage limits and fair use policies</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">5. Billing and Payment</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Premium subscribers receive included AutoML credits each month</li>
                  <li>Additional usage is billed at pay-as-you-go rates ($5 per job)</li>
                  <li>Failed jobs may still consume credits due to AWS processing costs</li>
                  <li>Billing is final and non-refundable except as required by law</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">6. Intellectual Property</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>You retain all rights to your input data and generated models</li>
                  <li>We do not claim ownership of your machine learning models or results</li>
                  <li>Our platform and interface remain our intellectual property</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">7. Limitation of Liability</h4>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>We provide the service on an "AS IS" basis</li>
                  <li>We are not liable for data loss, business interruption, or consequential damages</li>
                  <li>Our total liability is limited to the fees paid for the service</li>
                  <li>You use AWS SageMaker AutoML features at your own risk</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">8. Termination</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Either party may terminate access to AutoML features at any time</li>
                  <li>Upon termination, your access to AutoML features will cease</li>
                  <li>Previously generated results remain accessible through your account</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold">9. Changes to Terms</h4>
                <p>We reserve the right to modify these terms with 30 days notice. Continued use constitutes acceptance of updated terms.</p>
              </section>

              <section>
                <h4 className="font-semibold">10. Governing Law</h4>
                <p>These terms are governed by the laws of the jurisdiction where our company is incorporated, without regard to conflict of law principles.</p>
              </section>

              <p className="text-xs text-muted-foreground mt-8">
                Last updated: {new Date().toLocaleDateString()}<br/>
                Contact: support@marketdifferentials.com for questions about this agreement.
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2 mb-6">
        <Checkbox 
          id="agree-eula" 
          checked={agreed} 
          onCheckedChange={(checked) => setAgreed(checked === true)}
          data-testid="checkbox-agree-eula"
        />
        <label htmlFor="agree-eula" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I have read and agree to the AWS SageMaker End User License Agreement
        </label>
      </div>

      <div className="flex gap-4 justify-end">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          data-testid="button-cancel-eula"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAcceptEULA}
          disabled={!agreed || isAccepting}
          className="min-w-32"
          data-testid="button-accept-eula"
        >
          {isAccepting ? "Processing..." : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}