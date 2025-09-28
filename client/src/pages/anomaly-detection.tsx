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
import { useRef, useCallback } from "react";
import ChartAccessibility from "@/components/accessibility/chart-accessibility"; 
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Upload, FileText, AlertTriangle, TrendingUp, Activity, Download, FolderOpen, Share2, BarChart3, Info, FileSpreadsheet, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedCsvUpload from "@/components/csv/enhanced-csv-upload";
import CsvFileLibrary from "@/components/csv/csv-file-library";
import ShareDialog from "@/components/csv/share-dialog";
import type { CsvUpload, Anomaly } from "@shared/schema";

// SageMaker Canvas types and functions
interface QuantileData {
  date: string;
  p10?: number;
  p50?: number;
  p90?: number;
  [key: string]: any;
}

interface ColumnDetectionResult {
  dateCol: string | null;
  p10Col: string | null;
  p50Col: string | null;
  p90Col: string | null;
  allColumns: string[];
  success: boolean;
  message: string;
}

interface CanvasUploadState {
  step: 'select' | 'preview' | 'visualize';
  progress: number;
}

// Helper functions to replicate Python logic
function _norm(columnName: string): string {
  return columnName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function _find_col(columns: string[], candidates: string[]): string | null {
  const colsNorm: Record<string, string> = {};
  columns.forEach(col => {
    colsNorm[_norm(col)] = col;
  });
  
  for (const cand of candidates) {
    const normalizedCand = _norm(cand);
    if (normalizedCand in colsNorm) {
      return colsNorm[normalizedCand];
    }
  }
  
  return null;
}

function detectQuantileColumns(csvData: any[]): ColumnDetectionResult {
  if (!csvData || csvData.length === 0) {
    return {
      dateCol: null,
      p10Col: null,
      p50Col: null,
      p90Col: null,
      allColumns: [],
      success: false,
      message: 'No data provided'
    };
  }

  const columns = Object.keys(csvData[0] || {});
  
  // Replicate Python column detection logic exactly
  const dateCol = _find_col(columns, ["date", "ds", "timestamp", "time"]);
  const p10Col = _find_col(columns, ["p10", "q10", "10"]);
  const p50Col = _find_col(columns, ["p50", "q50", "50", "median"]);
  const p90Col = _find_col(columns, ["p90", "q90", "90"]);

  const foundQuantiles = [p10Col, p50Col, p90Col].filter(Boolean);
  const success = foundQuantiles.length >= 2; // At least 2 quantiles required

  return {
    dateCol,
    p10Col,
    p50Col,
    p90Col,
    allColumns: columns,
    success,
    message: success 
      ? `Successfully detected ${foundQuantiles.length} quantile columns`
      : `Could not find required quantile columns. Found: ${foundQuantiles.join(', ') || 'none'}`
  };
}

function processQuantileData(csvData: any[], detection: ColumnDetectionResult): QuantileData[] {
  return csvData.map(row => {
    const processed: QuantileData = {
      date: detection.dateCol ? row[detection.dateCol] : 'N/A',
    };
    
    if (detection.p10Col) {
      const val = parseFloat(row[detection.p10Col]);
      processed.p10 = isNaN(val) ? undefined : val;
    }
    
    if (detection.p50Col) {
      const val = parseFloat(row[detection.p50Col]);
      processed.p50 = isNaN(val) ? undefined : val;
    }
    
    if (detection.p90Col) {
      const val = parseFloat(row[detection.p90Col]);
      processed.p90 = isNaN(val) ? undefined : val;
    }
    
    return processed;
  }).filter(item => 
    item.p10 !== undefined || item.p50 !== undefined || item.p90 !== undefined
  );
}

function calculateChartDimensions(dataLength: number) {
  // Replicate Python auto-sizing: width = max(18, min(300, 0.40 * n))
  const width = Math.max(18, Math.min(300, 0.40 * dataLength));
  const height = 6; // Fixed height as in Python
  
  return {
    width: width * 20, // Convert to pixels (approximate)
    height: height * 60 // Convert to pixels (approximate)
  };
}

function parseCsvContent(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}


interface AnomalyVisualizationProps {
  anomalies: (Anomaly & { upload: CsvUpload })[];
}

function SageMakerCanvasVisualizor() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [columnDetection, setColumnDetection] = useState<ColumnDetectionResult | null>(null);
  const [processedData, setProcessedData] = useState<QuantileData[]>([]);
  const [uploadState, setUploadState] = useState<CanvasUploadState>({ step: 'select', progress: 0 });
  const [activeTab, setActiveTab] = useState('upload');
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = async (selectedFile: File) => {
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

    try {
      setFile(selectedFile);
      setUploadState({ step: 'preview', progress: 25 });

      // Parse CSV content
      const content = await selectedFile.text();
      const data = parseCsvContent(content);
      setCsvData(data);
      
      setUploadState({ step: 'preview', progress: 50 });

      // Detect quantile columns
      const detection = detectQuantileColumns(data);
      setColumnDetection(detection);

      if (detection.success) {
        // Process data for visualization
        const processed = processQuantileData(data, detection);
        setProcessedData(processed);
        setUploadState({ step: 'visualize', progress: 100 });
        setActiveTab('visualization');
        
        toast({
          title: "CSV processed successfully",
          description: `Found ${processed.length} data points with quantile information.`,
        });
      } else {
        setUploadState({ step: 'preview', progress: 100 });
        toast({
          title: "Column detection issue",
          description: detection.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "CSV parsing error",
        description: error.message,
        variant: "destructive",
      });
      setFile(null);
      setUploadState({ step: 'select', progress: 0 });
    }
  };

  const resetForm = () => {
    setFile(null);
    setCsvData(null);
    setColumnDetection(null);
    setProcessedData([]);
    setUploadState({ step: 'select', progress: 0 });
    setActiveTab('upload');
  };

  const exportSVG = async () => {
    if (!chartRef.current) return;

    try {
      // Get the chart SVG element
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        toast({
          title: "Export error",
          description: "No chart found to export",
          variant: "destructive",
        });
        return;
      }

      // Clone and enhance the SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Add title to match Python implementation
      const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleElement.setAttribute('x', '50%');
      titleElement.setAttribute('y', '30');
      titleElement.setAttribute('text-anchor', 'middle');
      titleElement.setAttribute('font-size', '16');
      titleElement.setAttribute('font-weight', 'bold');
      titleElement.textContent = 'P10 / P50 / P90 (All rows from CSV)';
      clonedSvg.insertBefore(titleElement, clonedSvg.firstChild);

      // Serialize SVG
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      
      // Create and download file
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sagemaker-quantiles-${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "SVG exported successfully",
        description: "Chart has been downloaded as SVG file.",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const chartConfig = {
    p10: {
      label: columnDetection?.p10Col || "P10",
      color: "#ef4444", // red-500
    },
    p50: {
      label: columnDetection?.p50Col || "P50", 
      color: "#3b82f6", // blue-500
    },
    p90: {
      label: columnDetection?.p90Col || "P90",
      color: "#10b981", // green-500
    },
  };

  const dimensions = calculateChartDimensions(processedData.length);

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">SageMaker Canvas Quantile Visualization</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload CSV files from Amazon SageMaker Canvas containing quantile forecast data (P10, P50, P90) 
                to create interactive visualizations. The system automatically detects your data columns and 
                generates professional charts that can be exported as SVG files.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>P10: 10th percentile (lower bound)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>P50: 50th percentile (median)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>P90: 90th percentile (upper bound)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-canvas-upload">
            <Upload className="h-4 w-4" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2" data-testid="tab-canvas-visualization">
            <BarChart3 className="h-4 w-4" />
            Quantile Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* File Upload Area */}
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div
                className={`min-h-[200px] flex flex-col items-center justify-center space-y-4 text-center ${
                  dragActive ? 'bg-primary/5 border-primary' : ''
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadState.step === 'select' ? (
                  <>
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Upload SageMaker Canvas CSV</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) handleFileSelection(selectedFile);
                        }}
                        className="hidden"
                        id="file-upload-canvas"
                        data-testid="input-file-canvas"
                      />
                      <Button 
                        onClick={() => document.getElementById('file-upload-canvas')?.click()}
                        className="gap-2"
                        data-testid="button-browse-canvas"
                      >
                        <Upload className="h-4 w-4" />
                        Browse Files
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        CSV files up to 50MB | Requires P10, P50, P90 columns
                      </p>
                    </div>
                  </>
                ) : uploadState.step === 'preview' ? (
                  <>
                    <div className="text-center space-y-4">
                      <div className="animate-pulse">
                        <FileText className="h-16 w-16 text-primary mx-auto" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Processing CSV File</h3>
                        <p className="text-muted-foreground">Analyzing columns and detecting quantile data...</p>
                        <div className="mt-4">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadState.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{uploadState.progress}% complete</p>
                        </div>
                      </div>
                    </div>
                    {columnDetection && (
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          {columnDetection.success ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          Column Detection Results
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">{columnDetection.message}</p>
                        {columnDetection.success && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {columnDetection.dateCol && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                <span>Date: {columnDetection.dateCol}</span>
                              </div>
                            )}
                            {columnDetection.p10Col && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span>P10: {columnDetection.p10Col}</span>
                              </div>
                            )}
                            {columnDetection.p50Col && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span>P50: {columnDetection.p50Col}</span>
                              </div>
                            )}
                            {columnDetection.p90Col && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>P90: {columnDetection.p90Col}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Check className="h-16 w-16 text-green-500" />
                    <div>
                      <h3 className="text-xl font-semibold text-green-700">CSV Processed Successfully!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your quantile data has been processed and is ready for visualization.
                      </p>
                      <Button onClick={resetForm} variant="outline" data-testid="button-upload-another">
                        Upload Another File
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          {processedData.length > 0 ? (
            <>
              {/* Chart Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      P10 / P50 / P90 (All rows from CSV)
                    </div>
                    <Button
                      onClick={exportSVG}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      data-testid="button-export-svg"
                    >
                      <Download className="h-4 w-4" />
                      Export SVG
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Chart */}
                  <div ref={chartRef} className="w-full">
                    <ResponsiveContainer 
                      width="100%" 
                      height={Math.max(360, dimensions.height)}
                    >
                      <LineChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        {columnDetection?.p10Col && (
                          <Line 
                            type="monotone" 
                            dataKey="p10" 
                            stroke={chartConfig.p10.color} 
                            name={chartConfig.p10.label}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        )}
                        {columnDetection?.p50Col && (
                          <Line 
                            type="monotone" 
                            dataKey="p50" 
                            stroke={chartConfig.p50.color} 
                            name={chartConfig.p50.label}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        )}
                        {columnDetection?.p90Col && (
                          <Line 
                            type="monotone" 
                            dataKey="p90" 
                            stroke={chartConfig.p90.color} 
                            name={chartConfig.p90.label}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Statistics */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{processedData.length}</div>
                      <div className="text-sm text-muted-foreground">Data Points</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {columnDetection ? [columnDetection.p10Col, columnDetection.p50Col, columnDetection.p90Col].filter(Boolean).length : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Quantile Columns</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{file?.name?.substring(0, 20) || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Source File</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Visualization Data</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a CSV file with quantile data (P10, P50, P90) to create visualizations.
                </p>
                <Button 
                  onClick={() => setActiveTab('upload')}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV File
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
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
  const [showSageMakerCanvas, setShowSageMakerCanvas] = useState(false);

  // Check for SageMaker Canvas redirect from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canvas') === 'true') {
      setShowSageMakerCanvas(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  
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
      
      <div className="flex-1 ml-64 p-8" data-testid="anomaly-detection-main">
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
          <Tabs defaultValue={showSageMakerCanvas ? "sagemaker-canvas" : "uploads"} className="space-y-4" role="tablist" aria-label="Anomaly detection content sections">
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
              <TabsTrigger 
                value="sagemaker-canvas" 
                data-testid="tab-sagemaker-canvas"
                role="tab"
                aria-controls="sagemaker-canvas-panel"
              >
                SageMaker Canvas
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

            <TabsContent 
              value="sagemaker-canvas" 
              className="space-y-4"
              role="tabpanel"
              id="sagemaker-canvas-panel"
              aria-labelledby="tab-sagemaker-canvas"
            >
              <SageMakerCanvasVisualizor />
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
      </div>
    </div>
  );
}