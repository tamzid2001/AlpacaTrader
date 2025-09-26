import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FcGoogle } from "react-icons/fc";
import { SiGithub, SiReplit } from "react-icons/si";
import { TrendingUp, Shield } from "lucide-react";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import SkipNavigation from "@/components/accessibility/skip-navigation";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <>
      <SkipNavigation />
      <header 
        className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95"
        role="banner"
        aria-label="Main navigation"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp 
                  size={16} 
                  color="hsl(var(--primary-foreground))" 
                  aria-hidden="true"
                />
              </div>
              <span className="text-xl font-bold text-foreground">PropFarming Pro</span>
            </Link>
          </div>
          
          <nav 
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Primary navigation"
            id="navigation"
          >
            <button 
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-features"
              aria-label="Navigate to features section"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('courses')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-courses"
              aria-label="Navigate to courses section"
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
            {isLoading ? (
              <Button variant="outline" disabled data-testid="button-loading">
                Loading...
              </Button>
            ) : isAuthenticated ? (
              user?.isApproved ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button data-testid="button-dashboard">Dashboard</Button>
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200"
                        data-testid="button-admin-panel"
                        aria-label="Access admin panel for system management"
                      >
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="relative" 
                        data-testid="button-user-menu"
                        aria-label="Open user menu"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage 
                            src={user?.profileImageUrl || undefined} 
                            alt={`${user?.firstName || user?.email || 'User'} profile picture`} 
                          />
                          <AvatarFallback aria-label="User avatar">
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" data-testid="link-user-dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      {user?.role === "admin" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" data-testid="link-admin-dashboard" className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                              <span className="text-red-700 dark:text-red-300 font-medium">Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/anomaly-detection" data-testid="link-anomaly-detection">Anomaly Detection</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href="/api/logout" data-testid="button-logout">Logout</a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="outline" disabled data-testid="button-pending">
                  Approval Pending
                </Button>
              )
            ) : (
              <a href="/api/login">
                <Button 
                  className="flex items-center gap-2" 
                  data-testid="button-login"
                  aria-label="Sign in with Google, GitHub, or Replit to get started"
                >
                  <div className="flex items-center gap-1" aria-hidden="true">
                    <FcGoogle className="w-4 h-4" />
                    <SiGithub className="w-3 h-3" />
                    <SiReplit className="w-3 h-3 text-orange-500" />
                  </div>
                  Get Started
                </Button>
              </a>
            )}
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                data-testid="button-mobile-menu"
                aria-label="Open mobile navigation menu"
                aria-expanded={isOpen}
              >
                <i className="fas fa-bars text-foreground" aria-hidden="true"></i>
                <span className="sr-only">Menu</span>
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
    </>
  );
}
