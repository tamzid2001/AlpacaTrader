import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { CertificateCard } from "./certificate-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Certificate, Course, Quiz } from "@shared/schema";

interface CertificatesSectionProps {
  className?: string;
  showHeader?: boolean;
  maxCertificates?: number;
}

export function CertificatesSection({ 
  className = "", 
  showHeader = true, 
  maxCertificates = 4 
}: CertificatesSectionProps) {
  const { user, isAuthenticated } = useAuth();

  // Fetch user certificates
  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ["/api/users", user?.id, "certificates"],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async (): Promise<(Certificate & { course?: Course; quiz?: Quiz })[]> => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/certificates`);
      return response.json();
    }
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="certificates-section-loading">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <EnhancedIcon 
                name="Award" 
                size={24} 
                className="mr-3 text-amber-600"
                aria-hidden={true}
              />
              My Certificates
            </h2>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(Math.min(maxCertificates, 4))].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="certificates-section-error">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <EnhancedIcon 
                name="Award" 
                size={24} 
                className="mr-3 text-amber-600"
                aria-hidden={true}
              />
              My Certificates
            </h2>
          </div>
        )}
        
        <Card className="border-destructive/20">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <EnhancedIcon 
                  name="AlertCircle" 
                  size={24} 
                  className="text-destructive"
                  aria-hidden={true}
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Certificates</h3>
              <p className="text-muted-foreground">
                There was an error loading your certificates. Please try refreshing the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayCertificates = certificates?.slice(0, maxCertificates) || [];
  const totalCertificates = certificates?.length || 0;

  // Empty state
  if (!certificates || totalCertificates === 0) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="certificates-section-empty">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <EnhancedIcon 
                name="Award" 
                size={24} 
                className="mr-3 text-amber-600"
                aria-hidden={true}
              />
              My Certificates
            </h2>
          </div>
        )}
        
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                <EnhancedIcon 
                  name="Award" 
                  size={32} 
                  className="text-amber-600 dark:text-amber-400"
                  aria-hidden={true}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">No Certificates Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Complete courses and pass quizzes to earn certificates. Your achievements will be displayed here.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button asChild data-testid="button-browse-courses">
                  <a href="/courses">
                    <EnhancedIcon 
                      name="BookOpen" 
                      size={16} 
                      className="mr-2"
                      aria-hidden={true}
                    />
                    Browse Courses
                  </a>
                </Button>
                <Button variant="outline" asChild data-testid="button-my-courses">
                  <a href="/my-courses">
                    <EnhancedIcon 
                      name="GraduationCap" 
                      size={16} 
                      className="mr-2"
                      aria-hidden={true}
                    />
                    My Courses
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Certificates display
  return (
    <div className={`space-y-6 ${className}`} data-testid="certificates-section">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center" data-testid="text-certificates-heading">
            <EnhancedIcon 
              name="Award" 
              size={24} 
              className="mr-3 text-amber-600"
              aria-hidden={true}
            />
            My Certificates
            <span className="ml-2 text-lg text-muted-foreground font-normal">
              ({totalCertificates})
            </span>
          </h2>
          {totalCertificates > maxCertificates && (
            <Button variant="outline" asChild data-testid="button-view-all-certificates">
              <a href="/certificates">
                View All ({totalCertificates})
                <EnhancedIcon 
                  name="ArrowRight" 
                  size={16} 
                  className="ml-2"
                  aria-hidden={true}
                />
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6" role="list" aria-label="User certificates">
        {displayCertificates.map((certificate) => (
          <div key={certificate.id} role="listitem">
            <CertificateCard certificate={certificate} />
          </div>
        ))}
      </div>

      {totalCertificates > maxCertificates && !showHeader && (
        <div className="text-center pt-4">
          <Button variant="outline" asChild data-testid="button-view-more-certificates">
            <a href="/certificates">
              View {totalCertificates - maxCertificates} More Certificates
              <EnhancedIcon 
                name="ArrowRight" 
                size={16} 
                className="ml-2"
                aria-hidden={true}
              />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}