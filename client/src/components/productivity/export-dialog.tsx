import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileText, Table, File, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExportDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportOptions {
  format: "csv" | "excel" | "pdf" | "json";
  includeCompleted: boolean;
  includeArchived: boolean;
  includeColumns: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export function ExportDialog({ boardId, open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "excel" | "pdf" | "json">("csv");
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "title", "status", "priority", "assignedTo", "dueDate"
  ]);

  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await fetch(`/api/productivity/boards/${boardId}/export?format=${options.format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export.${options.format}`;

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { filename };
    },
    onSuccess: (data) => {
      toast({ title: "Export successful", description: `Downloaded ${data.filename}` });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    },
  });

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      includeCompleted,
      includeArchived,
      includeColumns: selectedColumns,
    };

    exportMutation.mutate(options);
  };

  const formatOptions = [
    {
      value: "csv" as const,
      label: "CSV",
      description: "Comma-separated values, ideal for spreadsheets",
      icon: Table,
      recommended: true,
    },
    {
      value: "excel" as const,
      label: "Excel",
      description: "Microsoft Excel format with formatting",
      icon: FileText,
      recommended: false,
    },
    {
      value: "pdf" as const,
      label: "PDF",
      description: "Formatted document for reports and printing",
      icon: File,
      recommended: false,
    },
    {
      value: "json" as const,
      label: "JSON",
      description: "Raw data format for developers",
      icon: FileText,
      recommended: false,
    },
  ];

  const availableColumns = [
    { id: "title", label: "Title", essential: true },
    { id: "status", label: "Status", essential: true },
    { id: "priority", label: "Priority", essential: false },
    { id: "assignedTo", label: "Assigned To", essential: false },
    { id: "createdBy", label: "Created By", essential: false },
    { id: "dueDate", label: "Due Date", essential: false },
    { id: "completedAt", label: "Completed Date", essential: false },
    { id: "estimatedHours", label: "Estimated Hours", essential: false },
    { id: "actualHours", label: "Actual Hours", essential: false },
    { id: "tags", label: "Tags", essential: false },
    { id: "createdAt", label: "Created Date", essential: false },
    { id: "updatedAt", label: "Updated Date", essential: false },
  ];

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnId]);
    } else {
      setSelectedColumns(selectedColumns.filter(id => id !== columnId));
    }
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(availableColumns.map(col => col.id));
  };

  const handleSelectEssentialColumns = () => {
    setSelectedColumns(availableColumns.filter(col => col.essential).map(col => col.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle data-testid="export-dialog-title">Export Board Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
                <div className="grid grid-cols-1 gap-3">
                  {formatOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={option.value} id={option.value} data-testid={`format-${option.value}`} />
                      <Label htmlFor={option.value} className="flex items-center space-x-3 flex-1 cursor-pointer">
                        <option.icon className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.label}</span>
                            {option.recommended && (
                              <Badge variant="secondary" className="text-xs">Recommended</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Filter Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCompleted"
                  checked={includeCompleted}
                  onCheckedChange={setIncludeCompleted}
                  data-testid="checkbox-include-completed"
                />
                <Label htmlFor="includeCompleted">Include completed items</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeArchived"
                  checked={includeArchived}
                  onCheckedChange={setIncludeArchived}
                  data-testid="checkbox-include-archived"
                />
                <Label htmlFor="includeArchived">Include archived items</Label>
              </div>
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Columns</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectEssentialColumns}
                    data-testid="button-select-essential"
                  >
                    Essential Only
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllColumns}
                    data-testid="button-select-all"
                  >
                    Select All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={(checked) => handleColumnToggle(column.id, !!checked)}
                      data-testid={`column-${column.id}`}
                    />
                    <Label htmlFor={column.id} className="flex items-center space-x-2 cursor-pointer">
                      <span>{column.label}</span>
                      {column.essential && (
                        <Badge variant="outline" className="text-xs">Essential</Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedColumns.length} columns
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Format:</span>
                  <span className="font-medium uppercase">{format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Columns:</span>
                  <span className="font-medium">{selectedColumns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Include completed:</span>
                  <span className="font-medium">{includeCompleted ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Include archived:</span>
                  <span className="font-medium">{includeArchived ? "Yes" : "No"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={exportMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={exportMutation.isPending || selectedColumns.length === 0}
              data-testid="button-export"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}