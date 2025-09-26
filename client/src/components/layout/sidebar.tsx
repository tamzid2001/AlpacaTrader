import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: "fas fa-home", label: "Dashboard" },
    { href: "/courses", icon: "fas fa-play", label: "My Courses" },
    { href: "/anomaly-detection", icon: "fas fa-chart-line", label: "Anomaly Detection" },
    { href: "/downloads", icon: "fas fa-download", label: "Downloads" },
    { href: "/quizzes", icon: "fas fa-quiz", label: "Quizzes" },
    { href: "/certificates", icon: "fas fa-certificate", label: "Certificates" },
    { href: "/profile", icon: "fas fa-user", label: "Profile" },
  ];

  return (
    <nav className="sidebar-nav w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-30 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-sidebar-primary-foreground text-sm"></i>
          </div>
          <span className="text-xl font-bold text-sidebar-foreground" data-testid="text-sidebar-title">
            PropFarming Pro
          </span>
        </div>
        
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    location === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
          
          <li className="pt-4 border-t border-sidebar-border">
            <Link href="/settings">
              <a
                className="flex items-center space-x-3 p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                data-testid="link-settings"
              >
                <i className="fas fa-cog w-5"></i>
                <span>Settings</span>
              </a>
            </Link>
          </li>
          
          <li>
            <a href="/api/logout" className="block">
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 p-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt w-5"></i>
                <span>Logout</span>
              </Button>
            </a>
          </li>
        </ul>
        
        {user && (
          <div className="mt-8 pt-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-semibold">
                  {user.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate" data-testid="text-user-email">
                  {user.email || ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
