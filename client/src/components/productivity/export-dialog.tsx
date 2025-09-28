import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Download, FileText, Table, File, CheckCircle, Loader2, Calendar, Filter, Eye, 
  Edit3, BarChart3, Clock, Settings, RefreshCw, ArrowUpDown, TrendingUp, Users
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
    start: Date;
    end: Date;
    type: "created" | "updated" | "due" | "completed";
  };
  sortBy?: {
    field: string;
    direction: "asc" | "desc";
  };
  filters?: {
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    tags?: string[];
  };
  transformations?: {
    formatDates?: string;
    includeAggregations?: boolean;
    customMapping?: Record<string, string>;
  };
}

interface ExportPreviewData {
  items: any[];
  statistics: {
    totalItems: number;
    filteredItems: number;
    completedItems: number;
    overdueItems: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  columns: Array<{
    id: string;
    name: string;
    type: string;
    included: boolean;
  }>;
}

export function ExportDialog({ boardId, open, onOpenChange }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"options" | "preview" | "advanced">("options");
  const [format, setFormat] = useState<"csv" | "excel" | "pdf" | "json">("csv");
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "title", "status", "priority", "assignedTo", "dueDate"
  ]);
  
  // Date range controls
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<"created" | "updated" | "due" | "completed">("created");
  const [datePreset, setDatePreset] = useState<string>("");
  const [customDateRange, setCustomDateRange] = useState<{
    start?: Date;
    end?: Date;
  }>({});
  
  // Advanced options
  const [sortBy, setSortBy] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({ field: "createdAt", direction: "desc" });
  const [advancedFilters, setAdvancedFilters] = useState<{
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    tags?: string[];
  }>({});
  const [transformations, setTransformations] = useState<{
    formatDates?: string;
    includeAggregations?: boolean;
    customMapping?: Record<string, string>;
  }>({
    formatDates: "YYYY-MM-DD",
    includeAggregations: true
  });
  
  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ExportPreviewData | null>(null);
  const [editingItems, setEditingItems] = useState<Record<string, any>>({});

  const { toast } = useToast();

  // Date preset options
  const datePresets = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 3 months", value: "3m" },
    { label: "Last 6 months", value: "6m" },
    { label: "Last year", value: "1y" },
    { label: "All time", value: "all" },
    { label: "Custom range", value: "custom" }
  ];

  // Handle date preset selection
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case "7d":
        setCustomDateRange({
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        });
        break;
      case "30d":
        setCustomDateRange({
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        });
        break;
      case "3m":
        setCustomDateRange({
          start: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
          end: now
        });
        break;
      case "6m":
        setCustomDateRange({
          start: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
          end: now
        });
        break;
      case "1y":
        setCustomDateRange({
          start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          end: now
        });
        break;
      case "all":
        setCustomDateRange({});
        break;
      case "custom":
        // Keep current custom range
        break;
    }
  };

  // Fetch board data
  const { data: boardData } = useQuery({
    queryKey: ['/api/productivity/boards', boardId],
    enabled: !!boardId && open,
  });

  // Generate export options object
  const exportOptions = useMemo<ExportOptions>(() => {
    const options: ExportOptions = {
      format,
      includeCompleted,
      includeArchived,
      includeColumns: selectedColumns,
      sortBy,
      filters: advancedFilters,
      transformations
    };

    if (dateFilterEnabled && (customDateRange.start || customDateRange.end)) {
      options.dateRange = {
        start: customDateRange.start || new Date(0),
        end: customDateRange.end || new Date(),
        type: dateRangeType
      };
    }

    return options;
  }, [format, includeCompleted, includeArchived, selectedColumns, dateFilterEnabled, 
      customDateRange, dateRangeType, sortBy, advancedFilters, transformations]);

  // Load preview data
  const loadPreview = async () => {
    if (!boardId) return;
    
    setPreviewLoading(true);
    try {
      const response = await apiRequest(`/api/productivity/boards/${boardId}/export-preview`, {
        method: 'POST',
        body: JSON.stringify(exportOptions)
      });
      setPreviewData(response);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Load preview when options change (debounced)
  useEffect(() => {
    if (open && activeTab === "preview") {
      const timeoutId = setTimeout(() => {
        loadPreview();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [exportOptions, open, activeTab]);

  // Auto-refresh preview when switching to preview tab
  useEffect(() => {
    if (activeTab === "preview" && open) {
      loadPreview();
    }
  }, [activeTab, open]);

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await apiRequest(`/api/productivity/boards/${boardId}/export`, {
        method: 'POST',
        body: JSON.stringify(options)
      });

      // Create download
      const blob = new Blob([response.data], { 
        type: response.contentType || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { filename: response.filename };
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
    exportMutation.mutate(exportOptions);
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

  const sortableFields = [
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
    { value: "dueDate", label: "Due Date" },
    { value: "completedAt", label: "Completed Date" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
    { value: "title", label: "Title" },
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

  const handleItemEdit = (itemId: string, field: string, value: any) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col" data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle data-testid="export-dialog-title" className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Board Data
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="options" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
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

                  {/* Date Range Controls */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Date Window Controls
                        </CardTitle>
                        <Checkbox
                          checked={dateFilterEnabled}
                          onCheckedChange={setDateFilterEnabled}
                          data-testid="checkbox-enable-date-filter"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dateFilterEnabled && (
                        <>
                          {/* Date Type Selection */}
                          <div className="space-y-2">
                            <Label>Filter by date type</Label>
                            <Select value={dateRangeType} onValueChange={setDateRangeType}>
                              <SelectTrigger data-testid="select-date-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="created">Created Date</SelectItem>
                                <SelectItem value="updated">Last Updated</SelectItem>
                                <SelectItem value="due">Due Date</SelectItem>
                                <SelectItem value="completed">Completed Date</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Date Preset Selection */}
                          <div className="space-y-2">
                            <Label>Date Range Preset</Label>
                            <Select value={datePreset} onValueChange={handleDatePresetChange}>
                              <SelectTrigger data-testid="select-date-preset">
                                <SelectValue placeholder="Select a preset or custom range" />
                              </SelectTrigger>
                              <SelectContent>
                                {datePresets.map((preset) => (
                                  <SelectItem key={preset.value} value={preset.value}>
                                    {preset.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom Date Range */}
                          {(datePreset === "custom" || customDateRange.start || customDateRange.end) && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      className="w-full justify-start text-left font-normal"
                                      data-testid="button-start-date"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {customDateRange.start ? format(customDateRange.start, "PPP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={customDateRange.start}
                                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      className="w-full justify-start text-left font-normal"
                                      data-testid="button-end-date"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {customDateRange.end ? format(customDateRange.end, "PPP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={customDateRange.end}
                                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Basic Filter Options */}
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
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Export Preview
                  </h3>
                  <Button
                    onClick={loadPreview}
                    disabled={previewLoading}
                    variant="outline"
                    size="sm"
                    data-testid="button-refresh-preview"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${previewLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {previewLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600">Loading preview...</p>
                    </div>
                  </div>
                ) : previewData ? (
                  <div className="flex-1 space-y-4 overflow-hidden">
                    {/* Statistics */}
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold">{previewData.statistics.filteredItems}</div>
                          <p className="text-xs text-muted-foreground">Items to export</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold">{previewData.statistics.completedItems}</div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold">{previewData.statistics.overdueItems}</div>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold">{selectedColumns.length}</div>
                          <p className="text-xs text-muted-foreground">Columns</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Preview */}
                    <Card className="flex-1 overflow-hidden">
                      <CardHeader>
                        <CardTitle>Data Preview (First 10 rows)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-64">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  {selectedColumns.map(columnId => (
                                    <th key={columnId} className="px-4 py-2 text-left font-medium">
                                      {availableColumns.find(col => col.id === columnId)?.label || columnId}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {previewData.items.slice(0, 10).map((item, index) => (
                                  <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {selectedColumns.map(columnId => (
                                      <td key={columnId} className="px-4 py-2">
                                        {item[columnId] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <BarChart3 className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Click Refresh to load preview</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
                  {/* Sorting Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowUpDown className="w-5 h-5" />
                        Sorting Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sort by</Label>
                          <Select value={sortBy.field} onValueChange={(field) => setSortBy(prev => ({ ...prev, field }))}>
                            <SelectTrigger data-testid="select-sort-field">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sortableFields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Direction</Label>
                          <Select value={sortBy.direction} onValueChange={(direction: "asc" | "desc") => setSortBy(prev => ({ ...prev, direction }))}>
                            <SelectTrigger data-testid="select-sort-direction">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="desc">Newest First</SelectItem>
                              <SelectItem value="asc">Oldest First</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Transformations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Data Transformations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select 
                          value={transformations.formatDates} 
                          onValueChange={(value) => setTransformations(prev => ({ ...prev, formatDates: value }))}
                        >
                          <SelectTrigger data-testid="select-date-format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                            <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                            <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                            <SelectItem value="MMM DD, YYYY">Jan 15, 2024</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeAggregations"
                          checked={transformations.includeAggregations}
                          onCheckedChange={(checked) => 
                            setTransformations(prev => ({ ...prev, includeAggregations: !!checked }))
                          }
                          data-testid="checkbox-include-aggregations"
                        />
                        <Label htmlFor="includeAggregations">Include summary statistics in export</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center text-sm text-gray-600">
            {previewData && (
              <span>Ready to export {previewData.statistics.filteredItems} items</span>
            )}
          </div>
          <div className="flex space-x-2">
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