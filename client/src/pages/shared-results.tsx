import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { 
  Download, 
  Globe, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Loader2,
  Share2,
  ExternalLink,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharedData {
  id: string;
  title: string | null;
  description: string | null;
  permissions: "view_only" | "view_download";
  viewCount: number;
  upload: {
    id: string;
    filename: string;
    customFilename: string;
    rowCount: number;
    columnCount: number;
    uploadedAt: string;
    status: string;
    timeSeriesData: any[];
  };
  anomalies: Array<{
    id: string;
    anomalyType: string;
    detectedDate: string;
    weekBeforeValue: number | null;
    p90Value: number | null;
    description: string;
    openaiAnalysis: string | null;
    createdAt: string;
  }>;
  sharedBy: {
    firstName: string | null;
    lastName: string | null;
  };
  sharedAt: string;
}

export default function SharedResultsViewer() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllAnomalies, setShowAllAnomalies] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!token) {
        setError("Invalid sharing link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("This shared result has expired or does not exist.");
          } else {
            const errorData = await response.json();
            setError(errorData.error || "Failed to load shared result");
          }
          setIsLoading(false);
          return;
        }

        const sharedData = await response.json();
        setData(sharedData);
      } catch (error) {
        console.error("Error fetching shared data:", error);
        setError("Failed to load shared result. Please check your internet connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, [token]);

  const handleDownload = async () => {
    if (!token || !data || data.permissions !== "view_download") return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/share/${token}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Get filename from headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/['"]/g, '') || 'shared-anomaly-export.xlsx'
        : 'shared-anomaly-export.xlsx';

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
        title: "Download successful",
        description: "Excel file has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!data?.anomalies) return { timeSeriesData: [], typeDistribution: [] };

    const timeSeriesData = data.anomalies.map((anomaly, index) => ({
      date: anomaly.detectedDate,
      type: anomaly.anomalyType,
      p90Value: anomaly.p90Value || 0,
      weekBeforeValue: anomaly.weekBeforeValue || 0,
      index,
    }));

    const typeDistribution = data.anomalies.reduce((acc, anomaly) => {
      acc[anomaly.anomalyType] = (acc[anomaly.anomalyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(typeDistribution).map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }));

    return { timeSeriesData, typeDistribution: chartData };
  };

  const formatAnomalyType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSharedByName = () => {
    if (!data?.sharedBy) return "Unknown User";
    return `${data.sharedBy.firstName || ''} ${data.sharedBy.lastName || ''}`.trim() || "Unknown User";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-medium">Loading Shared Results</h3>
                <p className="text-muted-foreground">Please wait while we fetch the analysis data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Unable to Load Shared Results</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { timeSeriesData, typeDistribution } = getChartData();
  const displayedAnomalies = showAllAnomalies ? data.anomalies : data.anomalies.slice(0, 5);

  return (
    <div className="min-h-screen bg-background" data-testid="page-shared-results">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-shared-title">
                  {data.title || `${data.upload.customFilename} - Anomaly Analysis`}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Shared by {getSharedByName()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(data.sharedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {data.viewCount} views
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                {data.permissions === "view_download" ? (
                  <>
                    <Download className="h-3 w-3" />
                    View + Download
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    View Only
                  </>
                )}
              </Badge>
              
              {data.permissions === "view_download" && (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                  data-testid="button-download-excel"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Description */}
        {data.description && (
          <Alert>
            <AlertDescription className="text-base">
              {data.description}
            </AlertDescription>
          </Alert>
        )}

        {/* File Information */}
        <Card data-testid="card-file-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Filename</div>
                <div className="text-base">{data.upload.filename}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Upload Date</div>
                <div className="text-base">{new Date(data.upload.uploadedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Data Size</div>
                <div className="text-base">{data.upload.rowCount.toLocaleString()} rows, {data.upload.columnCount} columns</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{data.anomalies.length}</div>
                  <div className="text-sm text-muted-foreground">Total Anomalies</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {data.anomalies.filter(a => a.anomalyType === "p50_median_spike").length}
                  </div>
                  <div className="text-sm text-muted-foreground">P50 Median Spikes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {data.anomalies.filter(a => a.anomalyType === "p10_consecutive_low").length}
                  </div>
                  <div className="text-sm text-muted-foreground">P10 Consecutive Lows</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {data.anomalies.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
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
                  <BarChart data={typeDistribution}>
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
        )}

        {/* Anomalies List */}
        <Card data-testid="card-anomalies-list">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detected Anomalies</span>
              {data.anomalies.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllAnomalies(!showAllAnomalies)}
                  className="flex items-center gap-2"
                  data-testid="button-toggle-anomalies"
                >
                  {showAllAnomalies ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All ({data.anomalies.length})
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedAnomalies.map((anomaly, index) => (
              <div key={anomaly.id} className="p-4 border rounded-lg space-y-3" data-testid={`anomaly-item-${index}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {formatAnomalyType(anomaly.anomalyType)}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {anomaly.detectedDate}
                    </div>
                  </div>
                  {(anomaly.p90Value !== null || anomaly.weekBeforeValue !== null) && (
                    <div className="text-sm text-muted-foreground">
                      {anomaly.p90Value !== null && `P90: ${anomaly.p90Value.toFixed(2)}`}
                      {anomaly.weekBeforeValue !== null && ` | Week Before: ${anomaly.weekBeforeValue.toFixed(2)}`}
                    </div>
                  )}
                </div>
                
                <div className="text-sm">{anomaly.description}</div>
                
                {anomaly.openaiAnalysis && (
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    <div className="font-medium mb-1">AI Analysis:</div>
                    <div className="text-muted-foreground">{anomaly.openaiAnalysis}</div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <div className="text-sm text-muted-foreground space-y-2">
            <div>This analysis was shared from the PropFarming Pro platform.</div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Generated on {new Date(data.sharedAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {data.viewCount} total views
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}