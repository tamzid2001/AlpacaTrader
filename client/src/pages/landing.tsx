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
import { 
  TrendingUp, Shield, Users, Trophy, Star, Calendar, DollarSign, Target, 
  Briefcase, Zap, Play, Clock, Download, Bot, MessageCircle, Brain,
  HelpCircle, BarChart, Database, PieChart, Smartphone, Award, Building,
  Lock, CheckCircle, Sparkles, Rocket, Flame, Heart, Lightbulb
} from "lucide-react";
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
        <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-500">
          {/* Dynamic floating elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-16 h-16 bg-yellow-400 rounded-full opacity-20 animate-bounce delay-300"></div>
            <div className="absolute top-40 right-20 w-12 h-12 bg-pink-400 rounded-full opacity-30 animate-pulse delay-500"></div>
            <div className="absolute bottom-32 left-32 w-20 h-20 bg-cyan-400 rounded-full opacity-25 animate-bounce delay-700"></div>
            <div className="absolute bottom-20 right-10 w-14 h-14 bg-green-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-orange-400 rounded-full opacity-15 animate-bounce delay-200"></div>
            <div className="absolute top-3/4 right-1/3 w-10 h-10 bg-indigo-400 rounded-full opacity-25 animate-pulse delay-800"></div>
          </div>
          
          {/* Enhanced content with more icons */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="relative flex items-center justify-between min-h-[80vh]">
              {/* Left Content */}
              <div className="flex-1 z-10">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                  <span className="flex items-center gap-4 mb-4" data-testid="hero-title">
                    <TrendingUp className="w-16 h-16 text-yellow-300 animate-pulse" />
                    Master Financial Markets
                  </span>
                  <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                    with AI-Powered Learning
                  </span>
                </h1>
                
                <p 
                  className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl"
                  data-testid="hero-subtitle"
                >
                  Build multi-period binomial models using Amazon SageMaker Canvas. State-of-the-art end-to-end machine learning pipeline for financial analysis.
                </p>
                
                {/* Key benefits with icons */}
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    <span className="text-white font-semibold">Real-Time Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Shield className="w-5 h-5 text-green-300" />
                    <span className="text-white font-semibold">Secure Platform</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Users className="w-5 h-5 text-blue-300" />
                    <span className="text-white font-semibold">10K+ Users</span>
                  </div>
                </div>
              
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
                  variant="outline"
                  size="lg"
                  onClick={() => setShowDemoModal(true)}
                  className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-3"
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

        {/* User Success Stories */}
        <section className="py-24 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-8 h-8 text-orange-500" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Success Stories
                </h2>
                <Trophy className="w-8 h-8 text-pink-500" />
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See how traders and analysts transformed their careers with our platform
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Success Story 1 - Career Transformation */}
              <Card className="p-8 border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-2" data-testid="card-success-story-1">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    S.M.
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-lg">Sarah Martinez</h4>
                    <p className="text-muted-foreground">Investment Analyst</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <p className="text-muted-foreground italic">
                    "Went from Excel spreadsheets to ML-powered models in 3 months. Got promoted to Senior Analyst with a 40% salary increase!"
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-semibold">+40% Salary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600">3 months</span>
                  </div>
                </div>
              </Card>
              
              {/* Success Story 2 - Business Success */}
              <Card className="p-8 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-2" data-testid="card-success-story-2">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    M.C.
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-lg">Michael Chen</h4>
                    <p className="text-muted-foreground">Hedge Fund Manager</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <p className="text-muted-foreground italic">
                    "The SageMaker integration helped optimize our portfolio performance. We achieved 23% better returns this quarter!"
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-semibold">+23% Returns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-purple-600">Portfolio Opt</span>
                  </div>
                </div>
              </Card>
              
              {/* Success Story 3 - Career Pivot */}
              <Card className="p-8 border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-2" data-testid="card-success-story-3">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    R.P.
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-lg">Raj Patel</h4>
                    <p className="text-muted-foreground">Quant Researcher</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <p className="text-muted-foreground italic">
                    "Transitioned from software engineering to quantitative finance. The market data analysis tools were game-changing!"
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-600 font-semibold">Career Pivot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">6 months</span>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Success Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Users className="w-12 h-12 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="metric-users">10,000+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="w-12 h-12 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2" data-testid="metric-success-rate">89%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Award className="w-12 h-12 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2" data-testid="metric-certifications">500+</div>
                <div className="text-muted-foreground">Certifications</div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Star className="w-12 h-12 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-2" data-testid="metric-rating">4.9/5</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section id="features" className="py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Everything You Need to Excel
                </h2>
                <Rocket className="w-8 h-8 text-pink-500 animate-bounce" />
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our comprehensive platform combines advanced analytics, expert instruction, and hands-on practice.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Video Courses */}
              <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-blue-200 hover:border-blue-400" data-testid="card-feature-videos">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 group-hover:from-blue-400/20 group-hover:to-purple-400/20 transition-all duration-300"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-200">New</Badge>
                      <h3 className="text-xl font-bold text-blue-700">Video Courses</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">Comprehensive video library with downloadable content, slides, and supplementary materials.</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-semibold">50+ Hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600 font-semibold">Materials</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Support */}
              <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-green-200 hover:border-green-400" data-testid="card-feature-ai">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 group-hover:from-green-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                      <Bot className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-200">AI Powered</Badge>
                      <h3 className="text-xl font-bold text-green-700">AI Support</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">24/7 AI-powered support agent to answer questions and provide guidance throughout your learning journey.</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600 font-semibold">Instant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-600 font-semibold">Smart</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Interactive Quizzes */}
              <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 border-orange-200 hover:border-orange-400" data-testid="card-feature-quizzes">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 group-hover:from-orange-400/20 group-hover:to-red-400/20 transition-all duration-300"></div>
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                      <HelpCircle className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-orange-100 text-orange-800 hover:bg-orange-200">Interactive</Badge>
                      <h3 className="text-xl font-bold text-orange-700">Smart Quizzes</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">Test your knowledge with module-specific quizzes and track your progress in real-time.</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-semibold">Adaptive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600 font-semibold">Tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Additional Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Market Data */}
              <Card className="p-6 border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300" data-testid="card-feature-market-data">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-cyan-700">Market Data</h4>
                </div>
                <p className="text-sm text-muted-foreground">Real-time market data with CSV downloads</p>
              </Card>
              
              {/* Portfolio Analysis */}
              <Card className="p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300" data-testid="card-feature-portfolio">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-purple-700">Portfolio Analysis</h4>
                </div>
                <p className="text-sm text-muted-foreground">Advanced portfolio optimization tools</p>
              </Card>
              
              {/* Team Collaboration */}
              <Card className="p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300" data-testid="card-feature-team">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-700">Team Features</h4>
                </div>
                <p className="text-sm text-muted-foreground">Collaborate with team members</p>
              </Card>
              
              {/* Mobile App */}
              <Card className="p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300" data-testid="card-feature-mobile">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-indigo-700">Mobile Ready</h4>
                </div>
                <p className="text-sm text-muted-foreground">Access anywhere on any device</p>
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

        {/* Social Proof & Trust Signals */}
        <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Award className="w-6 h-6 text-yellow-500" />
                <p className="text-lg text-muted-foreground">Trusted by leading institutions</p>
                <Shield className="w-6 h-6 text-green-500" />
              </div>
            </div>
            
            {/* Company Logos */}
            <div className="flex items-center justify-center gap-8 opacity-60 mb-8 flex-wrap" data-testid="company-logos">
              <div className="flex items-center gap-2">
                <Building className="w-8 h-8 text-blue-600" />
                <span className="font-semibold">Goldman Sachs</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-8 h-8 text-green-600" />
                <span className="font-semibold">JP Morgan</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <span className="font-semibold">Morgan Stanley</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="w-8 h-8 text-red-600" />
                <span className="font-semibold">BlackRock</span>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4" data-testid="trust-badges">
              <div className="text-center p-4">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-green-600">GDPR Compliant</p>
              </div>
              <div className="text-center p-4">
                <Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-blue-600">256-bit SSL</p>
              </div>
              <div className="text-center p-4">
                <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-yellow-600">ISO 27001</p>
              </div>
              <div className="text-center p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-green-600">SOC 2</p>
              </div>
              <div className="text-center p-4">
                <Star className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-orange-600">4.9 Rating</p>
              </div>
              <div className="text-center p-4">
                <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-purple-600">10K+ Users</p>
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
