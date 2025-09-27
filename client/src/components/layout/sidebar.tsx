import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { EnhancedIcon } from "@/components/icons/enhanced-icon";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: "LayoutDashboard", label: "Dashboard" },
    { href: "/market-data", icon: "TrendingUp", label: "Market Data" },
    { href: "/anomaly-detection", icon: "BarChart3", label: "Anomaly Detection" },
    { href: "/my-shared-results", icon: "Share2", label: "My Shared Results" },
  ];

  return (
    <nav 
      className="sidebar-nav hidden lg:block w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-30 overflow-y-auto"
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <EnhancedIcon 
              name="TrendingUp" 
              size={16} 
              color="hsl(var(--sidebar-primary-foreground))" 
              aria-hidden={true}
            />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground" data-testid="text-sidebar-title">
            PropFarming Pro
          </span>
        </div>
        
        <ul className="space-y-2" role="list">
          {navItems.map((item) => (
            <li key={item.href} role="listitem">
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    location === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                  aria-current={location === item.href ? 'page' : undefined}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <EnhancedIcon 
                    name={item.icon} 
                    size={20} 
                    aria-hidden={true}
                  />
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
          
          {user?.role === "admin" && (
            <>
              <li className="pt-4 border-t border-sidebar-border" role="listitem">
                <div className="px-3 py-2">
                  <h2 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                    Administration
                  </h2>
                </div>
              </li>
              <li role="listitem">
                <Link href="/admin">
                  <a
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border border-red-200/50 dark:border-red-800/50",
                      location.startsWith("/admin")
                        ? "bg-red-100 dark:bg-red-900/70 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700"
                        : "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/70 hover:border-red-300 dark:hover:border-red-700"
                    )}
                    data-testid="link-admin-panel"
                    aria-current={location.startsWith("/admin") ? 'page' : undefined}
                    aria-label="Navigate to Admin Panel"
                  >
                    <EnhancedIcon 
                      name="Shield" 
                      size={20} 
                      aria-hidden={true}
                    />
                    <span className="font-medium">Admin Panel</span>
                  </a>
                </Link>
              </li>
            </>
          )}
          
          
          <li role="listitem">
            <a href="/api/logout" className="block">
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 p-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
                data-testid="button-logout"
                aria-label="Sign out of your account"
              >
                <EnhancedIcon 
                  name="LogOut" 
                  size={20} 
                  aria-hidden={true}
                />
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
