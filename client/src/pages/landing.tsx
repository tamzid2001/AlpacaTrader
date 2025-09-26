import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import SupportChat from "@/components/support/support-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/use-courses";
import { FcGoogle } from "react-icons/fc";
import { SiGithub, SiReplit } from "react-icons/si";

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: courses } = useCourses();

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
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              data-testid="hero-title"
            >
              Master Financial Markets with
              <span className="text-emerald-200"> AI-Powered Learning</span>
            </h1>
            <p 
              className="text-xl sm:text-2xl text-emerald-100 mb-8 max-w-3xl mx-auto"
              data-testid="hero-subtitle"
            >
              Build multi-period binomial models using Amazon SageMaker Canvas. State-of-the-art end-to-end machine learning pipeline for financial analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold flex items-center gap-3"
                  data-testid="button-start-learning"
                >
                  <div className="flex items-center gap-1">
                    <FcGoogle className="w-5 h-5" />
                    <SiGithub className="w-4 h-4" />
                    <SiReplit className="w-4 h-4 text-orange-500" />
                  </div>
                  Sign in with Google & More
                </Button>
              </a>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => scrollToSection('features')}
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                data-testid="button-watch-demo"
              >
                Watch Demo
              </Button>
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
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-videos">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <i className="fas fa-video text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">Video Courses</h3>
                <p className="text-muted-foreground">Comprehensive video library with downloadable content, slides, and supplementary materials.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-ai">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <i className="fas fa-brain text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Support</h3>
                <p className="text-muted-foreground">24/7 AI-powered support agent to answer questions and provide guidance throughout your learning journey.</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-quizzes">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <i className="fas fa-quiz text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-4">Interactive Quizzes</h3>
                <p className="text-muted-foreground">Test your knowledge with module-specific quizzes and track your progress in real-time.</p>
              </CardContent>
            </Card>
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
              <Card key={course.id} className="course-card overflow-hidden hover:shadow-lg" data-testid={`card-course-${course.id}`}>
                <img 
                  src={course.imageUrl || ""} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  data-testid={`img-course-${course.id}`}
                />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={course.level === 'beginner' ? 'default' : course.level === 'intermediate' ? 'secondary' : 'destructive'}
                      data-testid={`badge-level-${course.id}`}
                    >
                      {course.level}
                    </Badge>
                    <span 
                      className="text-muted-foreground text-sm"
                      data-testid={`text-rating-${course.id}`}
                    >
                      {(course.rating || 0) / 10} ★
                    </span>
                  </div>
                  <h3 
                    className="text-xl font-semibold mb-2"
                    data-testid={`text-course-title-${course.id}`}
                  >
                    {course.title}
                  </h3>
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
                        className="hover:bg-primary/90 flex items-center gap-2"
                        data-testid={`button-enroll-${course.id}`}
                      >
                        <SiReplit className="w-4 h-4" />
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

      <Footer />
      <SupportChat />
    </div>
  );
}
