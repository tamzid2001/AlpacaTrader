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
import ChartAccessibility from "@/components/accessibility/chart-accessibility"; 
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Upload, FileText, AlertTriangle, TrendingUp, Activity, Download, FolderOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedCsvUpload from "@/components/csv/enhanced-csv-upload";
import CsvFileLibrary from "@/components/csv/csv-file-library";
import ShareDialog from "@/components/csv/share-dialog";
import type { CsvUpload, Anomaly } from "@shared/schema";


interface AnomalyVisualizationProps {
  anomalies: (Anomaly & { upload: CsvUpload })[];
}

function AnomalyVisualization({ anomalies }: AnomalyVisualizationProps) {
  // Keyboard shortcuts for visualization
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'v',
        altKey: true,
        action: () => document.getElementById('visualization-panel')?.scrollIntoView({ behavior: 'smooth' }),
        description: 'Jump to visualization section',
      },
    ],
  });
  
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
        <ChartAccessibility
          data={timeSeriesData}
          title="Anomaly Timeline"
          description="Timeline showing P90 values and week-before values over time to identify trends in anomaly detection"
          chartComponent={
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
          }
        />

        <ChartAccessibility
          data={chartData}
          title="Anomaly Types Distribution"
          description="Bar chart showing the distribution of different types of anomalies detected in the dataset"
          chartComponent={
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          }
        />
      </div>
    </div>
  );
}

export default function AnomalyDetection() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Keyboard shortcuts for anomaly detection page
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'u',
        altKey: true,
        action: () => {
          const uploadSection = document.querySelector('[data-testid="container-enhanced-csv-upload"]');
          uploadSection?.scrollIntoView({ behavior: 'smooth' });
        },
        description: 'Jump to upload section',
      },
      {
        key: 't',
        altKey: true,
        action: () => {
          const tabsElement = document.querySelector('[data-testid="tabs-main"]');
          if (tabsElement) {
            const firstTab = tabsElement.querySelector('[role="tab"]') as HTMLElement;
            firstTab?.focus();
          }
        },
        description: 'Focus on tabs navigation',
      },
    ],
  });
  const [, setLocation] = useLocation();
  const [selectedUpload, setSelectedUpload] = useState<CsvUpload | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUpload, setShareUpload] = useState<CsvUpload | null>(null);
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
      
      <main className="flex-1 ml-64 p-8" data-testid="anomaly-detection-main" role="main" id="main-content">
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
          <Tabs defaultValue="uploads" className="space-y-4" role="tablist" aria-label="Anomaly detection content sections">
            <TabsList data-testid="tabs-main" role="tablist">
              <TabsTrigger 
                value="uploads" 
                data-testid="tab-uploads"
                role="tab"
                aria-controls="uploads-panel"
              >
                CSV Uploads
              </TabsTrigger>
              <TabsTrigger 
                value="anomalies" 
                data-testid="tab-anomalies"
                role="tab"
                aria-controls="anomalies-panel"
              >
                Detected Anomalies
              </TabsTrigger>
              <TabsTrigger 
                value="visualization" 
                data-testid="tab-visualization"
                role="tab"
                aria-controls="visualization-panel"
              >
                Visualization
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="uploads" 
              className="space-y-4"
              role="tabpanel"
              id="uploads-panel"
              aria-labelledby="tab-uploads"
            >
              <CsvFileLibrary 
                onAnalyzeFile={(upload) => {
                  setSelectedUpload(upload);
                  analyzeMutation.mutate(upload.id);
                }}
                onRefresh={refetchUploads}
              />
            </TabsContent>

            <TabsContent 
              value="anomalies" 
              className="space-y-4"
              role="tabpanel"
              id="anomalies-panel"
              aria-labelledby="tab-anomalies"
            >
              <Card data-testid="card-anomalies-table">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detected Anomalies</CardTitle>
                    {anomalies && anomalies.length > 0 && uploads && uploads.length > 0 && (
                      <div className="flex items-center gap-2">
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
                              setShareUpload(latestUpload);
                              setShareDialogOpen(true);
                            }
                          }}
                          data-testid="button-share-results"
                        >
                          <Share2 className="h-4 w-4" />
                          Share Results
                        </Button>
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
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {anomalies && anomalies.length > 0 ? (
                    <Table 
                      aria-label="Detected anomalies data"
                      caption="Table showing detected anomalies with type, date, description, and values"
                    >
                      <TableHeader>
                        <TableRow role="row">
                          <TableHead scope="col">Type</TableHead>
                          <TableHead scope="col">Date</TableHead>
                          <TableHead scope="col">Description</TableHead>
                          <TableHead scope="col">P90 Value</TableHead>
                          <TableHead scope="col">Week Before</TableHead>
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

            <TabsContent 
              value="visualization" 
              className="space-y-4"
              role="tabpanel"
              id="visualization-panel"
              aria-labelledby="tab-visualization"
            >
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

        {/* Share Dialog */}
        <ShareDialog
          csvUpload={shareUpload}
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setShareUpload(null);
          }}
        />
      </main>
    </div>
  );
}