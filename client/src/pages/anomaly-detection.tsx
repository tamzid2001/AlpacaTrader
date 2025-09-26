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
import { Upload, FileText, AlertTriangle, TrendingUp, Activity, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CsvUpload, Anomaly } from "@shared/schema";

interface CsvUploadComponentProps {
  onUploadSuccess: (upload: CsvUpload) => void;
  userId: string;
}

function CsvUploadComponent({ onUploadSuccess, userId }: CsvUploadComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: { filename: string; csvData: any[]; userId: string }) => {
      const response = await apiRequest("POST", "/api/csv/upload", data);
      return response.json();
    },
    onSuccess: (upload) => {
      toast({
        title: "CSV uploaded successfully",
        description: `File ${upload.filename} has been uploaded and is ready for analysis.`,
      });
      onUploadSuccess(upload);
      queryClient.invalidateQueries({ queryKey: ["/api/csv/uploads"] });
      setFile(null);
      setCsvData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    // Parse CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error("CSV must have at least a header and one data row");
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
          });
          return row;
        });

        setCsvData(data);
      } catch (error: any) {
        toast({
          title: "CSV parsing error",
          description: error.message,
          variant: "destructive",
        });
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = () => {
    if (!file || !csvData) return;
    
    uploadMutation.mutate({
      filename: file.name,
      csvData,
      userId,
    });
  };

  return (
    <Card className="w-full" data-testid="card-csv-upload">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="dropzone-csv"
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports CSV files with p1-p99 percentile columns (max 50MB)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
            className="hidden"
            id="csv-file-input"
            data-testid="input-csv-file"
          />
          <label htmlFor="csv-file-input">
            <Button variant="outline" asChild data-testid="button-browse-files">
              <span style={{ cursor: 'pointer' }}>Browse Files</span>
            </Button>
          </label>
        </div>

        {file && csvData && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium" data-testid="text-selected-file">
                  {file.name}
                </span>
                <Badge variant="secondary" data-testid="badge-file-size">
                  {(file.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                data-testid="button-upload-csv"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload & Analyze"}
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground" data-testid="text-csv-preview">
              <strong>Preview:</strong> {csvData.length} rows, {Object.keys(csvData[0] || {}).length} columns
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

  const { data: uploads } = useQuery({
    queryKey: ["/api/csv/uploads"],
    queryFn: async () => {
      const response = await fetch(`/api/csv/uploads?userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch uploads");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: anomalies } = useQuery({
    queryKey: ["/api/anomalies"],
    queryFn: async () => {
      const response = await fetch(`/api/anomalies?userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch anomalies");
      return response.json();
    },
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
      const response = await fetch(`/api/anomalies/${uploadId}/export-excel?userId=${user?.id}`, {
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
          <CsvUploadComponent 
            onUploadSuccess={(upload) => setSelectedUpload(upload)} 
            userId={user?.id || ""}
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
              <Card data-testid="card-uploads-table">
                <CardHeader>
                  <CardTitle>Your CSV Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  {uploads && uploads.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rows</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploads.map((upload: CsvUpload) => (
                          <TableRow key={upload.id} data-testid={`row-upload-${upload.id}`}>
                            <TableCell className="font-medium">
                              {upload.filename}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  upload.status === "completed" ? "default" :
                                  upload.status === "processing" ? "secondary" :
                                  upload.status === "error" ? "destructive" : "outline"
                                }
                                data-testid={`badge-status-${upload.id}`}
                              >
                                {upload.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{upload.rowCount}</TableCell>
                            <TableCell>
                              {new Date(upload.uploadedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => analyzeMutation.mutate(upload.id)}
                                disabled={analyzeMutation.isPending || upload.status === "processing"}
                                data-testid={`button-analyze-${upload.id}`}
                              >
                                {upload.status === "processing" ? "Processing..." : "Analyze"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No CSV files uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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