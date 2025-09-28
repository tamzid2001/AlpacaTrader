import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { MoreHorizontal, Plus, Calendar, User, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProductivityItem } from "./productivity-board";

interface ProductivityKanbanProps {
  items: ProductivityItem[];
  onItemUpdate: (itemId: string, updates: Partial<ProductivityItem>) => void;
  onEditItem: (item: ProductivityItem) => void;
}

const statusColumns = [
  { id: 'not_started', title: 'Not Started', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100 dark:bg-green-900' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-100 dark:bg-red-900' },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-gray-100 dark:bg-gray-800' },
];

const priorityColors = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400',
};

export function ProductivityKanban({ items, onItemUpdate, onEditItem }: ProductivityKanbanProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Group items by status
  const itemsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = items.filter(item => item.status === column.id);
    return acc;
  }, {} as Record<string, ProductivityItem[]>);

  const handleDragStart = (start: any) => {
    setDraggedItem(start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedItem(null);
    
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Update item status if moved to different column
    if (source.droppableId !== destination.droppableId) {
      onItemUpdate(draggableId, { status: destination.droppableId as any });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const KanbanCard = ({ item, index }: { item: ProductivityItem; index: number }) => (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 cursor-pointer transition-all hover:shadow-md",
            snapshot.isDragging && "rotate-3 shadow-lg",
            draggedItem === item.id && "opacity-50"
          )}
          onClick={() => onEditItem(item)}
          data-testid={`kanban-card-${item.id}`}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title */}
              <h4 className="font-medium text-sm line-clamp-2" data-testid={`card-title-${item.id}`}>
                {item.title}
              </h4>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs px-1.5 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Flag className={cn("w-3 h-3", priorityColors[item.priority])} />
                  <span className={cn("text-xs capitalize", priorityColors[item.priority])}>
                    {item.priority}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`card-menu-${item.id}`}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Due Date and Assignee */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {item.dueDate && (
                  <div className={cn(
                    "flex items-center space-x-1",
                    isOverdue(item.dueDate) && "text-red-600 dark:text-red-400"
                  )}>
                    <Calendar className="w-3 h-3" />
                    <span data-testid={`card-due-date-${item.id}`}>
                      {formatDate(item.dueDate)}
                    </span>
                    {isOverdue(item.dueDate) && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        Overdue
                      </Badge>
                    )}
                  </div>
                )}

                {item.assignedTo && (
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={`/api/users/${item.assignedTo}/avatar`} />
                    <AvatarFallback className="text-xs">
                      {item.assignedTo.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-gray-900">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 h-full">
          {statusColumns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={cn("rounded-t-lg p-4 border-b", column.color)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`column-title-${column.id}`}>
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs" data-testid={`column-count-${column.id}`}>
                    {itemsByStatus[column.id]?.length || 0}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-4 bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 min-h-[200px]",
                      snapshot.isDraggingOver && "bg-gray-50 dark:bg-gray-700"
                    )}
                    data-testid={`column-content-${column.id}`}
                  >
                    {itemsByStatus[column.id]?.map((item, index) => (
                      <KanbanCard key={item.id} item={item} index={index} />
                    ))}
                    {provided.placeholder}

                    {/* Add Item Button */}
                    <Button
                      variant="ghost"
                      className="w-full mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      data-testid={`add-item-${column.id}`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">No items to display</div>
          <div className="text-sm">Create your first item to see it on the kanban board</div>
        </div>
      )}
    </div>
  );
}