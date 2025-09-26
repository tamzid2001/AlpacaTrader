import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AuthModals from "@/components/auth/auth-modals";

export default function Header() {
  const { firebaseUser, isApproved } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-primary-foreground text-sm"></i>
              </div>
              <span className="text-xl font-bold text-foreground">PropFarming Pro</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-features"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('courses')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-courses"
            >
              Courses
            </button>
            <Link 
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-privacy"
            >
              Privacy
            </Link>
            <Link 
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-terms"
            >
              Terms
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {firebaseUser ? (
              isApproved ? (
                <Link href="/dashboard">
                  <Button data-testid="button-dashboard">Dashboard</Button>
                </Link>
              ) : (
                <Button variant="outline" disabled data-testid="button-pending">
                  Approval Pending
                </Button>
              )
            ) : (
              <AuthModals>
                <Button data-testid="button-get-started">Get Started</Button>
              </AuthModals>
            )}
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <i className="fas fa-bars text-foreground"></i>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-8">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-mobile-features"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('courses')}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-mobile-courses"
                >
                  Courses
                </button>
                <Link 
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                  data-testid="link-mobile-privacy"
                >
                  Privacy
                </Link>
                <Link 
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                  data-testid="link-mobile-terms"
                >
                  Terms
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
