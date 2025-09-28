import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Certificate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CertificateGenerator from "./certificate-generator";
import { 
  Shield,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  AlertCircle,
  Award,
  Calendar,
  User,
  GraduationCap,
  Star,
  ExternalLink
} from "lucide-react";

interface CertificateViewerProps {
  verificationCode?: string;
  onVerificationComplete?: (certificate: Certificate | null) => void;
}

export default function CertificateViewer({ 
  verificationCode: initialCode, 
  onVerificationComplete 
}: CertificateViewerProps) {
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState(initialCode || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(!!initialCode);

  // Verify certificate query
  const { data: certificate, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/certificates/verify", verificationCode],
    enabled: searchTriggered && !!verificationCode,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/certificates/verify/${verificationCode}`);
      return response.json();
    },
    retry: false
  });

  // Handle search
  const handleSearch = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Verification Code Required",
        description: "Please enter a verification code to search.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchTriggered(true);
    
    try {
      await refetch();
      onVerificationComplete?.(certificate || null);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold">Certificate Verification</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Verify the authenticity of MarketDifferentials certificates
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Certificate Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">
                Verification Code
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter verification code (e.g., ABC123DEF456)"
                  className="flex-1 font-mono"
                  data-testid="input-verification-code"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || isSearching || !verificationCode.trim()}
                  data-testid="button-verify-certificate"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading || isSearching ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>
                Enter the verification code found on the certificate to verify its authenticity.
                Verification codes are case-insensitive and typically 8-16 characters long.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg">Verifying certificate...</p>
                <p className="text-sm text-muted-foreground">
                  Checking against our secure database
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {searchTriggered && error && !isLoading && (
          <Card className="border-red-500">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <XCircle className="h-16 w-16 mx-auto text-red-600" />
                <h3 className="text-2xl font-bold text-red-600">Certificate Not Found</h3>
                <div className="space-y-2">
                  <p className="text-lg">
                    No certificate found with verification code: <span className="font-mono font-bold">{verificationCode}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Please check the verification code and try again. The certificate may have been:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
                    <li>• Entered incorrectly (check for typos)</li>
                    <li>• Revoked or expired</li>
                    <li>• Issued by a different institution</li>
                    <li>• Not yet issued (if recently completed)</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationCode('');
                    setSearchTriggered(false);
                  }}
                  data-testid="button-clear-search"
                >
                  Try Another Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State - Certificate Found */}
        {certificate && !isLoading && (
          <div className="space-y-6">
            {/* Verification Success Header */}
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                  <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">
                    ✅ Certificate Verified
                  </h2>
                  <p className="text-lg text-green-600 dark:text-green-400">
                    This certificate is authentic and has been verified against our secure database.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Blockchain Verified
                    </Badge>
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Digitally Signed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Certificate Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Student Information</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Student Name</Label>
                        <div className="text-xl font-bold">{certificate.studentName}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Course Completed</Label>
                        <div className="text-lg font-semibold text-blue-600">
                          {certificate.courseName}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Assessment</Label>
                        <div className="font-medium">{certificate.quizName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Achievement Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <GraduationCap className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Achievement Details</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <Label className="text-sm text-muted-foreground">Final Score</Label>
                          <div className="text-2xl font-bold text-green-600">
                            {certificate.score.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <div>
                          <Label className="text-sm text-muted-foreground">Completion Date</Label>
                          <div className="font-medium">
                            {formatDate(certificate.completionDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-muted-foreground">Issued Date</Label>
                        <div className="font-medium">
                          {formatDate(certificate.issuedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Verification Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Verification Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-muted-foreground">Certificate ID</Label>
                      <div className="font-mono font-medium break-all">
                        {certificate.certificateNumber}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-muted-foreground">Verification Code</Label>
                      <div className="font-mono font-medium">
                        {certificate.verificationCode}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-muted-foreground">Digital Signature</Label>
                      <div className="font-mono text-xs break-all">
                        {certificate.digitalSignature}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                          About Certificate Verification
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                          This certificate has been cryptographically verified against our secure database. 
                          The verification confirms the authenticity of the achievement and ensures it was 
                          issued by MarketDifferentials Learning Management System.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  View & Download Certificate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CertificateGenerator 
                  certificate={certificate}
                  showVerificationInfo={false}
                />
              </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationCode('');
                    setSearchTriggered(false);
                  }}
                  data-testid="button-verify-another"
                >
                  Verify Another Certificate
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('/', '_blank')}
                  data-testid="button-visit-lms"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit MarketDifferentials LMS
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Have questions about this certificate? Contact our{' '}
                <a href="/support" className="text-blue-600 hover:underline">
                  support team
                </a>{' '}
                for assistance.
              </p>
            </div>
          </div>
        )}

        {/* Initial State - No search yet */}
        {!searchTriggered && !initialCode && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-2xl font-bold">Verify a Certificate</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Enter a verification code above to check the authenticity of a 
                    MarketDifferentials certificate.
                  </p>
                  <p className="text-sm">
                    Our verification system uses blockchain technology and digital signatures 
                    to ensure certificate authenticity and prevent fraud.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-8">
                  <div className="p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <h4 className="font-semibold mb-1">Instant Verification</h4>
                    <p className="text-muted-foreground">
                      Get immediate results from our secure database
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <Shield className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h4 className="font-semibold mb-1">Blockchain Secured</h4>
                    <p className="text-muted-foreground">
                      Certificates are secured with blockchain technology
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <Award className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <h4 className="font-semibold mb-1">Tamper Proof</h4>
                    <p className="text-muted-foreground">
                      Digital signatures prevent forgery and tampering
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}