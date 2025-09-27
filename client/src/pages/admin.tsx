import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Link, useLocation, Route, Switch } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Shield, Users, BarChart, BookOpen, Database, Activity, HardDrive, Zap, Menu, X, Crown } from "lucide-react";

// Import admin sub-pages
import AdminUsersPage from "./admin/users";
import AdminCoursesPage from "./admin/courses";
import AdminDatabasePage from "./admin/database";
import AdminSecurityPage from "./admin/security";
import AdminPremiumApprovalsPage from "./admin/premium-approvals";

// Admin Dashboard Overview Component
function AdminDashboardOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database statistics
  const { data: dbStats } = useQuery({
    queryKey: ['/api/admin/database/stats'],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch database health
  const { data: dbHealth } = useQuery({
    queryKey: ['/api/health/database'],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch pending users
  const { data: pendingUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users/pending"],
    enabled: user?.role === "admin",
    retry: false,
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/pending"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-dashboard-title">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Database Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database Health</p>
                <p className="text-2xl font-bold" data-testid="text-db-health">
                  {(dbHealth as any)?.database?.healthy ? (
                    <span className="text-green-600">Healthy</span>
                  ) : (
                    <span className="text-red-600">{(dbHealth as any)?.database?.healthy === false ? 'Unhealthy' : 'Unknown'}</span>
                  )}
                </p>
                {(dbHealth as any)?.database?.latency && (
                  <p className="text-xs text-muted-foreground">
                    {(dbHealth as any).database.latency}ms latency
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold" data-testid="text-total-users">
                  {(dbStats as any)?.totalUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold" data-testid="text-storage-used">
                  {(dbStats as any)?.totalStorageUsed ? `${Math.round((dbStats as any).totalStorageUsed / 1024 / 1024)}MB` : '0MB'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Query Time</p>
                <p className="text-2xl font-bold" data-testid="text-avg-query-time">
                  {(dbStats as any)?.avgQueryTime || 0}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Approvals */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle data-testid="text-pending-approvals">Pending User Approvals</CardTitle>
          <p className="text-muted-foreground" data-testid="text-pending-description">
            Review and approve new user registrations
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="p-8 text-center" data-testid="loading-pending-users">
              <p className="text-muted-foreground">Loading pending users...</p>
            </div>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Registration Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingUsers.slice(0, 5).map((user) => (
                    <tr key={user.id} data-testid={`row-user-${user.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-semibold">
                              {user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span data-testid={`text-user-name-${user.id}`}>
                            {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email?.split('@')[0] || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground" data-testid={`text-user-date-${user.id}`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={approveUserMutation.isPending}
                            className="hover:bg-primary/90"
                            data-testid={`button-approve-${user.id}`}
                          >
                            {approveUserMutation.isPending ? "Approving..." : "Approve"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center" data-testid="text-no-pending">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-700 dark:text-green-300">No pending approvals</h3>
              <p className="text-muted-foreground">All users have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Sidebar Component
function AdminSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: BarChart, label: "Dashboard", exact: true },
    { href: "/admin/users", icon: Users, label: "User Management" },
    { href: "/admin/courses", icon: BookOpen, label: "Course Management" },
    { href: "/admin/premium-approvals", icon: Crown, label: "Premium Approvals" },
    { href: "/admin/database", icon: Database, label: "Database Management" },
    { href: "/admin/security", icon: Shield, label: "Security & Audit" },
  ];

  return (
    <nav className={cn("bg-card border-r border-border", className)} role="navigation" aria-label="Admin navigation">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold" data-testid="text-admin-title">Admin Panel</span>
        </div>
        
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 text-red-800 dark:text-red-200 border border-red-200/50 dark:border-red-800/50"
                        : "text-muted-foreground hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/50 dark:hover:to-orange-950/50 hover:text-red-700 dark:hover:text-red-300"
                    )}
                    data-testid={`link-${item.label.toLowerCase().replace(/[\s&]/g, '-')}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    
    if (!isLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Admin role required to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin dashboard.
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
      {/* Desktop Sidebar */}
      <AdminSidebar className="hidden lg:block w-64 fixed h-full z-30 overflow-y-auto" />
      
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open admin menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar 
                className="h-full" 
                onNavigate={() => setIsMobileMenuOpen(false)} 
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-20 lg:pt-0">
        <Switch>
          <Route path="/admin" component={AdminDashboardOverview} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/courses" component={AdminCoursesPage} />
          <Route path="/admin/premium-approvals" component={AdminPremiumApprovalsPage} />
          <Route path="/admin/database" component={AdminDatabasePage} />
          <Route path="/admin/security" component={AdminSecurityPage} />
          {/* Fallback to dashboard */}
          <Route component={AdminDashboardOverview} />
        </Switch>
      </div>
    </div>
  );
}