import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CertificateGenerator from "@/components/courses/certificate-generator";
import type { Certificate, Course, Quiz } from "@shared/schema";

interface CertificateCardProps {
  certificate: Certificate & { 
    course?: Course; 
    quiz?: Quiz; 
  };
  className?: string;
}

export function CertificateCard({ certificate, className = "" }: CertificateCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default" as const;
    if (score >= 80) return "secondary" as const;
    return "outline" as const;
  };

  return (
    <>
      <Card 
        className={`hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
        onClick={() => setShowDetails(true)}
        data-testid={`card-certificate-${certificate.id}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <EnhancedIcon 
                  name="Award" 
                  size={20} 
                  className="text-amber-600 dark:text-amber-400"
                  aria-hidden={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg leading-tight truncate" data-testid={`text-course-name-${certificate.id}`}>
                  {certificate.courseName}
                </h3>
                <p className="text-sm text-muted-foreground truncate" data-testid={`text-quiz-name-${certificate.id}`}>
                  {certificate.quizName}
                </p>
              </div>
            </div>
            <Badge 
              variant={getScoreBadgeVariant(certificate.score)} 
              className="flex-shrink-0 ml-2"
              data-testid={`badge-score-${certificate.id}`}
            >
              <EnhancedIcon 
                name="Star" 
                size={12} 
                className="mr-1" 
                aria-hidden={true}
              />
              {certificate.score.toFixed(1)}%
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <EnhancedIcon 
                  name="Calendar" 
                  size={14} 
                  aria-hidden={true}
                />
                <span data-testid={`text-completion-date-${certificate.id}`}>
                  Completed {formatDate(certificate.completionDate)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <EnhancedIcon 
                  name="Download" 
                  size={14} 
                  aria-hidden={true}
                />
                <span data-testid={`text-download-count-${certificate.id}`}>
                  {certificate.downloadCount || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {certificate.isValid ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800">
                    <EnhancedIcon 
                      name="CheckCircle" 
                      size={12} 
                      className="mr-1" 
                      aria-hidden={true}
                    />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <EnhancedIcon 
                      name="AlertTriangle" 
                      size={12} 
                      className="mr-1" 
                      aria-hidden={true}
                    />
                    Invalid
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono" data-testid={`text-certificate-number-${certificate.id}`}>
                #{certificate.certificateNumber.slice(-8)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <EnhancedIcon 
                name="Eye" 
                size={14} 
                className="text-muted-foreground" 
                aria-hidden={true}
              />
              <span className="text-sm text-muted-foreground">Click to view details</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" data-testid={`dialog-certificate-details-${certificate.id}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <EnhancedIcon 
                name="Award" 
                size={20} 
                className="text-amber-600"
                aria-hidden={true}
              />
              <span>Certificate Details</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CertificateGenerator
              certificate={certificate}
              showVerificationInfo={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}