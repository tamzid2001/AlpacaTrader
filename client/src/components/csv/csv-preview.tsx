import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Info, FileText, BarChart, Database } from "lucide-react";
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

export function CsvPreview({ file, onValidation }: CsvPreviewProps) {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [stats, setStats] = useState<CsvStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Notify parent component
      onValidation?.(validation.isValid, validation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const previewData = csvData.slice(0, 15);
  const headers = Object.keys(csvData[0] || {}).filter(h => h !== '_rowIndex');

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
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Preview (First 15 Rows)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList>
              <TabsTrigger value="table" data-testid="tab-table-view">Table View</TabsTrigger>
              <TabsTrigger value="columns" data-testid="tab-columns-view">Column Info</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              <ScrollArea className="h-[400px] w-full border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
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
                    {previewData.map((row, index) => (
                      <TableRow key={index} data-testid={`row-${index}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row._rowIndex}
                        </TableCell>
                        {headers.map((header) => (
                          <TableCell key={header} className="max-w-[200px] truncate" data-testid={`cell-${index}-${header}`}>
                            {row[header] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {csvData.length > 15 && (
                <div className="mt-2 text-sm text-muted-foreground text-center">
                  Showing 15 of {csvData.length.toLocaleString()} rows
                </div>
              )}
            </TabsContent>

            <TabsContent value="columns" className="mt-4">
              <div className="space-y-4">
                {headers.map((header, index) => {
                  const sampleValues = csvData.slice(0, 5).map(row => row[header]).filter(v => v);
                  const isPercentile = stats.percentileColumns.includes(header);
                  const isDate = header.toLowerCase().includes('date') || 
                               header.toLowerCase().includes('time') || 
                               header.toLowerCase().includes('timestamp');
                  
                  return (
                    <div key={header} className="border rounded-lg p-4" data-testid={`column-info-${header}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{header}</h4>
                        <div className="flex gap-1">
                          {isPercentile && (
                            <Badge variant="default" className="text-xs">Percentile</Badge>
                          )}
                          {isDate && (
                            <Badge variant="secondary" className="text-xs">Date/Time</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Sample values: {sampleValues.slice(0, 3).join(', ')}</div>
                        <div>Non-empty values: {csvData.filter(row => row[header]).length} / {csvData.length}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CsvPreview;