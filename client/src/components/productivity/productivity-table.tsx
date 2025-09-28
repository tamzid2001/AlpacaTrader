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
  not_started: "bg-[#c4c4c4]",
  in_progress: "bg-[#fdcb6e]", 
  completed: "bg-[#00c875]",
  blocked: "bg-[#e74c3c]",
  cancelled: "bg-[#c4c4c4]",
};

const priorityColors = {
  low: "bg-[#00c875]",
  medium: "bg-[#fdcb6e]", 
  high: "bg-[#ff9500]",
  urgent: "bg-[#e74c3c]",
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
    <div className="flex-1 overflow-auto bg-[#f6f8fc] dark:bg-gray-800 border border-[#e1e5ea] rounded-lg">
      <DragDropContext onDragEnd={onDragEnd}>
        <table className="w-full">
          <thead className="sticky top-0 bg-[#6574cd] border-b border-[#5a67d8]">
            <tr className="h-12">
              {/* Selection Column */}
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#6574cd]"
                  data-testid="checkbox-select-all"
                />
              </th>

              {/* Item Title Column */}
              <th className="px-4 py-3 text-left font-semibold text-white text-sm min-w-[300px]">
                Item
              </th>

              {/* Status Column */}
              <th className="px-4 py-3 text-left font-semibold text-white text-sm w-40">
                Status
              </th>

              {/* Priority Column */}
              <th className="px-4 py-3 text-left font-semibold text-white text-sm w-32">
                Priority
              </th>

              {/* Assigned To Column */}
              <th className="px-4 py-3 text-left font-semibold text-white text-sm w-40">
                Person
              </th>

              {/* Due Date Column */}
              <th className="px-4 py-3 text-left font-semibold text-white text-sm w-36">
                Date
              </th>

              {/* Dynamic Columns */}
              {sortedColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left font-semibold text-white text-sm"
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
                  className="hover:bg-[#5a67d8] text-white"
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
                className="divide-y divide-[#e1e5ea] bg-white"
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "h-12 hover:bg-[#f8f9ff] transition-colors border-b border-[#e1e5ea]",
                          snapshot.isDragging && "bg-[#e8f4fd] shadow-lg",
                          selectedItems.includes(item.id) && "bg-[#e8f4fd]",
                          hoveredItem === item.id && "bg-[#f8f9ff]"
                        )}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        data-testid={`item-row-${item.id}`}
                      >
                        {/* Selection */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div {...provided.dragHandleProps} className="cursor-grab text-[#c4c4c4] hover:text-[#676879] text-lg">
                              ⋮⋮
                            </div>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
                              className="border-[#c4c4c4] data-[state=checked]:bg-[#0073ea] data-[state=checked]:border-[#0073ea]"
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
                            <div className="font-medium text-[#323338] hover:text-[#0073ea] transition-colors" data-testid={`item-title-${item.id}`}>
                              {item.title}
                            </div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.tags.map((tag, tagIndex) => (
                                  <span key={tagIndex} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f6f8fc] text-[#676879] border border-[#e1e5ea]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div 
                              className={cn(
                                "inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium capitalize min-w-[90px] justify-center",
                                statusColors[item.status]
                              )}
                              data-testid={`item-status-${item.id}`}
                            >
                              {item.status.replace('_', ' ')}
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div 
                              className={cn(
                                "inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium capitalize min-w-[80px] justify-center",
                                priorityColors[item.priority]
                              )}
                              data-testid={`item-priority-${item.id}`}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              {item.priority}
                            </div>
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td className="px-4 py-3">
                          {item.assignedTo ? (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-7 h-7 border-2 border-white shadow-sm">
                                <AvatarImage src={`/api/users/${item.assignedTo}/avatar`} />
                                <AvatarFallback className="text-xs bg-[#0073ea] text-white font-medium">
                                  {item.assignedTo.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-[#323338] font-medium">
                                {item.assignedTo}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-[#9699a6]">
                              <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#c4c4c4] flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="text-sm">Unassigned</span>
                            </div>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-3">
                          {item.dueDate ? (
                            <div className={cn(
                              "inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium min-w-[100px] justify-center",
                              isOverdue(item.dueDate) ? "bg-[#e74c3c] text-white" : "bg-[#f6f8fc] text-[#323338] border border-[#e1e5ea]"
                            )}>
                              <Calendar className="w-3 h-3" />
                              <span data-testid={`item-due-date-${item.id}`}>
                                {formatDate(item.dueDate)}
                              </span>
                              {isOverdue(item.dueDate) && (
                                <span className="text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded">
                                  !
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm text-[#9699a6] bg-[#f6f8fc] border border-dashed border-[#c4c4c4] min-w-[100px] justify-center">
                              <Calendar className="w-3 h-3" />
                              <span>Set date</span>
                            </div>
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#f6f8fc] text-[#676879] hover:text-[#323338]" 
                                data-testid={`item-actions-${item.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border border-[#e1e5ea] shadow-lg">
                              <DropdownMenuItem 
                                onClick={() => onEditItem(item)} 
                                className="text-[#323338] hover:bg-[#f6f8fc] focus:bg-[#f6f8fc]"
                                data-testid={`action-edit-${item.id}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit item
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-[#e74c3c] hover:bg-[#ffe5e5] focus:bg-[#ffe5e5]" 
                                data-testid={`action-delete-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete item
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
        <div className="flex flex-col items-center justify-center py-20 text-[#676879]">
          <div className="w-16 h-16 bg-[#f6f8fc] rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-[#c4c4c4]" />
          </div>
          <div className="text-xl font-semibold mb-2 text-[#323338]">Your board is empty</div>
          <div className="text-sm">Add your first item to get started with this board</div>
        </div>
      )}
    </div>
  );
}