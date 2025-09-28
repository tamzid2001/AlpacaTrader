import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { MoreHorizontal, Edit, Trash2, User, Calendar, Flag, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ProductivityItem, ItemColumn, ColumnValue } from "./productivity-board";
import { DynamicColumnCell } from "./dynamic-column-cell";

interface ProductivityTableProps {
  items: ProductivityItem[];
  columns: ItemColumn[];
  selectedItems: string[];
  onItemSelect: (itemId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDragEnd: (result: DropResult) => void;
  onEditItem: (item: ProductivityItem) => void;
  onAddColumn: () => void;
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ProductivityTable({
  items,
  columns,
  selectedItems,
  onItemSelect,
  onSelectAll,
  onDragEnd,
  onEditItem,
  onAddColumn,
}: ProductivityTableProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  // Sort columns by position
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const handleItemClick = (item: ProductivityItem, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      const isSelected = selectedItems.includes(item.id);
      onItemSelect(item.id, !isSelected);
    } else {
      onEditItem(item);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !["completed", "cancelled"].includes("");
  };

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
      <DragDropContext onDragEnd={onDragEnd}>
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {/* Selection Column */}
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                  data-testid="checkbox-select-all"
                />
              </th>

              {/* Item Title Column */}
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 min-w-[300px]">
                Item
              </th>

              {/* Status Column */}
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 w-32">
                Status
              </th>

              {/* Priority Column */}
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 w-32">
                Priority
              </th>

              {/* Assigned To Column */}
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 w-40">
                Assigned To
              </th>

              {/* Due Date Column */}
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 w-32">
                Due Date
              </th>

              {/* Dynamic Columns */}
              {sortedColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100"
                  style={{ width: column.width }}
                >
                  {column.name}
                </th>
              ))}

              {/* Add Column Button */}
              <th className="w-12 px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddColumn}
                  data-testid="button-add-column"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </th>

              {/* Actions Column */}
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          
          <Droppable droppableId="items">
            {(provided) => (
              <tbody
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                          snapshot.isDragging && "bg-gray-100 dark:bg-gray-600 shadow-lg",
                          selectedItems.includes(item.id) && "bg-blue-50 dark:bg-blue-900",
                          hoveredItem === item.id && "bg-gray-25 dark:bg-gray-750"
                        )}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        data-testid={`item-row-${item.id}`}
                      >
                        {/* Selection */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-400">
                              ⋮⋮
                            </div>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
                              data-testid={`checkbox-item-${item.id}`}
                            />
                          </div>
                        </td>

                        {/* Item Title */}
                        <td className="px-4 py-3">
                          <div 
                            className="cursor-pointer"
                            onClick={(e) => handleItemClick(item, e)}
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-100" data-testid={`item-title-${item.id}`}>
                              {item.title}
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge 
                            className={cn("capitalize", statusColors[item.status])}
                            data-testid={`item-status-${item.id}`}
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <Badge 
                            className={cn("capitalize", priorityColors[item.priority])}
                            data-testid={`item-priority-${item.id}`}
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            {item.priority}
                          </Badge>
                        </td>

                        {/* Assigned To */}
                        <td className="px-4 py-3">
                          {item.assignedTo ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={`/api/users/${item.assignedTo}/avatar`} />
                                <AvatarFallback className="text-xs">
                                  {item.assignedTo.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {item.assignedTo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-3">
                          {item.dueDate ? (
                            <div className={cn(
                              "flex items-center space-x-1 text-sm",
                              isOverdue(item.dueDate) ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                            )}>
                              <Calendar className="w-3 h-3" />
                              <span data-testid={`item-due-date-${item.id}`}>
                                {formatDate(item.dueDate)}
                              </span>
                              {isOverdue(item.dueDate) && (
                                <Badge variant="destructive" className="text-xs ml-1">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No due date</span>
                          )}
                        </td>

                        {/* Dynamic Columns */}
                        {sortedColumns.map((column) => {
                          const columnValue = item.columnValues?.find(cv => cv.columnId === column.id);
                          return (
                            <td key={column.id} className="px-4 py-3">
                              <DynamicColumnCell
                                column={column}
                                value={columnValue?.value}
                                metadata={columnValue?.metadata}
                                itemId={item.id}
                                data-testid={`column-cell-${column.id}-${item.id}`}
                              />
                            </td>
                          );
                        })}

                        {/* Add Column Spacer */}
                        <td className="px-4 py-3"></td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`item-actions-${item.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditItem(item)} data-testid={`action-edit-${item.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" data-testid={`action-delete-${item.id}`}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </table>
      </DragDropContext>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">No items found</div>
          <div className="text-sm">Create your first item to get started</div>
        </div>
      )}
    </div>
  );
}