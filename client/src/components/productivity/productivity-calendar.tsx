import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductivityItem } from "./productivity-board";

interface ProductivityCalendarProps {
  items: ProductivityItem[];
  onItemUpdate: (itemId: string, updates: Partial<ProductivityItem>) => void;
  onEditItem: (item: ProductivityItem) => void;
}

const statusColors = {
  not_started: "bg-gray-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  blocked: "bg-red-500",
  cancelled: "bg-gray-400",
};

export function ProductivityCalendar({ items, onItemUpdate, onEditItem }: ProductivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  // Get items with due dates
  const itemsWithDates = useMemo(() => {
    return items.filter(item => item.dueDate);
  }, [items]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, ProductivityItem[]> = {};
    
    itemsWithDates.forEach(item => {
      if (item.dueDate) {
        const dateKey = format(new Date(item.dueDate), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
      }
    });
    
    return grouped;
  }, [itemsWithDates]);

  // Get days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getItemsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return itemsByDate[dateKey] || [];
  };

  const isOverdue = (item: ProductivityItem) => {
    if (!item.dueDate) return false;
    return new Date(item.dueDate) < new Date() && !["completed", "cancelled"].includes(item.status);
  };

  const CalendarDay = ({ date }: { date: Date }) => {
    const dayItems = getItemsForDate(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isTodays = isToday(date);

    return (
      <div
        className={cn(
          "min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
          !isCurrentMonth && "bg-gray-50 dark:bg-gray-900 text-gray-400",
          isTodays && "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
        )}
        data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
      >
        {/* Date Header */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-sm font-medium",
            isTodays && "text-blue-600 dark:text-blue-400"
          )}>
            {format(date, 'd')}
          </span>
          {dayItems.length > 0 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              {dayItems.length}
            </Badge>
          )}
        </div>

        {/* Items */}
        <div className="space-y-1">
          {dayItems.slice(0, 3).map(item => (
            <div
              key={item.id}
              className="cursor-pointer group"
              onClick={() => onEditItem(item)}
              data-testid={`calendar-item-${item.id}`}
            >
              <div className={cn(
                "text-xs p-1.5 rounded text-white truncate transition-all",
                statusColors[item.status],
                "group-hover:shadow-md group-hover:scale-105",
                isOverdue(item) && "ring-2 ring-red-400 ring-opacity-50"
              )}>
                <div className="flex items-center space-x-1">
                  {isOverdue(item) && (
                    <span className="text-red-200">⚠</span>
                  )}
                  <span className="truncate">{item.title}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show more indicator */}
          {dayItems.length > 3 && (
            <div className="text-xs text-gray-500 px-1.5 py-1">
              +{dayItems.length - 3} more
            </div>
          )}
        </div>

        {/* Add item button on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-6 border-dashed border border-gray-300"
            data-testid={`add-item-${format(date, 'yyyy-MM-dd')}`}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="calendar-title">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
                data-testid="button-week-view"
              >
                Week
              </Button>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-3 text-sm">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-1">
                  <div className={cn("w-3 h-3 rounded", color)} />
                  <span className="capitalize text-gray-600 dark:text-gray-400">
                    {status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        {view === "month" && (
          <div className="h-full">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-700 dark:text-gray-300">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 h-full">
              {/* Previous month filler days */}
              {Array.from({ length: monthStart.getDay() }, (_, i) => {
                const fillDate = new Date(monthStart);
                fillDate.setDate(fillDate.getDate() - (monthStart.getDay() - i));
                return <CalendarDay key={`prev-${i}`} date={fillDate} />;
              })}

              {/* Current month days */}
              {calendarDays.map(date => (
                <CalendarDay key={format(date, 'yyyy-MM-dd')} date={date} />
              ))}

              {/* Next month filler days */}
              {Array.from({ length: 42 - (monthStart.getDay() + calendarDays.length) }, (_, i) => {
                const fillDate = new Date(monthEnd);
                fillDate.setDate(fillDate.getDate() + i + 1);
                return <CalendarDay key={`next-${i}`} date={fillDate} />;
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week View Coming Soon
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Week view is currently under development
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div data-testid="stat-total-items">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {itemsWithDates.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          <div data-testid="stat-overdue-items">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {itemsWithDates.filter(isOverdue).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
          </div>
          <div data-testid="stat-completed-items">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {itemsWithDates.filter(item => item.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div data-testid="stat-progress-items">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {itemsWithDates.filter(item => item.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}