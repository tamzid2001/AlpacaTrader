import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/use-courses";
import { FcGoogle } from "react-icons/fc";
import { 
  SiGithub, 
  SiReplit, 
  SiAmazon, 
  SiPython, 
  SiJavascript, 
  SiReact, 
  SiNodedotjs,
  SiPostgresql,
  SiOpenai
} from "react-icons/si";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { Play } from "lucide-react";
import { DemoVideoModal } from "@/components/demo-video-modal";
import financialDashboardImage from '@assets/stock_images/professional_financi_be72a67e.jpg';
import businessTechImage from '@assets/stock_images/business_finance_tec_ba0a7d4b.jpg';
import websiteInterfaceImage from '@assets/stock_images/modern_website_inter_a217262b.jpg';
import altFinancialImage from '@assets/stock_images/professional_financi_a4a224eb.jpg';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: courses } = useCourses();
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.isApproved) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Header removed - now handled by App layout */}
      
      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="gradient-bg text-white relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="relative flex items-center justify-between min-h-[80vh]">
            {/* Left Content */}
            <div className="flex-1 z-10">
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                data-testid="hero-title"
              >
                Master Financial Markets with
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"> AI-Powered Learning</span>
              </h1>
              <p 
                className="text-xl sm:text-2xl text-emerald-100 mb-8 max-w-2xl"
                data-testid="hero-subtitle"
              >
                Build multi-period binomial models using Amazon SageMaker Canvas. State-of-the-art end-to-end machine learning pipeline for financial analysis.
              </p>
              
              {/* Enhanced Button Group */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/api/login">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-3"
                    data-testid="button-start-learning"
                  >
                    <div className="flex items-center gap-1">
                      <FcGoogle className="w-5 h-5" role="img" aria-label="Google" />
                      <SiGithub className="w-4 h-4" role="img" aria-label="GitHub" />
                      <SiReplit className="w-4 h-4 text-orange-500" role="img" aria-label="Replit" />
                    </div>
                    Start Learning Today
                  </Button>
                </a>
                
                {/* Enhanced Watch Demo Button */}
                <Button 
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowDemoModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-3"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo Video
                </Button>
              </div>
            </div>
            
            {/* Right Side - Financial Dashboard Image */}
            <div className="hidden lg:block flex-1 relative">
              <div className="relative">
                <img 
                  src={financialDashboardImage}
                  alt="Professional Financial Trading Dashboard"
                  className="rounded-2xl shadow-2xl w-full max-w-lg ml-auto transform rotate-3 hover:rotate-0 transition-transform duration-300"
                  data-testid="img-hero-dashboard"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
              data-testid="text-features-title"
            >
              Everything You Need to Excel
            </h2>
            <p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              data-testid="text-features-subtitle"
            >
              Our comprehensive platform combines advanced analytics, expert instruction, and hands-on practice.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 overflow-hidden group" data-testid="card-feature-videos">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${businessTechImage})` }}
              />
              <CardContent className="p-8 relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <EnhancedIcon 
                    name="Video" 
                    size={24} 
                    color="hsl(var(--primary))" 
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">Video Courses</h3>
                <p className="text-muted-foreground">Comprehensive video library with downloadable content, slides, and supplementary materials.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 overflow-hidden group" data-testid="card-feature-ai">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${altFinancialImage})` }}
              />
              <CardContent className="p-8 relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <EnhancedIcon 
                    name="Brain" 
                    size={24} 
                    color="hsl(var(--primary))" 
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Support</h3>
                <p className="text-muted-foreground">24/7 AI-powered support agent to answer questions and provide guidance throughout your learning journey.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 overflow-hidden group" data-testid="card-feature-quizzes">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${websiteInterfaceImage})` }}
              />
              <CardContent className="p-8 relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <EnhancedIcon 
                    name="HelpCircle" 
                    size={24} 
                    color="hsl(var(--primary))" 
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-4">Interactive Quizzes</h3>
                <p className="text-muted-foreground">Test your knowledge with module-specific quizzes and track your progress in real-time.</p>
              </CardContent>
            </Card>
          </div>
        </div>
        </section>

        {/* Technology Stack Section */}
        <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-4" data-testid="text-tech-stack-title">
              Powered by Industry-Leading Technology
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <SiReplit className="w-12 h-12 text-orange-500 hover:opacity-100 transition-opacity" role="img" aria-label="Replit" />
              <SiAmazon className="w-12 h-12 text-orange-400 hover:opacity-100 transition-opacity" role="img" aria-label="Amazon AWS" />
              <SiOpenai className="w-12 h-12 text-green-500 hover:opacity-100 transition-opacity" role="img" aria-label="OpenAI" />
              <SiReact className="w-12 h-12 text-blue-500 hover:opacity-100 transition-opacity" role="img" aria-label="React" />
              <SiNodedotjs className="w-12 h-12 text-green-600 hover:opacity-100 transition-opacity" role="img" aria-label="Node.js" />
              <SiPostgresql className="w-12 h-12 text-blue-600 hover:opacity-100 transition-opacity" role="img" aria-label="PostgreSQL" />
              <SiPython className="w-12 h-12 text-yellow-500 hover:opacity-100 transition-opacity" role="img" aria-label="Python" />
              <SiJavascript className="w-12 h-12 text-yellow-400 hover:opacity-100 transition-opacity" role="img" aria-label="JavaScript" />
            </div>
          </div>
        </div>
        </section>

        {/* Courses Preview */}
        <section id="courses" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
              data-testid="text-courses-title"
            >
              Featured Courses
            </h2>
            <p 
              className="text-xl text-muted-foreground"
              data-testid="text-courses-subtitle"
            >
              Start with our most popular courses designed by industry experts
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses?.map((course) => (
              <Card key={course.id} className="course-card overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300" data-testid={`card-course-${course.id}`}>
                <div className="relative">
                  <img 
                    src={course.imageUrl || websiteInterfaceImage} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    data-testid={`img-course-${course.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <Badge 
                    variant={course.level === 'beginner' ? 'default' : course.level === 'intermediate' ? 'secondary' : 'destructive'}
                    className="absolute top-4 left-4"
                    data-testid={`badge-level-${course.id}`}
                  >
                    {course.level}
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 
                      className="text-xl font-semibold mb-2"
                      data-testid={`text-course-title-${course.id}`}
                    >
                      {course.title}
                    </h3>
                    <span 
                      className="text-muted-foreground text-sm"
                      data-testid={`text-rating-${course.id}`}
                    >
                      {(course.rating || 0) / 10} ★
                    </span>
                  </div>
                  <p 
                    className="text-muted-foreground mb-4"
                    data-testid={`text-course-description-${course.id}`}
                  >
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-foreground font-semibold"
                      data-testid={`text-price-${course.id}`}
                    >
                      ${course.price}
                    </span>
                    <a href="/api/login">
                      <Button 
                        className="hover:bg-primary/90 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                        data-testid={`button-enroll-${course.id}`}
                      >
                        <SiReplit className="w-4 h-4" role="img" aria-label="Replit" />
                        Enroll Now
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </section>
      </main>

      {/* Footer and SupportChat removed - now handled by App layout */}
      <DemoVideoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />
    </div>
  );
}
