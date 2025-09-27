import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useUserEnrollments } from "@/hooks/use-courses";
import Sidebar from "@/components/layout/sidebar";
import SupportChat from "@/components/support/support-chat";
import VideoPlayer from "@/components/courses/video-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
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
    ],
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: enrollments } = useUserEnrollments(user?.id || "");

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
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8" data-testid="dashboard-main">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-welcome">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-muted-foreground" data-testid="text-subtitle">
              Continue your learning journey
            </p>
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8" role="region" aria-labelledby="stats-heading">
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
                    {Math.floor(Math.random() * 200) + 50}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-blue-600"></i>
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
                    {enrollments?.filter(e => e.completed).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-award text-amber-600"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Courses */}
        <div className="mb-8" role="region" aria-labelledby="current-courses-heading">
          <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-continue-learning">
            Continue Learning
          </h2>
          <div className="grid md:grid-cols-2 gap-6" role="list">
            {enrollments?.slice(0, 2).map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden" data-testid={`card-enrollment-${enrollment.id}`} role="listitem">
                <img 
                  src={enrollment.course.imageUrl || ""} 
                  alt={enrollment.course.title}
                  className="w-full h-40 object-cover"
                  data-testid={`img-course-${enrollment.id}`}
                />
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
                  <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
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
        <div className="mb-8" role="region" aria-labelledby="latest-content-heading">
          <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-latest-content">
            Latest Course Content
          </h2>
          <VideoPlayer />
        </div>
      </div>
      
      <SupportChat />
    </div>
  );
}
