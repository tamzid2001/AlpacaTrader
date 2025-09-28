import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Eye, Search, Filter, RefreshCw } from "lucide-react";

export default function AdminSecurityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [successFilter, setSuccessFilter] = useState("all");

  // Fetch security audit logs
  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["/api/admin/security/audit-logs"],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch active sessions
  const { data: activeSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/admin/security/sessions"],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch security metrics
  const { data: securityMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/admin/security/metrics"],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Revoke session mutation
  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", `/api/admin/security/sessions/${sessionId}/revoke`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/sessions"] });
      toast({
        title: "Session Revoked",
        description: "User session has been revoked successfully.",
      });
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
      toast({
        title: "Error",
        description: "Failed to revoke session.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "Admin role required to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/admin";
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

  // Filter audit logs based on search and filters
  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSuccess = successFilter === "all" || 
      (successFilter === "success" && log.success) ||
      (successFilter === "failure" && !log.success);
    
    return matchesSearch && matchesAction && matchesSuccess;
  }) || [];

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    
    switch (action) {
      case "login": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "logout": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "failed_login": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "session_expired": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/security/audit-logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/security/sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/security/metrics"] });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-security-title">
              Security & Audit
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshData}
            data-testid="button-refresh-security-data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-sessions">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold" data-testid="text-active-sessions-count">
                    {activeSessions?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-failed-logins">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed Logins (24h)</p>
                  <p className="text-2xl font-bold" data-testid="text-failed-logins-count">
                    {securityMetrics?.failedLoginsLast24h || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-successful-logins">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful Logins (24h)</p>
                  <p className="text-2xl font-bold" data-testid="text-successful-logins-count">
                    {securityMetrics?.successfulLoginsLast24h || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-high-risk-events">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk Events</p>
                  <p className="text-2xl font-bold" data-testid="text-high-risk-events-count">
                    {securityMetrics?.highRiskEvents || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card className="mb-8">
          <CardHeader className="border-b border-border">
            <CardTitle data-testid="text-active-sessions-title">Active User Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSessions ? (
              <div className="p-8 text-center" data-testid="loading-sessions">
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : activeSessions && activeSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">IP Address</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">User Agent</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Last Activity</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeSessions.map((session) => (
                      <tr key={session.id} data-testid={`row-session-${session.id}`}>
                        <td className="px-6 py-4" data-testid={`text-session-user-${session.id}`}>
                          {session.userId || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground" data-testid={`text-session-ip-${session.id}`}>
                          {session.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" data-testid={`text-session-agent-${session.id}`}>
                          {session.userAgent || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground" data-testid={`text-session-created-${session.id}`}>
                          {new Date(session.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground" data-testid={`text-session-activity-${session.id}`}>
                          {new Date(session.lastActivity).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeSession.mutate(session.id)}
                            disabled={revokeSession.isPending}
                            data-testid={`button-revoke-session-${session.id}`}
                          >
                            {revokeSession.isPending ? "Revoking..." : "Revoke"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center" data-testid="text-no-sessions">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No active sessions</h3>
                <p className="text-muted-foreground">No active user sessions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by user ID, IP address, or action..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-logs"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-40" data-testid="select-action-filter">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                    <SelectItem value="session_expired">Session Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={successFilter} onValueChange={setSuccessFilter}>
                  <SelectTrigger className="w-40" data-testid="select-success-filter">
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle data-testid="text-audit-logs-title">Security Audit Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingLogs ? (
              <div className="p-8 text-center" data-testid="loading-logs">
                <p className="text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Timestamp</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">User ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">IP Address</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Result</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} data-testid={`row-log-${log.id}`}>
                        <td className="px-6 py-4 text-muted-foreground" data-testid={`text-log-timestamp-${log.id}`}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4" data-testid={`text-log-user-${log.id}`}>
                          {log.userId || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getActionColor(log.action, log.success)} data-testid={`badge-log-action-${log.id}`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground" data-testid={`text-log-ip-${log.id}`}>
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={log.success ? "default" : "destructive"}
                            data-testid={`badge-log-result-${log.id}`}
                          >
                            {log.success ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Failed
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="px-6 py-4" data-testid={`text-log-risk-${log.id}`}>
                          <span className={`font-medium ${log.riskScore > 7 ? 'text-red-600' : log.riskScore > 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {log.riskScore || 0}/10
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center" data-testid="text-no-logs">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No audit logs found</h3>
                <p className="text-muted-foreground">No audit logs match your current filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}