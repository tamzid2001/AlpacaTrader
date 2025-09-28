import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Check, X, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { ItemColumn } from "./productivity-board";

interface DynamicColumnCellProps {
  column: ItemColumn;
  value?: string;
  metadata?: any;
  itemId: string;
}

export function DynamicColumnCell({ column, value, metadata, itemId }: DynamicColumnCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const queryClient = useQueryClient();

  const updateValueMutation = useMutation({
    mutationFn: async ({ newValue, newMetadata }: { newValue: string; newMetadata?: any }) => {
      return apiRequest(`/api/productivity/items/${itemId}/values`, {
        method: 'POST',
        body: JSON.stringify({
          columnId: column.id,
          value: newValue,
          metadata: newMetadata,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/boards'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (editValue !== value) {
      updateValueMutation.mutate({ newValue: editValue });
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderViewMode = () => {
    switch (column.type) {
      case 'text':
        return (
          <div 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded min-h-[24px]"
            onClick={() => setIsEditing(true)}
            data-testid={`text-cell-${itemId}-${column.id}`}
          >
            {value || <span className="text-gray-400">Click to add text</span>}
          </div>
        );

      case 'date':
        return (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="p-2 h-auto justify-start text-left font-normal">
                <Calendar className="w-4 h-4 mr-2" />
                {value ? format(new Date(value), 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    updateValueMutation.mutate({ newValue: date.toISOString().split('T')[0] });
                  }
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'status':
        const statusOptions = column.settings?.options || [
          { value: 'not_started', label: 'Not Started', color: '#6B7280' },
          { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
          { value: 'completed', label: 'Completed', color: '#10B981' },
          { value: 'blocked', label: 'Blocked', color: '#EF4444' },
        ];
        
        const currentStatus = statusOptions.find(opt => opt.value === value);
        
        return (
          <Select value={value} onValueChange={(newValue) => updateValueMutation.mutate({ newValue })}>
            <SelectTrigger className="w-full border-none shadow-none p-1">
              <SelectValue>
                {currentStatus ? (
                  <Badge style={{ backgroundColor: currentStatus.color }} className="text-white">
                    {currentStatus.label}
                  </Badge>
                ) : (
                  <span className="text-gray-400">Select status</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <Badge style={{ backgroundColor: option.color }} className="text-white">
                    {option.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'priority':
        const priorityOptions = [
          { value: 'low', label: 'Low', color: '#10B981' },
          { value: 'medium', label: 'Medium', color: '#F59E0B' },
          { value: 'high', label: 'High', color: '#F97316' },
          { value: 'urgent', label: 'Urgent', color: '#EF4444' },
        ];
        
        const currentPriority = priorityOptions.find(opt => opt.value === value);
        
        return (
          <Select value={value} onValueChange={(newValue) => updateValueMutation.mutate({ newValue })}>
            <SelectTrigger className="w-full border-none shadow-none p-1">
              <SelectValue>
                {currentPriority ? (
                  <Badge style={{ backgroundColor: currentPriority.color }} className="text-white">
                    {currentPriority.label}
                  </Badge>
                ) : (
                  <span className="text-gray-400">Select priority</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <Badge style={{ backgroundColor: option.color }} className="text-white">
                    {option.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'numbers':
        return (
          <div 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded min-h-[24px]"
            onClick={() => setIsEditing(true)}
          >
            {value || <span className="text-gray-400">0</span>}
          </div>
        );

      case 'people':
        return (
          <div className="flex items-center space-x-2">
            {value ? (
              <>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={`/api/users/${value}/avatar`} />
                  <AvatarFallback className="text-xs">
                    {value.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{value}</span>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="text-gray-400">
                <User className="w-4 h-4 mr-1" />
                Assign
              </Button>
            )}
          </div>
        );

      case 'dropdown':
        const dropdownOptions = column.settings?.options || [];
        const selectedOption = dropdownOptions.find((opt: any) => opt.value === value);
        
        return (
          <Select value={value} onValueChange={(newValue) => updateValueMutation.mutate({ newValue })}>
            <SelectTrigger className="w-full border-none shadow-none p-1">
              <SelectValue>
                {selectedOption ? selectedOption.label : <span className="text-gray-400">Select option</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {dropdownOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            checked={value === 'true'}
            onCheckedChange={(checked) => updateValueMutation.mutate({ newValue: checked ? 'true' : 'false' })}
          />
        );

      case 'rating':
        const rating = parseInt(value || '0');
        const maxRating = column.settings?.maxRating || 5;
        
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4 cursor-pointer",
                  i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                )}
                onClick={() => updateValueMutation.mutate({ newValue: (i + 1).toString() })}
              />
            ))}
          </div>
        );

      case 'timeline':
        const startDate = metadata?.startDate;
        const endDate = metadata?.endDate;
        
        return (
          <div className="text-sm">
            {startDate && endDate ? (
              <span>
                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd')}
              </span>
            ) : (
              <span className="text-gray-400">Set timeline</span>
            )}
          </div>
        );

      case 'formula':
        // Formula columns are read-only and calculate values based on other columns
        return (
          <div className="text-sm font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
            {value || '0'}
          </div>
        );

      default:
        return (
          <div className="text-gray-400">
            Unsupported column type: {column.type}
          </div>
        );
    }
  };

  const renderEditMode = () => {
    switch (column.type) {
      case 'text':
      case 'numbers':
        return (
          <div className="flex items-center space-x-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm h-8"
              type={column.type === 'numbers' ? 'number' : 'text'}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        );

      default:
        return renderViewMode();
    }
  };

  if (isEditing && ['text', 'numbers'].includes(column.type)) {
    return renderEditMode();
  }

  return renderViewMode();
}