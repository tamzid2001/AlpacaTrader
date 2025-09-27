import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { PremiumBadge } from "./premium-badge";
import { PremiumAnalytics } from "./premium-analytics";
import { PremiumRequestForm } from "./premium-request-form";
import type { User, CourseEnrollment, Course } from "@shared/schema";

interface PremiumDashboardProps {
  user: User;
  isPremium: boolean;
  premiumTier?: string | null;
}

export function PremiumDashboard({ user, isPremium, premiumTier }: PremiumDashboardProps) {
  // Fetch premium analytics data
  const { data: premiumAnalytics } = useQuery({
    queryKey: ["/api/premium/analytics", user.id],
    enabled: isPremium,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/premium/analytics`);
      return response.json();
    }
  });

  // Fetch career insights
  const { data: careerInsights } = useQuery({
    queryKey: ["/api/premium/career-insights", user.id],
    enabled: isPremium,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/premium/career-insights`);
      return response.json();
    }
  });

  if (!isPremium) {
    return (
      <div className="space-y-6" data-testid="premium-upgrade-section">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnhancedIcon name="Crown" size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-premium-title">
            Unlock Premium Learning Experience
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get access to advanced analytics, career development tools, personalized mentorship, 
            and exclusive premium content to accelerate your learning journey.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="text-left">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <EnhancedIcon name="BarChart3" size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Advanced Analytics</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detailed learning insights, performance tracking, and personalized recommendations
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-left">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <EnhancedIcon name="Users" size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Mentorship Program</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect with industry experts and get personalized career guidance
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-left">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <EnhancedIcon name="Award" size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Premium Certificates</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Industry-recognized credentials with enhanced verification
                </p>
              </CardContent>
            </Card>
          </div>

          <PremiumRequestForm userId={user.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="premium-dashboard">
      {/* Premium Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <EnhancedIcon name="Crown" size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-premium-welcome">
              Premium Dashboard
            </h1>
            <div className="flex items-center space-x-2">
              <PremiumBadge tier={premiumTier} />
              <span className="text-sm text-muted-foreground">
                Member since {new Date(user.premiumApprovedAt || user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <Button variant="outline" data-testid="button-premium-support">
          <EnhancedIcon name="Headphones" size={16} className="mr-2" />
          Priority Support
        </Button>
      </div>

      {/* Premium Analytics */}
      <PremiumAnalytics 
        analytics={premiumAnalytics} 
        userId={user.id}
        tier={premiumTier}
      />

      {/* Career Development Section */}
      <Card data-testid="card-career-development">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <EnhancedIcon name="Briefcase" size={20} />
              <span>Career Development Tools</span>
            </CardTitle>
            <Badge variant="secondary">Premium Feature</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <EnhancedIcon name="FileText" size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Resume Builder</h3>
                  <p className="text-sm text-muted-foreground">AI-powered resume optimization</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" data-testid="button-resume-builder">
                Build Resume
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <EnhancedIcon name="MessageSquare" size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Interview Prep</h3>
                  <p className="text-sm text-muted-foreground">Practice with AI mock interviews</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" data-testid="button-interview-prep">
                Start Practice
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <EnhancedIcon name="TrendingUp" size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Skill Assessment</h3>
                  <p className="text-sm text-muted-foreground">Industry skill evaluations</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" data-testid="button-skill-assessment">
                Take Assessment
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Mentorship Program */}
      <Card data-testid="card-mentorship">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <EnhancedIcon name="Users" size={20} />
            <span>Mentorship Program</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">AI</span>
              </div>
              <div>
                <h3 className="font-medium">AI Career Advisor</h3>
                <p className="text-sm text-muted-foreground">Get personalized career guidance 24/7</p>
              </div>
            </div>
            <Button data-testid="button-ai-mentor">
              <EnhancedIcon name="MessageCircle" size={16} className="mr-2" />
              Chat Now
            </Button>
          </div>
          
          {careerInsights?.mentors && (
            <div className="mt-4">
              <h4 className="font-medium mb-3">Available Mentors</h4>
              <div className="space-y-2">
                {careerInsights.mentors.slice(0, 3).map((mentor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {mentor.name?.charAt(0) || 'M'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{mentor.name || 'Expert Mentor'}</p>
                        <p className="text-sm text-muted-foreground">{mentor.expertise || 'Industry Expert'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" data-testid={`button-mentor-${index}`}>
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}