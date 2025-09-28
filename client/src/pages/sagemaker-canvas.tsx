import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Check, 
  AlertTriangle, 
  BarChart3,
  Download,
  Info,
  FileSpreadsheet,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

// Types for SageMaker Canvas data
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

interface UploadState {
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
      ? `Found ${foundQuantiles.length} quantile columns` 
      : 'Insufficient quantile columns found (need at least 2 of P10/P50/P90)'
  };
}

function processQuantileData(csvData: any[], detection: ColumnDetectionResult): QuantileData[] {
  if (!detection.success || !csvData) return [];

  let processedData = csvData.map((row, index) => {
    const processed: QuantileData = {
      date: detection.dateCol ? row[detection.dateCol] : `Row ${index + 1}`,
    };

    // Add quantile values if columns exist
    if (detection.p10Col && row[detection.p10Col] !== undefined && row[detection.p10Col] !== null && row[detection.p10Col] !== '') {
      processed.p10 = parseFloat(row[detection.p10Col]);
    }
    if (detection.p50Col && row[detection.p50Col] !== undefined && row[detection.p50Col] !== null && row[detection.p50Col] !== '') {
      processed.p50 = parseFloat(row[detection.p50Col]);
    }
    if (detection.p90Col && row[detection.p90Col] !== undefined && row[detection.p90Col] !== null && row[detection.p90Col] !== '') {
      processed.p90 = parseFloat(row[detection.p90Col]);
    }

    return processed;
  });

  // Drop rows with all NaN quantile values
  processedData = processedData.filter(row => 
    !isNaN(row.p10 || NaN) || !isNaN(row.p50 || NaN) || !isNaN(row.p90 || NaN)
  );

  // Sort by date if date column exists and is parseable
  if (detection.dateCol) {
    processedData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
  }

  return processedData;
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

export default function SageMakerCanvasPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [columnDetection, setColumnDetection] = useState<ColumnDetectionResult | null>(null);
  const [processedData, setProcessedData] = useState<QuantileData[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({ step: 'select', progress: 0 });
  const [activeTab, setActiveTab] = useState('upload');
  const chartRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

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

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <Card data-testid="card-auth-required">
          <CardContent className="py-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please log in to use the SageMaker Canvas visualizer.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-orange-600" />
          <h1 className="text-3xl font-bold">SageMaker Canvas Quantile Visualizer</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          P10 / P50 / P90 Analysis
        </Badge>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">About SageMaker Canvas Quantile Visualization</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload CSV files from Amazon SageMaker Canvas containing quantile forecast data (P10, P50, P90) 
                to generate professional visualizations with SVG export capabilities.
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
          <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
            <Upload className="h-4 w-4" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger 
            value="visualization" 
            className="flex items-center gap-2" 
            disabled={!columnDetection?.success}
            data-testid="tab-visualization"
          >
            <BarChart3 className="h-4 w-4" />
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {uploadState.step === 'select' && (
            <Card data-testid="card-file-selection">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload SageMaker Canvas CSV
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
                  data-testid="dropzone-sagemaker-csv"
                >
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    Drop your SageMaker Canvas CSV here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports CSV files with P10/P50/P90 quantile columns (max 50MB)
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                    className="hidden"
                    id="sagemaker-csv-file-input"
                    data-testid="input-sagemaker-csv-file"
                  />
                  <label htmlFor="sagemaker-csv-file-input">
                    <Button variant="outline" asChild data-testid="button-browse-sagemaker-files">
                      <span style={{ cursor: 'pointer' }}>Browse Files</span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {(uploadState.step === 'preview' || uploadState.step === 'visualize') && file && columnDetection && (
            <div className="space-y-6">
              {/* File Info */}
              <Card data-testid="card-file-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label>Filename</Label>
                      <p className="font-mono">{file.name}</p>
                    </div>
                    <div>
                      <Label>File Size</Label>
                      <p>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div>
                      <Label>Data Points</Label>
                      <p>{csvData?.length || 0} rows</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Detection Results */}
              <Card data-testid="card-column-detection">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Column Detection Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className={columnDetection.success ? "border-green-200" : "border-red-200"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {columnDetection.message}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Detected Columns</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={columnDetection.dateCol ? "default" : "secondary"}>
                            Date: {columnDetection.dateCol || "Not found"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={columnDetection.p10Col ? "default" : "secondary"}>
                            P10: {columnDetection.p10Col || "Not found"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={columnDetection.p50Col ? "default" : "secondary"}>
                            P50: {columnDetection.p50Col || "Not found"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={columnDetection.p90Col ? "default" : "secondary"}>
                            P90: {columnDetection.p90Col || "Not found"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>All Available Columns</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {columnDetection.allColumns.map((col, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {uploadState.step === 'visualize' && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 dark:text-green-200">
                        Data processed successfully! {processedData.length} data points ready for visualization.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  data-testid="button-reset-upload"
                >
                  Upload New File
                </Button>
                {columnDetection.success && (
                  <Button
                    onClick={() => setActiveTab('visualization')}
                    data-testid="button-view-visualization"
                  >
                    View Visualization
                  </Button>
                )}
              </div>
            </div>
          )}
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
                    <ChartContainer
                      config={chartConfig}
                      className="w-full"
                      style={{ 
                        minHeight: Math.max(360, dimensions.height),
                        maxHeight: 600 
                      }}
                    >
                      <LineChart
                        data={processedData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.3}
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={Math.max(0, Math.floor(processedData.length / 10))}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          domain={['auto', 'auto']}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <ChartLegend
                          content={<ChartLegendContent />}
                        />
                        
                        {columnDetection?.p10Col && (
                          <Line
                            type="monotone"
                            dataKey="p10"
                            stroke="var(--color-p10)"
                            strokeWidth={1}
                            dot={{ r: 3, strokeWidth: 1 }}
                            connectNulls={false}
                          />
                        )}
                        {columnDetection?.p50Col && (
                          <Line
                            type="monotone"
                            dataKey="p50"
                            stroke="var(--color-p50)"
                            strokeWidth={1}
                            dot={{ r: 3, strokeWidth: 1 }}
                            connectNulls={false}
                          />
                        )}
                        {columnDetection?.p90Col && (
                          <Line
                            type="monotone"
                            dataKey="p90"
                            stroke="var(--color-p90)"
                            strokeWidth={1}
                            dot={{ r: 3, strokeWidth: 1 }}
                            connectNulls={false}
                          />
                        )}
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Chart Statistics */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-3">Chart Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label>Data Points</Label>
                        <p className="font-mono">{processedData.length}</p>
                      </div>
                      <div>
                        <Label>Chart Width</Label>
                        <p className="font-mono">{dimensions.width}px</p>
                      </div>
                      <div>
                        <Label>Date Range</Label>
                        <p className="font-mono text-xs">
                          {processedData.length > 0 && columnDetection?.dateCol ? (
                            `${processedData[0].date} to ${processedData[processedData.length - 1].date}`
                          ) : (
                            'N/A'
                          )}
                        </p>
                      </div>
                      <div>
                        <Label>Quantiles</Label>
                        <p className="font-mono">
                          {[columnDetection?.p10Col, columnDetection?.p50Col, columnDetection?.p90Col]
                            .filter(Boolean).length}/3
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No visualization available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please upload a CSV file with quantile data first.
                </p>
                <Button onClick={() => setActiveTab('upload')} variant="outline">
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