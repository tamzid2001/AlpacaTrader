import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Certificate, QuizAttempt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Award,
  Download,
  Share2,
  Eye,
  CheckCircle,
  Calendar,
  User,
  GraduationCap,
  Star,
  Shield,
  Copy,
  Mail,
  ExternalLink,
  Printer,
  FileText
} from "lucide-react";

interface CertificateGeneratorProps {
  certificate: Certificate;
  onDownload?: (certificateId: string) => void;
  onShare?: (certificateId: string) => void;
  showVerificationInfo?: boolean;
}

interface CertificateTemplateProps {
  certificate: Certificate;
  template?: 'modern' | 'classic' | 'elegant';
}

// Certificate Template Component
function CertificateTemplate({ certificate, template = 'modern' }: CertificateTemplateProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTemplate = () => {
    switch (template) {
      case 'classic':
        return (
          <div className="w-[800px] h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 p-12 relative overflow-hidden print:bg-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-16 h-16 border-8 border-blue-500 rounded-full"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-8 border-blue-500 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-8 border-blue-500 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-8 border-blue-500 rounded-full"></div>
            </div>

            {/* Border */}
            <div className="absolute inset-4 border-4 border-blue-600 rounded-lg"></div>
            <div className="absolute inset-6 border-2 border-blue-400 rounded-lg"></div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <GraduationCap className="h-16 w-16 mx-auto text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Certificate of Achievement</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">This is to certify that</p>
              </div>

              {/* Student Name */}
              <div className="space-y-2">
                <h2 className="text-5xl font-bold text-blue-700 dark:text-blue-300 border-b-2 border-blue-300 pb-2">
                  {certificate.studentName}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">has successfully completed</p>
              </div>

              {/* Course and Quiz Info */}
              <div className="space-y-3">
                <h3 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
                  {certificate.courseName}
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Quiz: {certificate.quizName}
                </p>
                <div className="flex items-center justify-center space-x-6 text-lg">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Score: {certificate.score.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>Completed: {formatDate(certificate.completionDate)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center">
                <div className="text-left">
                  <div className="text-sm text-gray-500">Certificate ID</div>
                  <div className="font-mono text-xs text-gray-400">{certificate.certificateNumber}</div>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto text-blue-600 mb-1" />
                  <div className="text-xs text-gray-500">Verified Authentic</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">MarketDifferentials LMS</div>
                  <div className="text-xs text-gray-400">Learning Management System</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'elegant':
        return (
          <div className="w-[800px] h-[600px] bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950 dark:via-gray-900 dark:to-pink-950 p-12 relative print:bg-white">
            {/* Decorative Elements */}
            <div className="absolute top-8 left-8 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20"></div>
            <div className="absolute bottom-8 right-8 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20"></div>

            {/* Border */}
            <div className="absolute inset-8 border-2 border-purple-300 rounded-2xl"></div>

            <div className="relative z-10 h-full flex flex-col justify-center text-center space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <Award className="h-20 w-20 mx-auto text-purple-600" />
                <h1 className="text-5xl font-light text-gray-800 dark:text-gray-200 tracking-wide">
                  Certificate
                </h1>
                <div className="w-32 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto"></div>
                <p className="text-xl text-gray-600 dark:text-gray-400 italic">of Excellence</p>
              </div>

              {/* Student Name */}
              <div className="space-y-4">
                <p className="text-lg text-gray-600 dark:text-gray-400">Awarded to</p>
                <h2 className="text-6xl font-light text-purple-700 dark:text-purple-300 tracking-wider">
                  {certificate.studentName}
                </h2>
              </div>

              {/* Course Info */}
              <div className="space-y-3">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  for outstanding performance in
                </p>
                <h3 className="text-3xl font-medium text-gray-800 dark:text-gray-200">
                  {certificate.courseName}
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {certificate.quizName}
                </p>
              </div>

              {/* Achievement Details */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 mx-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{certificate.score.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Achievement Score</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(certificate.completionDate)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Date of Completion</div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-8 left-8 right-8 text-center">
                <div className="text-xs text-gray-500 mb-2">
                  Certificate ID: {certificate.certificateNumber} | Verification Code: {certificate.verificationCode}
                </div>
                <div className="text-sm font-medium text-purple-600">MarketDifferentials Learning Management System</div>
              </div>
            </div>
          </div>
        );

      default: // modern
        return (
          <div className="w-[800px] h-[600px] bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-12 relative print:bg-white">
            {/* Modern geometric background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full opacity-30"></div>
              <div className="absolute top-16 right-8 w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30"></div>
              <div className="absolute bottom-8 left-16 w-40 h-40 bg-teal-200 dark:bg-teal-800 rounded-full opacity-20"></div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-green-300 dark:bg-green-700 rounded-full opacity-20"></div>
            </div>

            {/* Header accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400"></div>

            <div className="relative z-10 h-full flex flex-col justify-center space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Achievement Unlocked</h1>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-400">This certificate confirms that</p>
              </div>

              {/* Student Name - Modern styling */}
              <div className="text-center">
                <h2 className="text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  {certificate.studentName}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">has successfully mastered</p>
              </div>

              {/* Course Information */}
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-8 mx-4 shadow-lg">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    {certificate.courseName}
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    Assessment: {certificate.quizName}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-8 mt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{certificate.score.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {formatDate(certificate.completionDate)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completion Date</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with verification */}
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">MarketDifferentials</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Learning Management System</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center space-x-1 text-green-600 mb-1">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium">Blockchain Verified</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    #{certificate.certificateNumber}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">Verification Code</div>
                  <div className="text-xs font-mono text-gray-600">{certificate.verificationCode}</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div id="certificate-template" className="certificate-template">
      {getTemplate()}
    </div>
  );
}

export default function CertificateGenerator({ 
  certificate, 
  onDownload, 
  onShare, 
  showVerificationInfo = true 
}: CertificateGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'elegant'>('modern');
  const [showPreview, setShowPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const certificateRef = useRef<HTMLDivElement>(null);

  // Generate PDF certificate
  const generatePDF = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);

      // Download PDF
      pdf.save(`certificate-${certificate.certificateNumber}.pdf`);
      
      onDownload?.(certificate.id);
      
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate shareable link
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const verifyUrl = `${baseUrl}/verify-certificate/${certificate.verificationCode}`;
    setShareUrl(verifyUrl);
    
    navigator.clipboard.writeText(verifyUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Certificate verification link copied to clipboard."
      });
    });
    
    onShare?.(certificate.id);
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = `Certificate of Achievement - ${certificate.courseName}`;
    const body = `I'm excited to share my certificate of achievement!\n\nCourse: ${certificate.courseName}\nQuiz: ${certificate.quizName}\nScore: ${certificate.score.toFixed(1)}%\nCompleted: ${new Date(certificate.completionDate).toLocaleDateString()}\n\nVerify this certificate: ${shareUrl || `${window.location.origin}/verify-certificate/${certificate.verificationCode}`}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Print certificate
  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Certificate of Achievement
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="secondary">
                Score: {certificate.score.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="template-select">Template:</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value: 'modern' | 'classic' | 'elegant') => setSelectedTemplate(value)}
            >
              <SelectTrigger className="w-48" data-testid="select-certificate-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="elegant">Elegant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certificate Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex justify-center">
              <div ref={certificateRef} className="transform scale-75 origin-top">
                <CertificateTemplate certificate={certificate} template={selectedTemplate} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              data-testid="button-download-certificate"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              data-testid="button-preview-certificate"
            >
              <Eye className="h-4 w-4 mr-2" />
              Full Preview
            </Button>

            <Button
              variant="outline"
              onClick={printCertificate}
              data-testid="button-print-certificate"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={generateShareLink}
              data-testid="button-share-certificate"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Share Options */}
          {shareUrl && (
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Shareable Verification Link:
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="bg-white dark:bg-gray-800"
                      data-testid="input-share-url"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      data-testid="button-copy-share-url"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={shareViaEmail}
                      data-testid="button-share-email"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(shareUrl, '_blank')}
                      data-testid="button-view-verification"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Verification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Certificate Information */}
      {showVerificationInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Certificate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Student Name</Label>
                <div className="font-medium">{certificate.studentName}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Course</Label>
                <div className="font-medium">{certificate.courseName}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Quiz</Label>
                <div className="font-medium">{certificate.quizName}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Score</Label>
                <div className="font-medium">{certificate.score.toFixed(1)}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Completion Date</Label>
                <div className="font-medium">
                  {new Date(certificate.completionDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Certificate ID</Label>
                <div className="font-mono text-xs">{certificate.certificateNumber}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Verification Code</Label>
                <div className="font-mono text-xs">{certificate.verificationCode}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Issue Date</Label>
                <div className="font-medium">
                  {new Date(certificate.issuedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid="dialog-certificate-preview">
          <DialogHeader>
            <DialogTitle>Certificate Preview - {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <CertificateTemplate certificate={certificate} template={selectedTemplate} />
          </div>
          <div className="flex justify-center space-x-4 pt-4">
            <Button onClick={generatePDF} disabled={isGenerating}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={printCertificate}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}