import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Upload, FileText, AlertTriangle, TrendingUp, Activity, Download, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedCsvUpload from "@/components/csv/enhanced-csv-upload";
import CsvFileLibrary from "@/components/csv/csv-file-library";
import type { CsvUpload, Anomaly } from "@shared/schema";


interface AnomalyVisualizationProps {
  anomalies: (Anomaly & { upload: CsvUpload })[];
}

function AnomalyVisualization({ anomalies }: AnomalyVisualizationProps) {
  // Prepare data for charts
  const timeSeriesData = anomalies.map((anomaly, index) => ({
    date: anomaly.detectedDate,
    type: anomaly.anomalyType,
    p90Value: anomaly.p90Value || 0,
    weekBeforeValue: anomaly.weekBeforeValue || 0,
    index,
  }));

  const typeDistribution = anomalies.reduce((acc, anomaly) => {
    acc[anomaly.anomalyType] = (acc[anomaly.anomalyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(typeDistribution).map(([type, count]) => ({
    type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="card-anomaly-timeline">
          <CardHeader>
            <CardTitle>Anomaly Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="p90Value" stroke="#8884d8" name="P90 Value" />
                <Line type="monotone" dataKey="weekBeforeValue" stroke="#82ca9d" name="Week Before Value" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-anomaly-types">
          <CardHeader>
            <CardTitle>Anomaly Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnomalyDetection() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUpload, setSelectedUpload] = useState<CsvUpload | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
      return;
    }
    
    if (user && !user.isApproved) {
      return;
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const { data: uploads, refetch: refetchUploads } = useQuery<CsvUpload[]>({
    queryKey: ["/api/csv/uploads", user?.id],
    enabled: !!user?.id,
  });

  const { data: anomalies = [] } = useQuery<(Anomaly & { upload: CsvUpload })[]>({
    queryKey: ["/api/anomalies"],
    enabled: !!user?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const response = await apiRequest("POST", `/api/csv/${uploadId}/analyze`, {});
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Analysis completed",
        description: `Found ${result.summary.totalAnomalies} anomalies in the dataset.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/csv/uploads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      const response = await fetch(`/api/anomalies/${uploadId}/export-excel`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      
      return response;
    },
    onSuccess: async (response, uploadId) => {
      try {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/['"]/g, '') || 'anomaly-export.xlsx'
          : 'anomaly-export.xlsx';

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export successful",
          description: "Excel file has been downloaded successfully. Ready for Monday.com import!",
        });
      } catch (error) {
        toast({
          title: "Download failed",
          description: "Failed to download the exported file.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Your account is currently pending approval from our admin team. 
              You'll receive access to the platform once approved.
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
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8" data-testid="anomaly-detection-main">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
                Anomaly Detection
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Upload CSV files with time series data and detect anomalies using advanced algorithms
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="gap-1" data-testid="badge-upload-count">
                <FileText className="h-3 w-3" />
                {uploads?.length || 0} uploads
              </Badge>
              <Badge variant="outline" className="gap-1" data-testid="badge-anomaly-count">
                <AlertTriangle className="h-3 w-3" />
                {anomalies?.length || 0} anomalies
              </Badge>
            </div>
          </div>

          {/* Upload Section */}
          <EnhancedCsvUpload 
            onUploadSuccess={(upload) => {
              setSelectedUpload(upload);
              refetchUploads();
            }} 
          />

          {/* Main Content */}
          <Tabs defaultValue="uploads" className="space-y-4">
            <TabsList data-testid="tabs-main">
              <TabsTrigger value="uploads" data-testid="tab-uploads">
                CSV Uploads
              </TabsTrigger>
              <TabsTrigger value="anomalies" data-testid="tab-anomalies">
                Detected Anomalies
              </TabsTrigger>
              <TabsTrigger value="visualization" data-testid="tab-visualization">
                Visualization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads" className="space-y-4">
              <CsvFileLibrary 
                onAnalyzeFile={(upload) => {
                  setSelectedUpload(upload);
                  analyzeMutation.mutate(upload.id);
                }}
                onRefresh={refetchUploads}
              />
            </TabsContent>

            <TabsContent value="anomalies" className="space-y-4">
              <Card data-testid="card-anomalies-table">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detected Anomalies</CardTitle>
                    {anomalies && anomalies.length > 0 && uploads && uploads.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          // Find the most recent upload with anomalies
                          const uploadsWithAnomalies = uploads.filter((upload: CsvUpload) => 
                            anomalies.some((anomaly: Anomaly & { upload: CsvUpload }) => 
                              anomaly.upload?.id === upload.id
                            )
                          );
                          if (uploadsWithAnomalies.length > 0) {
                            const latestUpload = uploadsWithAnomalies
                              .sort((a: CsvUpload, b: CsvUpload) => 
                                new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                              )[0];
                            exportMutation.mutate(latestUpload.id);
                          }
                        }}
                        disabled={exportMutation.isPending}
                        data-testid="button-export-excel"
                      >
                        <Download className="h-4 w-4" />
                        {exportMutation.isPending ? "Exporting..." : "Export to Monday.com"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {anomalies && anomalies.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>P90 Value</TableHead>
                          <TableHead>Week Before</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {anomalies.map((anomaly: Anomaly & { upload: CsvUpload }) => (
                          <TableRow key={anomaly.id} data-testid={`row-anomaly-${anomaly.id}`}>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-type-${anomaly.id}`}>
                                {anomaly.anomalyType.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{anomaly.detectedDate}</TableCell>
                            <TableCell className="max-w-md truncate">
                              {anomaly.description}
                            </TableCell>
                            <TableCell>
                              {anomaly.p90Value?.toFixed(2) || "N/A"}
                            </TableCell>
                            <TableCell>
                              {anomaly.weekBeforeValue?.toFixed(2) || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No anomalies detected yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualization" className="space-y-4">
              {anomalies && anomalies.length > 0 ? (
                <AnomalyVisualization anomalies={anomalies} />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Upload and analyze CSV files to see visualizations</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}