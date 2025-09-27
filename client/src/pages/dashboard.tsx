import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useUserEnrollments } from "@/hooks/use-courses";
import VideoPlayer from "@/components/courses/video-player";
import SupportChat from "@/components/support/support-chat";
import { CertificatesSection } from "@/components/dashboard/certificates-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Certificate } from "@shared/schema";

// Premium Components
import { PremiumDashboard } from "@/components/premium/premium-dashboard";
import { PremiumBadge } from "@/components/premium/premium-badge";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: enrollments } = useUserEnrollments(user?.id || "");

  // Fetch user certificates for real certificate count
  const { data: certificates } = useQuery({
    queryKey: ["/api/users", user?.id, "certificates"],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async (): Promise<Certificate[]> => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/certificates`);
      return response.json();
    }
  });

  // Fetch real learning statistics from new API endpoint
  const { data: learningStats } = useQuery({
    queryKey: ["/api/users", user?.id, "learning-stats"],
    enabled: isAuthenticated && !!user?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/learning-stats`);
      return response.json();
    }
  });

  // Calculate real learning hours from actual watch time data
  const calculateLearningHours = () => {
    if (learningStats?.totalLearningHours !== undefined) {
      // Use real data from the new API endpoint
      return learningStats.totalLearningHours;
    }
    
    // Fallback: Use real time spent from enrollment data if available
    if (!enrollments) return 0;
    return enrollments.reduce((total, enrollment) => {
      // Use actual time spent from user progress records (in seconds)
      const realTimeSpentSeconds = enrollment.totalTimeSpent || 0;
      return total + (realTimeSpentSeconds / 3600); // Convert seconds to hours
    }, 0);
  };

  // Keyboard shortcuts for dashboard
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'c',
        altKey: true,
        action: () => {
          const coursesSection = document.querySelector('[aria-labelledby="current-courses-heading"]');
          coursesSection?.scrollIntoView({ behavior: 'smooth' });
        },
        description: 'Jump to current courses section',
      },
      {
        key: 's',
        altKey: true,
        action: () => {
          const statsSection = document.querySelector('[aria-labelledby="stats-heading"]');
          statsSection?.scrollIntoView({ behavior: 'smooth' });
        },
        description: 'Jump to statistics section',
      },
      {
        key: 'r',
        altKey: true,
        action: () => {
          const certificatesSection = document.querySelector('[data-testid="certificates-section"]');
          certificatesSection?.scrollIntoView({ behavior: 'smooth' });
        },
        description: 'Jump to certificates section',
      },
    ],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your account is currently pending approval from our admin team. 
              You'll receive access to the platform once approved.
            </p>
            <a href="/">
              <Button variant="outline">Return to Home</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8" data-testid="dashboard-main">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-welcome">
            Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Student'}!
          </h1>
          <div className="flex items-center space-x-3">
            <p className="text-muted-foreground" data-testid="text-subtitle">
              Continue your learning journey
            </p>
            {user?.isPremiumApproved && (
              <PremiumBadge tier={user.premiumTier} size="sm" />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            data-testid="button-notifications"
            aria-label="View notifications"
          >
            <EnhancedIcon 
              name="Bell" 
              size={16} 
              className="text-muted-foreground" 
              aria-hidden={true}
            />
          </Button>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center" data-testid="avatar-user">
            <span className="text-primary-foreground font-semibold">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="dashboard-tabs">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <EnhancedIcon name="LayoutDashboard" size={16} className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="premium" 
            data-testid="tab-premium"
            className={user?.isPremiumApproved ? "" : "text-amber-600 dark:text-amber-400"}
          >
            <EnhancedIcon name="Crown" size={16} className="mr-2" />
            Premium
            {!user?.isPremiumApproved && (
              <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses" data-testid="tab-courses">
            <EnhancedIcon name="BookOpen" size={16} className="mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="certificates" data-testid="tab-certificates">
            <EnhancedIcon name="Award" size={16} className="mr-2" />
            Certificates
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6 md:space-y-8" data-testid="tab-content-overview">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" role="region" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Learning Statistics</h2>
          <Card data-testid="card-enrolled" role="article" aria-labelledby="enrolled-heading">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm" id="enrolled-heading">Courses Enrolled</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-enrolled-count">
                    {enrollments?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <EnhancedIcon 
                    name="BookOpen" 
                    size={20} 
                    color="hsl(var(--primary))" 
                    aria-hidden={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-completed" role="article" aria-labelledby="completed-heading">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm" id="completed-heading">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-completed-count">
                    {enrollments?.filter(e => e.completed).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <EnhancedIcon 
                    name="Check" 
                    size={20} 
                    color="rgb(5 150 105)" 
                    aria-hidden={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-hours" role="article" aria-labelledby="hours-heading">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm" id="hours-heading">Learning Hours</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-hours">
                    {Math.round(calculateLearningHours())}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <EnhancedIcon 
                    name="Clock" 
                    size={20} 
                    color="rgb(37 99 235)" 
                    aria-hidden={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-certificates" role="article" aria-labelledby="certificates-heading">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm" id="certificates-heading">Certificates</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-certificates">
                    {certificates?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <EnhancedIcon 
                    name="Award" 
                    size={20} 
                    color="rgb(217 119 6)" 
                    aria-hidden={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Certificates Section */}
      <CertificatesSection className="mt-8" maxCertificates={4} />

      {/* Current Courses */}
      <div role="region" aria-labelledby="current-courses-heading">
          <h2 id="current-courses-heading" className="text-2xl font-bold text-foreground mb-6" data-testid="text-continue-learning">
            Continue Learning
          </h2>
          <div className="grid md:grid-cols-2 gap-6" role="list">
            {enrollments?.slice(0, 2).map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden" data-testid={`card-enrollment-${enrollment.id}`} role="listitem">
                {enrollment.course.imageUrl ? (
                  <img 
                    src={enrollment.course.imageUrl} 
                    alt={enrollment.course.title}
                    className="w-full h-40 object-cover"
                    data-testid={`img-course-${enrollment.id}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ${enrollment.course.imageUrl ? 'hidden' : ''}`}
                  data-testid={`placeholder-course-${enrollment.id}`}
                >
                  <EnhancedIcon 
                    name="BookOpen" 
                    size={48} 
                    className="text-primary/40" 
                    aria-hidden={true}
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2" data-testid={`text-course-title-${enrollment.id}`}>
                    {enrollment.course.title}
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid={`text-course-module-${enrollment.id}`}>
                    Current Progress
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <Progress value={enrollment.progress || 0} className="flex-1 mr-4" data-testid={`progress-${enrollment.id}`} />
                    <span className="text-sm text-muted-foreground" data-testid={`text-progress-${enrollment.id}`}>
                      {enrollment.progress || 0}%
                    </span>
                  </div>
                  <Button className="w-full hover:bg-primary/90" data-testid={`button-continue-${enrollment.id}`}>
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {(!enrollments || enrollments.length === 0) && (
              <Card className="md:col-span-2" data-testid="card-no-enrollments" role="listitem">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <EnhancedIcon 
                      name="GraduationCap" 
                      size={32} 
                      className="text-muted-foreground" 
                      aria-hidden={true}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No courses enrolled yet</h3>
                  <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course</p>
                  <Button onClick={() => setLocation("/")} data-testid="button-browse-courses">
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
      </div>

          {/* Video Course Section */}
          <div role="region" aria-labelledby="latest-content-heading">
              <h2 id="latest-content-heading" className="text-2xl font-bold text-foreground mb-6" data-testid="text-latest-content">
                Latest Course Content
              </h2>
              <VideoPlayer />
          </div>
        </TabsContent>

        {/* Premium Tab Content */}
        <TabsContent value="premium" className="space-y-6 md:space-y-8" data-testid="tab-content-premium">
          <PremiumDashboard 
            user={user}
            isPremium={!!user?.isPremiumApproved}
            premiumTier={user?.premiumTier}
          />
        </TabsContent>

        {/* Courses Tab Content */}
        <TabsContent value="courses" className="space-y-6 md:space-y-8" data-testid="tab-content-courses">
          <div role="region" aria-labelledby="courses-tab-heading">
            <h2 id="courses-tab-heading" className="text-2xl font-bold text-foreground mb-6">
              My Courses
            </h2>
            
            {/* Current Courses Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
              {enrollments?.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden" data-testid={`card-enrollment-${enrollment.id}`} role="listitem">
                  {enrollment.course.imageUrl ? (
                    <img 
                      src={enrollment.course.imageUrl} 
                      alt={enrollment.course.title}
                      className="w-full h-40 object-cover"
                      data-testid={`img-course-${enrollment.id}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ${enrollment.course.imageUrl ? 'hidden' : ''}`}
                    data-testid={`placeholder-course-${enrollment.id}`}
                  >
                    <EnhancedIcon 
                      name="BookOpen" 
                      size={48} 
                      className="text-primary/40" 
                      aria-hidden={true}
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2" data-testid={`text-course-title-${enrollment.id}`}>
                      {enrollment.course.title}
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid={`text-course-description-${enrollment.id}`}>
                      {enrollment.course.description || 'Course description'}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <Progress value={enrollment.progress || 0} className="flex-1 mr-4" data-testid={`progress-${enrollment.id}`} />
                      <span className="text-sm text-muted-foreground" data-testid={`text-progress-${enrollment.id}`}>
                        {enrollment.progress || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button className="flex-1 mr-2" data-testid={`button-continue-${enrollment.id}`}>
                        Continue Learning
                      </Button>
                      {enrollment.completed && (
                        <Badge variant="secondary">
                          <EnhancedIcon name="Check" size={12} className="mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!enrollments || enrollments.length === 0) && (
                <Card className="md:col-span-3 lg:col-span-3" data-testid="card-no-courses" role="listitem">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                      <EnhancedIcon 
                        name="BookOpen" 
                        size={32} 
                        className="text-muted-foreground" 
                        aria-hidden={true}
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-4">Start learning by enrolling in your first course</p>
                    <Button onClick={() => setLocation("/courses")} data-testid="button-browse-courses-tab">
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Certificates Tab Content */}
        <TabsContent value="certificates" className="space-y-6 md:space-y-8" data-testid="tab-content-certificates">
          <CertificatesSection className="mt-0" maxCertificates={12} />
        </TabsContent>
      </Tabs>
      
      <SupportChat />
    </div>
  );
}
