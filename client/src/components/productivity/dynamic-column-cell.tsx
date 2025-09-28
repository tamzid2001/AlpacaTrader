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
            className="cursor-pointer hover:bg-[#f8f9ff] px-3 py-2 rounded-lg min-h-[36px] flex items-center transition-colors border border-transparent hover:border-[#e1e5ea]"
            onClick={() => setIsEditing(true)}
            data-testid={`text-cell-${itemId}-${column.id}`}
          >
            {value ? (
              <span className="text-[#323338] font-medium">{value}</span>
            ) : (
              <span className="text-[#9699a6] italic">Add text</span>
            )}
          </div>
        );

      case 'date':
        return (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#f8f9ff] transition-colors border border-transparent hover:border-[#e1e5ea] min-h-[36px]">
                <Calendar className="w-4 h-4 text-[#676879]" />
                <span className={value ? "text-[#323338] font-medium" : "text-[#9699a6] italic"}>
                  {value ? format(new Date(value), 'MMM dd, yyyy') : 'Set date'}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border border-[#e1e5ea] shadow-lg" align="start">
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
          { value: 'not_started', label: 'Not Started', color: '#c4c4c4' },
          { value: 'in_progress', label: 'In Progress', color: '#fdcb6e' },
          { value: 'completed', label: 'Completed', color: '#00c875' },
          { value: 'blocked', label: 'Blocked', color: '#e74c3c' },
        ];
        
        const currentStatus = statusOptions.find(opt => opt.value === value);
        
        return (
          <Select value={value} onValueChange={(newValue) => updateValueMutation.mutate({ newValue })}>
            <SelectTrigger className="w-full border-none shadow-none p-0 h-auto hover:bg-[#f8f9ff] rounded-lg">
              <SelectValue>
                {currentStatus ? (
                  <div 
                    className="inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium capitalize min-w-[90px] justify-center"
                    style={{ backgroundColor: currentStatus.color }}
                  >
                    {currentStatus.label}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-2 rounded-lg text-[#9699a6] bg-[#f6f8fc] border border-dashed border-[#c4c4c4] min-w-[90px] justify-center text-sm italic">
                    Set status
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-[#e1e5ea] shadow-lg">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="focus:bg-[#f6f8fc]">
                  <div 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium capitalize min-w-[90px] justify-center"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'priority':
        const priorityOptions = [
          { value: 'low', label: 'Low', color: '#00c875' },
          { value: 'medium', label: 'Medium', color: '#fdcb6e' },
          { value: 'high', label: 'High', color: '#ff9500' },
          { value: 'urgent', label: 'Urgent', color: '#e74c3c' },
        ];
        
        const currentPriority = priorityOptions.find(opt => opt.value === value);
        
        return (
          <Select value={value} onValueChange={(newValue) => updateValueMutation.mutate({ newValue })}>
            <SelectTrigger className="w-full border-none shadow-none p-0 h-auto hover:bg-[#f8f9ff] rounded-lg">
              <SelectValue>
                {currentPriority ? (
                  <div 
                    className="inline-flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium capitalize min-w-[80px] justify-center"
                    style={{ backgroundColor: currentPriority.color }}
                  >
                    {currentPriority.label}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-2 rounded-lg text-[#9699a6] bg-[#f6f8fc] border border-dashed border-[#c4c4c4] min-w-[80px] justify-center text-sm italic">
                    Set priority
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border border-[#e1e5ea] shadow-lg">
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="focus:bg-[#f6f8fc]">
                  <div 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-white text-sm font-medium capitalize min-w-[80px] justify-center"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'numbers':
        return (
          <div 
            className="cursor-pointer hover:bg-[#f8f9ff] px-3 py-2 rounded-lg min-h-[36px] flex items-center transition-colors border border-transparent hover:border-[#e1e5ea]"
            onClick={() => setIsEditing(true)}
          >
            {value ? (
              <span className="text-[#323338] font-medium font-mono">{value}</span>
            ) : (
              <span className="text-[#9699a6] italic">Add number</span>
            )}
          </div>
        );

      case 'people':
        return (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#f8f9ff] transition-colors border border-transparent hover:border-[#e1e5ea] min-h-[36px] cursor-pointer">
            {value ? (
              <>
                <Avatar className="w-7 h-7 border-2 border-white shadow-sm">
                  <AvatarImage src={`/api/users/${value}/avatar`} />
                  <AvatarFallback className="text-xs bg-[#0073ea] text-white font-medium">
                    {value.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-[#323338] font-medium">{value}</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#c4c4c4] flex items-center justify-center">
                  <User className="w-3 h-3 text-[#c4c4c4]" />
                </div>
                <span className="text-sm text-[#9699a6] italic">Assign person</span>
              </>
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
          <div className="flex items-center space-x-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm h-9 border-[#0073ea] focus:border-[#0073ea] focus:ring-2 focus:ring-[#0073ea] focus:ring-opacity-20 text-[#323338]"
              type={column.type === 'numbers' ? 'number' : 'text'}
              autoFocus
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSave}
              className="h-9 w-9 p-0 hover:bg-[#e8f4fd] text-[#0073ea]"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleCancel}
              className="h-9 w-9 p-0 hover:bg-[#ffe5e5] text-[#e74c3c]"
            >
              <X className="w-4 h-4" />
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