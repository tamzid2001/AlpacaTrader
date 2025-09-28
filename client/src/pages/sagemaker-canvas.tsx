import { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Activity,
  Eye,
  TableIcon,
  ChartArea
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
  Tooltip,
  Legend,
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
  // Enhanced auto-sizing with better spacing
  const baseWidth = Math.max(24, Math.min(400, 0.50 * dataLength));
  const height = 8; // Increased height for better visibility
  
  return {
    width: baseWidth * 25, // Increased multiplier for better spacing
    height: height * 65, // Increased for better visibility
    pointSpacing: Math.max(50, baseWidth * 25 / dataLength) // Dynamic point spacing
  };
}

function calculateSummaryStatistics(data: QuantileData[], detection: ColumnDetectionResult) {
  const stats: any = {
    p10: { min: Infinity, max: -Infinity, avg: 0, count: 0 },
    p50: { min: Infinity, max: -Infinity, avg: 0, count: 0 },
    p90: { min: Infinity, max: -Infinity, avg: 0, count: 0 },
  };

  data.forEach(row => {
    if (detection.p10Col && row.p10 !== undefined && !isNaN(row.p10)) {
      stats.p10.min = Math.min(stats.p10.min, row.p10);
      stats.p10.max = Math.max(stats.p10.max, row.p10);
      stats.p10.avg += row.p10;
      stats.p10.count++;
    }
    if (detection.p50Col && row.p50 !== undefined && !isNaN(row.p50)) {
      stats.p50.min = Math.min(stats.p50.min, row.p50);
      stats.p50.max = Math.max(stats.p50.max, row.p50);
      stats.p50.avg += row.p50;
      stats.p50.count++;
    }
    if (detection.p90Col && row.p90 !== undefined && !isNaN(row.p90)) {
      stats.p90.min = Math.min(stats.p90.min, row.p90);
      stats.p90.max = Math.max(stats.p90.max, row.p90);
      stats.p90.avg += row.p90;
      stats.p90.count++;
    }
  });

  // Calculate averages
  Object.keys(stats).forEach(key => {
    if (stats[key].count > 0) {
      stats[key].avg /= stats[key].count;
    } else {
      stats[key] = null;
    }
  });

  return stats;
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
  const [showDataPreview, setShowDataPreview] = useState(false);
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
      
      // Set proper dimensions and viewBox
      const bbox = svgElement.getBBox();
      const padding = 40;
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2 * padding} ${bbox.height + 2 * padding}`);
      clonedSvg.setAttribute('width', String(bbox.width + 2 * padding));
      clonedSvg.setAttribute('height', String(bbox.height + 2 * padding + 60)); // Extra space for title
      
      // Add professional title with better styling
      const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      titleGroup.setAttribute('transform', `translate(${bbox.x + bbox.width / 2}, ${bbox.y - 20})`);
      
      const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleElement.setAttribute('text-anchor', 'middle');
      titleElement.setAttribute('font-size', '18');
      titleElement.setAttribute('font-weight', 'bold');
      titleElement.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      titleElement.setAttribute('fill', '#1a1a1a');
      titleElement.textContent = 'P10 / P50 / P90 Quantile Analysis';
      titleGroup.appendChild(titleElement);
      
      // Add subtitle with date range
      const subtitleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subtitleElement.setAttribute('text-anchor', 'middle');
      subtitleElement.setAttribute('y', '20');
      subtitleElement.setAttribute('font-size', '14');
      subtitleElement.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      subtitleElement.setAttribute('fill', '#666666');
      const dateRange = processedData.length > 0 && columnDetection?.dateCol 
        ? `${processedData[0].date} to ${processedData[processedData.length - 1].date}`
        : `${processedData.length} data points`;
      subtitleElement.textContent = dateRange;
      titleGroup.appendChild(subtitleElement);
      
      clonedSvg.insertBefore(titleGroup, clonedSvg.firstChild);
      
      // Add CSS styles for better export quality
      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = `
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          stroke: #e5e5e5;
          stroke-dasharray: 3 3;
        }
        .recharts-text {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .recharts-line {
          stroke-width: 2;
        }
        .recharts-dot {
          r: 4;
        }
      `;
      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
      
      // Add background
      const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      background.setAttribute('width', '100%');
      background.setAttribute('height', '100%');
      background.setAttribute('fill', 'white');
      clonedSvg.insertBefore(background, clonedSvg.firstChild);

      // Serialize SVG with proper XML declaration
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(clonedSvg);
      
      // Add XML declaration for better compatibility
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      
      // Create and download file
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
        description: "High-quality chart has been downloaded as SVG file.",
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
  const summaryStats = useMemo(() => {
    if (processedData.length > 0 && columnDetection) {
      return calculateSummaryStatistics(processedData, columnDetection);
    }
    return null;
  }, [processedData, columnDetection]);

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
            <Upload className="h-4 w-4" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex items-center gap-2" 
            disabled={!csvData}
            data-testid="tab-preview"
          >
            <TableIcon className="h-4 w-4" />
            Data Preview
          </TabsTrigger>
          <TabsTrigger 
            value="visualization" 
            className="flex items-center gap-2" 
            disabled={!columnDetection?.success}
            data-testid="tab-visualization"
          >
            <ChartArea className="h-4 w-4" />
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
                <div className="flex gap-2">
                  {csvData && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('preview')}
                      data-testid="button-view-preview"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Data
                    </Button>
                  )}
                  {columnDetection?.success && (
                    <Button
                      onClick={() => setActiveTab('visualization')}
                      data-testid="button-view-visualization"
                    >
                      View Visualization
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {csvData && columnDetection ? (
            <>
              {/* Data Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-5 w-5" />
                      Data Preview
                    </div>
                    <Badge variant="outline">
                      {csvData.length} rows × {columnDetection.allColumns.length} columns
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] w-full border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background border-b">
                        <TableRow>
                          <TableHead className="w-[50px] font-bold">#</TableHead>
                          {columnDetection.allColumns.map((col, index) => (
                            <TableHead 
                              key={index} 
                              className={`min-w-[120px] font-bold ${
                                col === columnDetection.dateCol ? 'bg-blue-50 dark:bg-blue-950' :
                                col === columnDetection.p10Col ? 'bg-red-50 dark:bg-red-950' :
                                col === columnDetection.p50Col ? 'bg-blue-50 dark:bg-blue-950' :
                                col === columnDetection.p90Col ? 'bg-green-50 dark:bg-green-950' : ''
                              }`}
                            >
                              <div className="flex flex-col gap-1">
                                <span>{col}</span>
                                {col === columnDetection.dateCol && <Badge variant="outline" className="text-xs">Date</Badge>}
                                {col === columnDetection.p10Col && <Badge variant="outline" className="text-xs">P10</Badge>}
                                {col === columnDetection.p50Col && <Badge variant="outline" className="text-xs">P50</Badge>}
                                {col === columnDetection.p90Col && <Badge variant="outline" className="text-xs">P90</Badge>}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 100).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {rowIndex + 1}
                            </TableCell>
                            {columnDetection.allColumns.map((col, colIndex) => (
                              <TableCell 
                                key={colIndex}
                                className={`font-mono text-sm ${
                                  col === columnDetection.dateCol ? 'bg-blue-50/50 dark:bg-blue-950/50' :
                                  col === columnDetection.p10Col ? 'bg-red-50/50 dark:bg-red-950/50' :
                                  col === columnDetection.p50Col ? 'bg-blue-50/50 dark:bg-blue-950/50' :
                                  col === columnDetection.p90Col ? 'bg-green-50/50 dark:bg-green-950/50' : ''
                                }`}
                              >
                                {row[col] || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {csvData.length > 100 && (
                          <TableRow>
                            <TableCell 
                              colSpan={columnDetection.allColumns.length + 1} 
                              className="text-center text-muted-foreground py-4"
                            >
                              Showing first 100 rows of {csvData.length} total rows
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              {summaryStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Summary Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {summaryStats.p10 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            P10 Statistics
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Min:</span>
                              <span className="font-mono">{summaryStats.p10.min.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max:</span>
                              <span className="font-mono">{summaryStats.p10.max.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg:</span>
                              <span className="font-mono">{summaryStats.p10.avg.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Count:</span>
                              <span className="font-mono">{summaryStats.p10.count}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {summaryStats.p50 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            P50 Statistics
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Min:</span>
                              <span className="font-mono">{summaryStats.p50.min.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max:</span>
                              <span className="font-mono">{summaryStats.p50.max.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg:</span>
                              <span className="font-mono">{summaryStats.p50.avg.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Count:</span>
                              <span className="font-mono">{summaryStats.p50.count}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {summaryStats.p90 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            P90 Statistics
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Min:</span>
                              <span className="font-mono">{summaryStats.p90.min.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max:</span>
                              <span className="font-mono">{summaryStats.p90.max.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg:</span>
                              <span className="font-mono">{summaryStats.p90.avg.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Count:</span>
                              <span className="font-mono">{summaryStats.p90.count}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <TableIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No data to preview</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please upload a CSV file first to view the data.
                </p>
                <Button onClick={() => setActiveTab('upload')} variant="outline">
                  Upload CSV File
                </Button>
              </CardContent>
            </Card>
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
                        minHeight: Math.max(420, dimensions.height),
                        maxHeight: 700 
                      }}
                    >
                      <LineChart
                        data={processedData}
                        margin={{
                          top: 30,
                          right: 60,
                          left: 40,
                          bottom: 100,
                        }}
                      >
                        <defs>
                          <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.2}
                          horizontal={true}
                          vertical={true}
                          stroke="#e5e5e5"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#666' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={Math.max(0, Math.floor(processedData.length / 15))}
                          tickMargin={10}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#666' }}
                          domain={['auto', 'auto']}
                          tickMargin={10}
                          label={{ 
                            value: 'Value', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fontSize: 12, fill: '#666' }
                          }}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          cursor={{ strokeDasharray: '5 5' }}
                        />
                        <ChartLegend
                          content={<ChartLegendContent />}
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        
                        {columnDetection?.p10Col && (
                          <Line
                            type="monotone"
                            dataKey="p10"
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 1, fill: '#ef4444' }}
                            connectNulls={false}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        )}
                        {columnDetection?.p50Col && (
                          <Line
                            type="monotone"
                            dataKey="p50"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 1, fill: '#3b82f6' }}
                            connectNulls={false}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                          />
                        )}
                        {columnDetection?.p90Col && (
                          <Line
                            type="monotone"
                            dataKey="p90"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 1, fill: '#10b981' }}
                            connectNulls={false}
                            activeDot={{ r: 6, strokeWidth: 2 }}
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