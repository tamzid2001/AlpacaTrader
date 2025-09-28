import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus, Filter, Search, MoreHorizontal, Download, Upload, Settings, Users, Calendar, BarChart3, Zap, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ProductivityTable } from "./productivity-table";
import { ProductivityKanban } from "./productivity-kanban";
import { ProductivityCalendar } from "./productivity-calendar";
import { ItemDialog } from "./item-dialog";
import { ColumnDialog } from "./column-dialog";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";
import { FilterDialog } from "./filter-dialog";
import { BoardSettings } from "./board-settings";
import { AutomationDialog } from "./automation-dialog";
import { TemplateDialog } from "./template-dialog";
import { apiRequest } from "@/lib/queryClient";

export interface ProductivityBoard {
  id: string;
  userId: string;
  title: string;
  description?: string;
  boardType: "anomalies" | "patterns" | "tasks" | "general";
  color: string;
  isTemplate: boolean;
  isPublic: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProductivityItem {
  id: string;
  boardId: string;
  title: string;
  status: "not_started" | "in_progress" | "completed" | "blocked" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  position: number;
  parentItemId?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  columnValues?: ColumnValue[];
}

export interface ItemColumn {
  id: string;
  boardId: string;
  name: string;
  type: "text" | "date" | "status" | "priority" | "timeline" | "numbers" | "people" | "dropdown" | "checkbox" | "rating" | "formula";
  position: number;
  isRequired: boolean;
  isVisible: boolean;
  width: number;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnValue {
  id: string;
  itemId: string;
  columnId: string;
  value?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

interface ProductivityBoardProps {
  boardId: string;
}

export function ProductivityBoard({ boardId }: ProductivityBoardProps) {
  const [view, setView] = useState<"table" | "kanban" | "calendar">("table");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductivityItem | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch board data
  const { data: boardData, isLoading, error } = useQuery({
    queryKey: ['/api/productivity/boards', boardId],
    enabled: !!boardId,
  });

  const board = boardData?.board;
  const items = boardData?.items || [];
  const columns = boardData?.columns || [];

  // Mutations
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<ProductivityItem> }) => {
      return apiRequest(`/api/productivity/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
      toast({ title: "Item updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update item", description: error.message, variant: "destructive" });
    },
  });

  const reorderItemsMutation = useMutation({
    mutationFn: async (itemOrders: { id: string; position: number }[]) => {
      return apiRequest(`/api/productivity/boards/${boardId}/items/reorder`, {
        method: 'POST',
        body: JSON.stringify({ itemOrders }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reorder items", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Partial<ProductivityItem>) => {
      return apiRequest('/api/productivity/items/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ itemIds: selectedItems, updates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
      setSelectedItems([]);
      toast({ title: "Items updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update items", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/productivity/items/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ itemIds: selectedItems }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards', boardId] });
      setSelectedItems([]);
      toast({ title: "Items deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete items", description: error.message, variant: "destructive" });
    },
  });

  // Filtered items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: ProductivityItem) => 
        item.title.toLowerCase().includes(query) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Apply other filters
    if (filters.status?.length) {
      filtered = filtered.filter((item: ProductivityItem) => filters.status?.includes(item.status));
    }
    if (filters.priority?.length) {
      filtered = filtered.filter((item: ProductivityItem) => filters.priority?.includes(item.priority));
    }
    if (filters.assignedTo?.length) {
      filtered = filtered.filter((item: ProductivityItem) => item.assignedTo && filters.assignedTo?.includes(item.assignedTo));
    }
    if (filters.tags?.length) {
      filtered = filtered.filter((item: ProductivityItem) => 
        item.tags && item.tags.some(tag => filters.tags?.includes(tag))
      );
    }
    if (filters.dueDateFrom && filters.dueDateTo) {
      filtered = filtered.filter((item: ProductivityItem) => {
        if (!item.dueDate) return false;
        const dueDate = new Date(item.dueDate);
        return dueDate >= filters.dueDateFrom! && dueDate <= filters.dueDateTo!;
      });
    }

    return filtered;
  }, [items, searchQuery, filters]);

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const reorderedItems = Array.from(filteredItems);
    const [removed] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(destinationIndex, 0, removed);

    // Generate new positions
    const itemOrders = reorderedItems.map((item, index) => ({
      id: item.id,
      position: index * 1000, // Use increments of 1000 for easy reordering
    }));

    reorderItemsMutation.mutate(itemOrders);
  };

  // Handle item selection
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(filteredItems.map((item: ProductivityItem) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle bulk operations
  const handleBulkStatusUpdate = (status: string) => {
    bulkUpdateMutation.mutate({ status: status as any });
  };

  const handleBulkPriorityUpdate = (priority: string) => {
    bulkUpdateMutation.mutate({ priority: priority as any });
  };

  const handleBulkAssignUpdate = (assignedTo: string) => {
    bulkUpdateMutation.mutate({ assignedTo });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      bulkDeleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading board...</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load board</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: board.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="board-title">
                {board.title}
              </h1>
              {board.description && (
                <p className="text-gray-600 dark:text-gray-400" data-testid="board-description">
                  {board.description}
                </p>
              )}
            </div>
            <Badge variant="outline" data-testid="board-type">
              {board.boardType}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher */}
            <Tabs value={view} onValueChange={(value) => setView(value as any)}>
              <TabsList data-testid="view-switcher">
                <TabsTrigger value="table" data-testid="view-table">Table</TabsTrigger>
                <TabsTrigger value="kanban" data-testid="view-kanban">Kanban</TabsTrigger>
                <TabsTrigger value="calendar" data-testid="view-calendar">Calendar</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterDialog(true)}
                data-testid="button-filter"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="dropdown-export">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowExportDialog(true)} data-testid="export-csv">
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowExportDialog(true)} data-testid="export-excel">
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowExportDialog(true)} data-testid="export-pdf">
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                data-testid="button-import"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>

              <AutomationDialog boardId={boardId}>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-automation"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Automations
                </Button>
              </AutomationDialog>

              <TemplateDialog boardId={boardId}>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-templates"
                >
                  <Files className="w-4 h-4 mr-2" />
                  Templates
                </Button>
              </TemplateDialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBoardSettings(true)}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => setShowItemDialog(true)}
                data-testid="button-add-item"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" data-testid="filter-count">
                {filteredItems.length} items
              </Badge>
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="selected-count">
                {selectedItems.length} selected
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="dropdown-bulk-actions">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('in_progress')} data-testid="bulk-status-progress">
                    Set to In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')} data-testid="bulk-status-completed">
                    Mark as Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('high')} data-testid="bulk-priority-high">
                    Set Priority to High
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBulkDelete} className="text-red-600" data-testid="bulk-delete">
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "table" && (
          <ProductivityTable
            items={filteredItems}
            columns={columns}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            onSelectAll={handleSelectAll}
            onDragEnd={handleDragEnd}
            onEditItem={setEditingItem}
            onAddColumn={() => setShowColumnDialog(true)}
          />
        )}
        {view === "kanban" && (
          <ProductivityKanban
            items={filteredItems}
            onItemUpdate={(itemId, updates) => updateItemMutation.mutate({ itemId, updates })}
            onEditItem={setEditingItem}
          />
        )}
        {view === "calendar" && (
          <ProductivityCalendar
            items={filteredItems}
            onItemUpdate={(itemId, updates) => updateItemMutation.mutate({ itemId, updates })}
            onEditItem={setEditingItem}
          />
        )}
      </div>

      {/* Dialogs */}
      <ItemDialog
        boardId={boardId}
        item={editingItem}
        columns={columns}
        open={showItemDialog || !!editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setShowItemDialog(false);
            setEditingItem(null);
          }
        }}
      />

      <ColumnDialog
        boardId={boardId}
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
      />

      <ExportDialog
        boardId={boardId}
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      <ImportDialog
        boardId={boardId}
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />

      <FilterDialog
        filters={filters}
        onFiltersChange={setFilters}
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
      />

      <BoardSettings
        board={board}
        open={showBoardSettings}
        onOpenChange={setShowBoardSettings}
      />
    </div>
  );
}