import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, Tag, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FilterState } from "./productivity-board";

interface FilterDialogProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterDialog({ filters, onFiltersChange, open, onOpenChange }: FilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Get users for assignee filter
  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
  });

  const users = usersData?.users || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, open]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    const emptyFilters: FilterState = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    onOpenChange(false);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatuses = localFilters.status || [];
    if (checked) {
      setLocalFilters({
        ...localFilters,
        status: [...currentStatuses, status]
      });
    } else {
      setLocalFilters({
        ...localFilters,
        status: currentStatuses.filter(s => s !== status)
      });
    }
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = localFilters.priority || [];
    if (checked) {
      setLocalFilters({
        ...localFilters,
        priority: [...currentPriorities, priority]
      });
    } else {
      setLocalFilters({
        ...localFilters,
        priority: currentPriorities.filter(p => p !== priority)
      });
    }
  };

  const handleAssigneeChange = (assignee: string, checked: boolean) => {
    const currentAssignees = localFilters.assignedTo || [];
    if (checked) {
      setLocalFilters({
        ...localFilters,
        assignedTo: [...currentAssignees, assignee]
      });
    } else {
      setLocalFilters({
        ...localFilters,
        assignedTo: currentAssignees.filter(a => a !== assignee)
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !(localFilters.tags || []).includes(newTag.trim())) {
      setLocalFilters({
        ...localFilters,
        tags: [...(localFilters.tags || []), newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalFilters({
      ...localFilters,
      tags: (localFilters.tags || []).filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const statusOptions = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const activeFilterCount = Object.values(localFilters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="filter-dialog">
        <DialogHeader>
          <DialogTitle data-testid="filter-dialog-title">
            Filter Items
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={(localFilters.status || []).includes(status.value)}
                      onCheckedChange={(checked) => handleStatusChange(status.value, !!checked)}
                      data-testid={`filter-status-${status.value}`}
                    />
                    <Label htmlFor={`status-${status.value}`} className="cursor-pointer">
                      <Badge className={cn("capitalize", status.color)}>
                        {status.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Priority</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {priorityOptions.map((priority) => (
                  <div key={priority.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority.value}`}
                      checked={(localFilters.priority || []).includes(priority.value)}
                      onCheckedChange={(checked) => handlePriorityChange(priority.value, !!checked)}
                      data-testid={`filter-priority-${priority.value}`}
                    />
                    <Label htmlFor={`priority-${priority.value}`} className="cursor-pointer">
                      <Badge className={cn("capitalize", priority.color)}>
                        {priority.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assignee Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Assigned To</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unassigned"
                    checked={(localFilters.assignedTo || []).includes("")}
                    onCheckedChange={(checked) => handleAssigneeChange("", !!checked)}
                    data-testid="filter-unassigned"
                  />
                  <Label htmlFor="unassigned" className="cursor-pointer">
                    <Badge variant="outline">Unassigned</Badge>
                  </Label>
                </div>
                
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assignee-${user.id}`}
                      checked={(localFilters.assignedTo || []).includes(user.email || user.id)}
                      onCheckedChange={(checked) => handleAssigneeChange(user.email || user.id, !!checked)}
                      data-testid={`filter-assignee-${user.id}`}
                    />
                    <Label htmlFor={`assignee-${user.id}`} className="cursor-pointer flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        {(user.firstName || user.email || user.id).substring(0, 2).toUpperCase()}
                      </div>
                      <span>{user.firstName || user.email || user.id}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Due Date Range</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-start-date"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {localFilters.dueDateFrom ? format(localFilters.dueDateFrom, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={localFilters.dueDateFrom}
                        onSelect={(date) => {
                          setLocalFilters({ ...localFilters, dueDateFrom: date });
                          setStartCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-end-date"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {localFilters.dueDateTo ? format(localFilters.dueDateTo, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={localFilters.dueDateTo}
                        onSelect={(date) => {
                          setLocalFilters({ ...localFilters, dueDateTo: date });
                          setEndCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {(localFilters.dueDateFrom || localFilters.dueDateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalFilters({ 
                    ...localFilters, 
                    dueDateFrom: undefined, 
                    dueDateTo: undefined 
                  })}
                  className="mt-2"
                  data-testid="button-clear-dates"
                >
                  Clear dates
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tags Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tag filter..."
                  className="flex-1"
                  data-testid="input-filter-tag"
                />
                <Button type="button" onClick={handleAddTag} size="sm" data-testid="button-add-filter-tag">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {(localFilters.tags && localFilters.tags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {localFilters.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                        data-testid={`remove-filter-tag-${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleResetFilters}
              data-testid="button-reset-filters"
            >
              Reset All Filters
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApplyFilters}
                data-testid="button-apply-filters"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}