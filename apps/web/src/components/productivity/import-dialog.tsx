import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Table, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  itemsCreated: number;
  itemsUpdated: number;
  errors: string[];
}

export function ImportDialog({ boardId, open, onOpenChange }: ImportDialogProps) {
  const [format, setFormat] = useState<"csv" | "excel" | "json">("csv");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async ({ file, format }: { file: File; format: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await fetch(`/api/productivity/boards/${boardId}/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
      
      if (data.errors.length === 0) {
        toast({ 
          title: "Import successful", 
          description: `Created ${data.itemsCreated} items, updated ${data.itemsUpdated} items` 
        });
      } else {
        toast({ 
          title: "Import completed with warnings", 
          description: `${data.errors.length} errors occurred`,
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = {
      csv: ['text/csv', 'application/csv'],
      excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      json: ['application/json'],
    };

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const expectedTypes = allowedTypes[format];

    if (!expectedTypes.includes(selectedFile.type) && 
        !['csv', 'xlsx', 'xls', 'json'].includes(fileExtension || '')) {
      toast({ 
        title: "Invalid file type", 
        description: `Please select a ${format.toUpperCase()} file`,
        variant: "destructive" 
      });
      return;
    }

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please select a file smaller than 10MB",
        variant: "destructive" 
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    importMutation.mutate({ file, format });
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setFormat("csv");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatOptions = [
    {
      value: "csv" as const,
      label: "CSV",
      description: "Comma-separated values file",
      icon: Table,
      sample: "title,status,priority,due_date\nTask 1,in_progress,high,2024-01-15",
    },
    {
      value: "excel" as const,
      label: "Excel",
      description: "Microsoft Excel file (.xlsx)",
      icon: FileText,
      sample: "Excel file with headers: title, status, priority, due_date",
    },
    {
      value: "json" as const,
      label: "JSON",
      description: "JavaScript Object Notation file",
      icon: FileText,
      sample: '[{"title": "Task 1", "status": "in_progress", "priority": "high"}]',
    },
  ];

  const selectedFormatOption = formatOptions.find(opt => opt.value === format)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="import-dialog">
        <DialogHeader>
          <DialogTitle data-testid="import-dialog-title">Import Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Result */}
          {importResult && (
            <Alert className={importResult.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Import completed</div>
                  <div className="text-sm space-y-1">
                    <div>✅ Created: {importResult.itemsCreated} items</div>
                    <div>🔄 Updated: {importResult.itemsUpdated} items</div>
                    {importResult.errors.length > 0 && (
                      <div className="text-red-600">
                        ⚠️ Errors: {importResult.errors.length}
                        <ul className="mt-1 list-disc list-inside text-xs">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>... and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                    data-testid="button-import-another"
                  >
                    Import Another File
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!importResult && (
            <>
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
                    <div className="space-y-3">
                      {formatOptions.map((option) => (
                        <div key={option.value} className="flex items-start space-x-3">
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" data-testid={`format-${option.value}`} />
                          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <option.icon className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <p className="text-sm text-gray-500">{option.description}</p>
                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block">
                                  {option.sample}
                                </code>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-950" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    data-testid="file-drop-zone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={format === 'csv' ? '.csv' : format === 'excel' ? '.xlsx,.xls' : '.json'}
                      onChange={handleFileInput}
                      data-testid="file-input"
                    />
                    
                    {file ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                        <div className="font-medium text-green-700 dark:text-green-400">
                          {file.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFile(null)}
                          data-testid="button-remove-file"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <div className="font-medium text-gray-700 dark:text-gray-300">
                          Drop your {selectedFormatOption.label} file here
                        </div>
                        <div className="text-sm text-gray-500">
                          or click to browse
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-browse-file"
                        >
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Format Requirements */}
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-medium">Required columns for {selectedFormatOption.label}:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>• title (required)</div>
                          <div>• status (optional)</div>
                          <div>• priority (optional)</div>
                          <div>• assigned_to (optional)</div>
                          <div>• due_date (optional)</div>
                          <div>• tags (optional)</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Maximum file size: 10MB. Date format: YYYY-MM-DD
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          )}

          {/* Import Progress */}
          {importMutation.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Importing data...</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                  <p className="text-sm text-gray-500">
                    Processing your file. This may take a few moments.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!importResult && (
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={importMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!file || importMutation.isPending}
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}