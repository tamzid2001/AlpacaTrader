import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, BarChart, BookOpen, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      {/* Admin Sidebar */}
      <nav className="w-64 bg-card border-r border-border fixed h-full z-30 overflow-y-auto" role="navigation" aria-label="Admin navigation">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold" data-testid="text-admin-title">Admin Panel</span>
          </div>
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 text-red-800 dark:text-red-200 border border-red-200/50 dark:border-red-800/50"
                data-testid="link-admin-dashboard"
                aria-current="page"
              >
                <BarChart className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/50 dark:hover:to-orange-950/50 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                data-testid="link-user-management"
              >
                <Users className="h-5 w-5" aria-hidden="true" />
                <span>User Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/50 dark:hover:to-orange-950/50 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                data-testid="link-course-management"
              >
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                <span>Course Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/50 dark:hover:to-orange-950/50 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                data-testid="link-analytics"
              >
                <BarChart className="h-5 w-5" aria-hidden="true" />
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Admin Main Content */}
      <main className="flex-1 ml-64 p-8" role="main" id="main-content">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-dashboard-title">
            Admin Dashboard
          </h1>
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
            {isLoading ? (
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
                    {pendingUsers.map((user) => (
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
                            <Button
                              variant="destructive"
                              size="sm"
                              className="hover:bg-destructive/90"
                              data-testid={`button-reject-${user.id}`}
                            >
                              Reject
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
      </main>
    </div>
  );
}
