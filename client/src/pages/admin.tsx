import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { firebaseUser, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch pending users
  const { data: pendingUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users/pending"],
    enabled: user?.role === "admin",
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
  });

  useEffect(() => {
    if (!firebaseUser || user?.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [firebaseUser, user, setLocation]);

  if (!firebaseUser || user?.role !== "admin") {
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
            <Button onClick={() => setLocation("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <nav className="w-64 bg-card border-r border-border fixed h-full z-30 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold" data-testid="text-admin-title">Admin Panel</span>
          </div>
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg bg-red-100 text-red-800"
                data-testid="link-admin-dashboard"
              >
                <i className="fas fa-tachometer-alt w-5"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="link-user-management"
              >
                <i className="fas fa-users w-5"></i>
                <span>User Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="link-course-management"
              >
                <i className="fas fa-book w-5"></i>
                <span>Course Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center space-x-3 p-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="link-analytics"
              >
                <i className="fas fa-chart-bar w-5"></i>
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Admin Main Content */}
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8" data-testid="text-admin-dashboard-title">
          User Approval Dashboard
        </h1>
        
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
                                {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span data-testid={`text-user-name-${user.id}`}>
                              {user.displayName || user.email.split('@')[0]}
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
                <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No pending approvals</h3>
                <p className="text-muted-foreground">All users have been processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
