import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Info, FileText, BarChart, Database, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hash } from "lucide-react";
import { 
  parseCsvFile, 
  validateCsvForSageMaker, 
  type CsvValidationResult 
} from "@/lib/firebase-storage";

interface CsvPreviewProps {
  file: File;
  onValidation?: (isValid: boolean, result: CsvValidationResult) => void;
}

interface CsvStats {
  rowCount: number;
  columnCount: number;
  fileSize: string;
  percentileColumns: string[];
  hasDateColumn: boolean;
  estimatedProcessingTime: string;
}

interface ColumnStats {
  name: string;
  type: 'numeric' | 'text' | 'date' | 'mixed';
  uniqueValues: number;
  nullCount: number;
  fillRate: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  mode?: string | number;
  sampleValues: any[];
}

export function CsvPreview({ file, onValidation }: CsvPreviewProps) {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [stats, setStats] = useState<CsvStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);

  useEffect(() => {
    parseAndValidateCsv();
  }, [file]);

  const parseAndValidateCsv = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse CSV file
      const data = await parseCsvFile(file);
      setCsvData(data);

      // Validate for SageMaker compatibility
      const validation = validateCsvForSageMaker(data);
      setValidationResult(validation);

      // Calculate stats
      const headers = data.length > 0 ? Object.keys(data[0]).filter(h => h !== '_rowIndex') : [];
      const stats: CsvStats = {
        rowCount: data.length,
        columnCount: headers.length,
        fileSize: formatFileSize(file.size),
        percentileColumns: validation.percentileColumns,
        hasDateColumn: headers.some(h => 
          h.toLowerCase().includes('date') || 
          h.toLowerCase().includes('time') || 
          h.toLowerCase().includes('timestamp')
        ),
        estimatedProcessingTime: estimateProcessingTime(data.length),
      };
      setStats(stats);

      // Calculate column statistics
      const colStats = calculateColumnStats(data, headers);
      setColumnStats(colStats);

      // Notify parent component
      onValidation?.(validation.isValid, validation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateColumnStats = (data: any[], headers: string[]): ColumnStats[] => {
    return headers.map(header => {
      const values = data.map(row => row[header]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(nonNullValues);
      
      // Determine column type
      let type: 'numeric' | 'text' | 'date' | 'mixed' = 'text';
      const numericValues = nonNullValues.filter(v => !isNaN(Number(v)));
      const dateValues = nonNullValues.filter(v => {
        const date = new Date(v);
        return date instanceof Date && !isNaN(date.getTime());
      });
      
      if (numericValues.length === nonNullValues.length && nonNullValues.length > 0) {
        type = 'numeric';
      } else if (dateValues.length === nonNullValues.length && nonNullValues.length > 0) {
        type = 'date';
      } else if (numericValues.length > 0 && numericValues.length < nonNullValues.length) {
        type = 'mixed';
      }
      
      const stats: ColumnStats = {
        name: header,
        type,
        uniqueValues: uniqueValues.size,
        nullCount: values.length - nonNullValues.length,
        fillRate: (nonNullValues.length / values.length) * 100,
        sampleValues: Array.from(uniqueValues).slice(0, 5)
      };
      
      // Calculate numeric statistics if applicable
      if (type === 'numeric' && numericValues.length > 0) {
        const nums = numericValues.map(Number).sort((a, b) => a - b);
        stats.min = Math.min(...nums);
        stats.max = Math.max(...nums);
        stats.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        stats.median = nums[Math.floor(nums.length / 2)];
      } else if (nonNullValues.length > 0) {
        // For text/mixed types, get min/max based on string comparison
        const sorted = nonNullValues.sort();
        stats.min = sorted[0];
        stats.max = sorted[sorted.length - 1];
        
        // Calculate mode (most frequent value)
        const frequency: Record<string, number> = {};
        nonNullValues.forEach(v => {
          const key = String(v);
          frequency[key] = (frequency[key] || 0) + 1;
        });
        const maxFreq = Math.max(...Object.values(frequency));
        stats.mode = Object.keys(frequency).find(k => frequency[k] === maxFreq);
      }
      
      return stats;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const estimateProcessingTime = (rows: number): string => {
    if (rows < 100) return "< 1 minute";
    if (rows < 1000) return "1-2 minutes";
    if (rows < 10000) return "2-5 minutes";
    return "5+ minutes";
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getValidationColor = (isValid: boolean) => {
    return isValid ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400";
  };

  if (loading) {
    return (
      <Card data-testid="card-csv-preview-loading">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Parsing CSV file...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="card-csv-preview-error">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to parse CSV: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!csvData || !validationResult || !stats) {
    return null;
  }

  const headers = Object.keys(csvData[0] || {}).filter(h => h !== '_rowIndex');
  
  // Pagination calculations
  const totalRows = csvData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = viewMode === 'preview' ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = viewMode === 'preview' ? 15 : Math.min(startIndex + rowsPerPage, totalRows);
  const displayData = csvData.slice(startIndex, endIndex);
  
  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'preview' ? 'full' : 'preview');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6" data-testid="container-csv-preview">
      {/* File Statistics */}
      <Card data-testid="card-csv-stats">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            File Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-row-count">
                {stats.rowCount.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-column-count">
                {stats.columnCount}
              </div>
              <div className="text-sm text-muted-foreground">Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-file-size">
                {stats.fileSize}
              </div>
              <div className="text-sm text-muted-foreground">File Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-processing-time">
                {stats.estimatedProcessingTime}
              </div>
              <div className="text-sm text-muted-foreground">Est. Processing</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card data-testid="card-csv-validation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getValidationIcon(validationResult.isValid)}
            <span className={getValidationColor(validationResult.isValid)}>
              SageMaker Compatibility
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Compatibility Score:</span>
            <Progress 
              value={validationResult.isValid ? 100 : validationResult.hasPercentileColumns ? 70 : 30} 
              className="flex-1"
              data-testid="progress-compatibility"
            />
            <Badge 
              variant={validationResult.isValid ? "default" : "secondary"}
              data-testid="badge-compatibility-status"
            >
              {validationResult.isValid ? "Ready" : "Needs Review"}
            </Badge>
          </div>

          {stats.percentileColumns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Percentile Columns Detected</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.percentileColumns.map((col) => (
                  <Badge key={col} variant="outline" data-testid={`badge-percentile-${col}`}>
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {stats.hasDateColumn && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Date/Time Column Detected</span>
            </div>
          )}

          {validationResult.issues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {validationResult.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span data-testid={`text-issue-${index}`}>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card data-testid="card-csv-data-preview">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data {viewMode === 'preview' ? 'Preview' : 'Full View'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
                className="flex items-center gap-2"
                data-testid="button-toggle-view"
              >
                {viewMode === 'preview' ? (
                  <><Eye className="h-4 w-4" /> Show Full Data</>
                ) : (
                  <><EyeOff className="h-4 w-4" /> Show Preview</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList>
              <TabsTrigger value="table" data-testid="tab-table-view">Table View</TabsTrigger>
              <TabsTrigger value="columns" data-testid="tab-columns-view">Column Info</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4 space-y-4">
              {/* Row count indicator */}
              <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground" data-testid="text-row-indicator">
                  {viewMode === 'preview' ? (
                    <>Showing first {Math.min(15, totalRows)} of {totalRows.toLocaleString()} total rows</>
                  ) : (
                    <>Showing {startIndex + 1}-{endIndex} of {totalRows.toLocaleString()} total rows</>
                  )}
                </div>
                {viewMode === 'full' && totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
                      <SelectTrigger className="w-20" data-testid="select-rows-per-page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Data table */}
              <ScrollArea className="h-[500px] w-full border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-16 sticky left-0 bg-background">#</TableHead>
                      {headers.map((header) => (
                        <TableHead key={header} className="min-w-[120px]" data-testid={`header-${header}`}>
                          <div className="flex items-center gap-1">
                            <span>{header}</span>
                            {stats.percentileColumns.includes(header) && (
                              <Badge variant="secondary" className="text-xs">P</Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.map((row, index) => (
                      <TableRow key={`${startIndex + index}`} data-testid={`row-${index}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground sticky left-0 bg-background">
                          {startIndex + index + 1}
                        </TableCell>
                        {headers.map((header) => (
                          <TableCell 
                            key={header} 
                            className="max-w-[300px]" 
                            data-testid={`cell-${index}-${header}`}
                            title={row[header] || '—'}
                          >
                            <div className="truncate">
                              {row[header] || '—'}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination controls */}
              {viewMode === 'full' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    data-testid="button-first-page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 mx-4">
                    <span className="text-sm">Page</span>
                    <Select 
                      value={String(currentPage)} 
                      onValueChange={(value) => handlePageChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20" data-testid="select-page-number">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(totalPages, 100) }, (_, i) => i + 1).map(page => (
                          <SelectItem key={page} value={String(page)}>
                            {page}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm">of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    data-testid="button-last-page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="columns" className="mt-4">
              <ScrollArea className="h-[600px] w-full">
                <div className="space-y-4">
                  {columnStats.map((colStat, index) => {
                    const isPercentile = stats.percentileColumns.includes(colStat.name);
                    const isDate = colStat.type === 'date';
                    
                    return (
                      <Card key={colStat.name} className="border" data-testid={`column-info-${colStat.name}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium">{colStat.name}</h4>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {colStat.type}
                              </Badge>
                              {isPercentile && (
                                <Badge variant="default" className="text-xs">Percentile</Badge>
                              )}
                              {isDate && (
                                <Badge variant="secondary" className="text-xs">Date/Time</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Unique Values</div>
                              <div className="font-medium" data-testid={`unique-${colStat.name}`}>
                                {colStat.uniqueValues.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Fill Rate</div>
                              <div className="font-medium" data-testid={`fillrate-${colStat.name}`}>
                                {colStat.fillRate.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Null Count</div>
                              <div className="font-medium" data-testid={`nullcount-${colStat.name}`}>
                                {colStat.nullCount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Data Type</div>
                              <div className="font-medium capitalize" data-testid={`type-${colStat.name}`}>
                                {colStat.type}
                              </div>
                            </div>
                          </div>
                          
                          {colStat.type === 'numeric' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 pt-3 border-t">
                              <div>
                                <div className="text-xs text-muted-foreground">Min</div>
                                <div className="font-medium" data-testid={`min-${colStat.name}`}>
                                  {typeof colStat.min === 'number' ? colStat.min.toLocaleString() : colStat.min}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Max</div>
                                <div className="font-medium" data-testid={`max-${colStat.name}`}>
                                  {typeof colStat.max === 'number' ? colStat.max.toLocaleString() : colStat.max}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Mean</div>
                                <div className="font-medium" data-testid={`mean-${colStat.name}`}>
                                  {colStat.mean ? colStat.mean.toFixed(2) : '—'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Median</div>
                                <div className="font-medium" data-testid={`median-${colStat.name}`}>
                                  {colStat.median ? colStat.median.toFixed(2) : '—'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {(colStat.type === 'text' || colStat.type === 'mixed') && colStat.mode && (
                            <div className="pt-3 border-t">
                              <div className="text-xs text-muted-foreground mb-1">Most Frequent Value</div>
                              <div className="font-medium truncate" data-testid={`mode-${colStat.name}`}>
                                {colStat.mode}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Sample Values</div>
                            <div className="flex flex-wrap gap-1">
                              {colStat.sampleValues.slice(0, 5).map((value, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="text-xs truncate max-w-[150px]"
                                  title={String(value)}
                                >
                                  {String(value)}
                                </Badge>
                              ))}
                              {colStat.uniqueValues > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(colStat.uniqueValues - 5).toLocaleString()} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CsvPreview;