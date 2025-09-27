import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Activity, HardDrive, Zap, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function AdminDatabasePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database statistics
  const { data: dbStats } = useQuery({
    queryKey: ['/api/admin/database/stats'],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch database performance metrics
  const { data: dbPerformance } = useQuery({
    queryKey: ['/api/admin/database/performance'],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch database health
  const { data: dbHealth } = useQuery({
    queryKey: ['/api/health/database'],
    enabled: user?.role === "admin",
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Optimize database mutation
  const optimizeDatabase = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/database/optimize`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/database/performance"] });
      toast({
        title: "Database Optimized",
        description: "Database optimization completed successfully.",
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
        description: "Failed to optimize database.",
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

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/database/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/database/performance"] });
    queryClient.invalidateQueries({ queryKey: ["/api/health/database"] });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-database-title">
              Database Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={refreshData}
              data-testid="button-refresh-data"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => optimizeDatabase.mutate()}
              disabled={optimizeDatabase.isPending}
              data-testid="button-optimize-database"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {optimizeDatabase.isPending ? "Optimizing..." : "Optimize"}
            </Button>
          </div>
        </div>

        {/* Database Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-db-health">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Database Health</p>
                  <p className="text-2xl font-bold" data-testid="text-db-health">
                    {dbHealth?.database?.healthy ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-5 w-5" />
                        Healthy
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-5 w-5" />
                        Unhealthy
                      </span>
                    )}
                  </p>
                  {dbHealth?.database?.latency && (
                    <p className="text-xs text-muted-foreground">
                      {dbHealth.database.latency}ms latency
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-total-users">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold" data-testid="text-total-records">
                    {dbStats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-storage-used">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold" data-testid="text-storage-used">
                    {dbStats?.totalStorageUsed ? `${Math.round(dbStats.totalStorageUsed / 1024 / 1024)}MB` : '0MB'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="card-avg-query-time">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Query Time</p>
                  <p className="text-2xl font-bold" data-testid="text-avg-query-time">
                    {dbStats?.avgQueryTime || 0}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Database Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Table Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dbStats?.tableStats?.length > 0 ? (
                  dbStats.tableStats.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium" data-testid={`text-table-name-${index}`}>{table.tableName}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-table-rows-${index}`}>
                          {table.rowCount?.toLocaleString() || 0} rows
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground" data-testid={`text-table-size-${index}`}>
                          {table.sizeBytes ? `${Math.round(table.sizeBytes / 1024)}KB` : '0KB'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground" data-testid="text-loading-table-stats">
                    Loading table statistics...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Index Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dbPerformance?.indexUsage?.length > 0 ? (
                  dbPerformance.indexUsage.map((index, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium" data-testid={`text-index-name-${i}`}>{index.indexName}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-index-table-${i}`}>
                            {index.tableName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium" data-testid={`text-index-usage-${i}`}>
                            {index.usage}%
                          </p>
                        </div>
                      </div>
                      <Progress value={index.usage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground" data-testid="text-loading-index-usage">
                    Loading index usage...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Pool Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Connection Pool Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
                <p className="text-2xl font-bold" data-testid="text-active-connections">
                  {dbHealth?.connectionPool?.activeConnections || 0}
                </p>
                <Progress 
                  value={((dbHealth?.connectionPool?.activeConnections || 0) / (dbHealth?.connectionPool?.maxConnections || 1)) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Idle Connections</p>
                <p className="text-2xl font-bold" data-testid="text-idle-connections">
                  {dbHealth?.connectionPool?.idleConnections || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Max Connections</p>
                <p className="text-2xl font-bold" data-testid="text-max-connections">
                  {dbHealth?.connectionPool?.maxConnections || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Database Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                data-testid="button-analyze-tables"
              >
                <Database className="h-6 w-6" />
                <span className="text-sm">Analyze Tables</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                data-testid="button-vacuum-db"
              >
                <HardDrive className="h-6 w-6" />
                <span className="text-sm">Vacuum Database</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                data-testid="button-reindex"
              >
                <RefreshCw className="h-6 w-6" />
                <span className="text-sm">Reindex</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                data-testid="button-backup-db"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Backup Database</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}