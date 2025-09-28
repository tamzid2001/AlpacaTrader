import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle, 
  Loader2,
  Download,
  Settings,
  LineChart,
  AreaChart,
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  BarChart3,
  TrendingUpIcon,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

// Python yfinance-style data interfaces
interface PythonYFinanceRecord {
  Item_Id: string;
  Date: string;
  Price: number;
}

interface PythonYFinanceResponse {
  data: PythonYFinanceRecord[];
  meta: {
    symbol: string;
    interval: string;
    startDate: string;
    endDate: string;
    recordCount: number;
  };
}

// Chart data for Recharts (transformed from Python format)
interface ChartData {
  date: string;
  dateObj: Date;
  price: number;
  priceDisplay: string;
  itemId: string;
}

interface StockInfo {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  recordCount: number;
  dateRange: string;
  interval: string;
}

interface StockChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  className?: string;
  height?: number;
}

type ChartType = 'line' | 'area';
type IntervalType = '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';

// Frequency categories for better UX
interface FrequencyOption {
  value: IntervalType;
  label: string;
  description: string;
  category: 'intraday' | 'daily' | 'long-term';
  icon: any;
}

const frequencyOptions: FrequencyOption[] = [
  // Intraday frequencies (for recent data)
  { value: '1m', label: '1 Minute', description: 'Every minute (last 7 days only)', category: 'intraday', icon: Clock },
  { value: '2m', label: '2 Minutes', description: 'Every 2 minutes (last 60 days)', category: 'intraday', icon: Clock },
  { value: '5m', label: '5 Minutes', description: 'Every 5 minutes (last 60 days)', category: 'intraday', icon: Clock },
  { value: '15m', label: '15 Minutes', description: 'Every 15 minutes (last 60 days)', category: 'intraday', icon: Clock },
  { value: '30m', label: '30 Minutes', description: 'Every 30 minutes (last 60 days)', category: 'intraday', icon: Clock },
  { value: '60m', label: '1 Hour', description: 'Every hour (last 730 days)', category: 'intraday', icon: Clock },
  { value: '90m', label: '90 Minutes', description: 'Every 90 minutes (last 60 days)', category: 'intraday', icon: Clock },
  
  // Daily frequencies
  { value: '1d', label: 'Daily', description: 'Daily closing prices', category: 'daily', icon: BarChart3 },
  { value: '5d', label: '5 Days', description: 'Weekly business days', category: 'daily', icon: BarChart3 },
  
  // Long-term frequencies
  { value: '1wk', label: 'Weekly', description: 'Weekly closing prices', category: 'long-term', icon: TrendingUpIcon },
  { value: '1mo', label: 'Monthly', description: 'Monthly closing prices', category: 'long-term', icon: TrendingUpIcon },
  { value: '3mo', label: 'Quarterly', description: 'Quarterly closing prices', category: 'long-term', icon: TrendingUpIcon }
];

const categoryLabels = {
  intraday: 'Intraday (Minutes/Hours)',
  daily: 'Daily',
  'long-term': 'Long-term (Weeks/Months)'
};

// Professional color scheme
const colors = {
  primary: '#2563eb',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#ea580c',
  muted: '#64748b',
  grid: '#e2e8f0',
  background: '#ffffff'
};

export function StockChart({ symbol, onSymbolChange, className = '', height = 400 }: StockChartProps) {
  // State for date range and interval controls
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [interval, setInterval] = useState<IntervalType>('1d');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Enhanced date picker state
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [startYear, setStartYear] = useState(startDate.getFullYear());
  const [startMonth, setStartMonth] = useState(startDate.getMonth());
  const [endYear, setEndYear] = useState(endDate.getFullYear());
  const [endMonth, setEndMonth] = useState(endDate.getMonth());
  
  const { toast } = useToast();

  // Build query parameters for the API
  const queryParams = {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
    interval
  };

  // Fetch real Yahoo Finance data using the Python-style endpoint
  const { 
    data: pythonData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<PythonYFinanceResponse>({
    queryKey: ['/api/yahoo-finance', symbol, queryParams.start, queryParams.end, queryParams.interval],
    queryFn: async () => {
      const url = new URL(`/api/yahoo-finance/${symbol}`, window.location.origin);
      url.searchParams.set('start', queryParams.start);
      url.searchParams.set('end', queryParams.end);
      url.searchParams.set('interval', queryParams.interval);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!symbol && symbol.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Transform Python-style data to chart format
  const chartData: ChartData[] = pythonData?.data?.map(record => ({
    date: record.Date,
    dateObj: new Date(record.Date),
    price: record.Price,
    priceDisplay: `$${record.Price.toFixed(2)}`,
    itemId: record.Item_Id
  })) || [];

  // Calculate stock info from data
  const stockInfo: StockInfo | null = pythonData ? {
    symbol: pythonData.meta.symbol,
    companyName: symbol === 'AAPL' ? 'Apple Inc.' : `${symbol} Corporation`,
    currentPrice: chartData[chartData.length - 1]?.price || 0,
    change: chartData.length >= 2 ? 
      chartData[chartData.length - 1].price - chartData[chartData.length - 2].price : 0,
    changePercent: chartData.length >= 2 ? 
      ((chartData[chartData.length - 1].price - chartData[chartData.length - 2].price) / 
       chartData[chartData.length - 2].price) * 100 : 0,
    recordCount: pythonData.meta.recordCount,
    dateRange: `${pythonData.meta.startDate} to ${pythonData.meta.endDate}`,
    interval: pythonData.meta.interval
  } : null;

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data Refreshed",
        description: `Updated ${symbol} stock data successfully`,
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh stock data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, symbol, toast]);

  // Handle preset date ranges
  const setPresetDateRange = (days: number) => {
    setStartDate(subDays(new Date(), days));
    setEndDate(new Date());
  };

  // Handle CSV export in Python yfinance format
  const handleExportCSV = useCallback(() => {
    if (!pythonData || !pythonData.data || pythonData.data.length === 0) {
      toast({
        title: "Export Failed",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content in exact Python yfinance format: Item_Id,Date,Price
      const csvHeaders = ['Item_Id', 'Date', 'Price'];
      const csvRows = pythonData.data.map(record => [
        record.Item_Id,
        record.Date,
        record.Price.toString()
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `${symbol.toLowerCase()}_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}_${interval}.csv`;
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `Downloaded ${filename} with ${pythonData.data.length} records`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV file",
        variant: "destructive",
      });
    }
  }, [pythonData, symbol, startDate, endDate, interval, toast]);

  // Enhanced date picker handlers
  const handleYearChange = (year: number, isStartDate: boolean) => {
    if (isStartDate) {
      setStartYear(year);
      const newDate = new Date(year, startMonth, 1);
      setStartDate(newDate);
    } else {
      setEndYear(year);
      const newDate = new Date(year, endMonth, 1);
      setEndDate(newDate);
    }
  };

  const handleMonthChange = (month: number, isStartDate: boolean) => {
    if (isStartDate) {
      setStartMonth(month);
      const newDate = new Date(startYear, month, 1);
      setStartDate(newDate);
    } else {
      setEndMonth(month);
      const newDate = new Date(endYear, month, 1);
      setEndDate(newDate);
    }
  };

  // Generate year options (last 20 years to next 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 22 }, (_, i) => currentYear - 19 + i);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{format(new Date(label), 'MMM dd, yyyy')}</p>
          <p className="text-sm text-blue-600">
            <span className="font-medium">Price: </span>
            ${data.value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Show error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading {symbol} data: {(error as any)?.message || 'Unknown error'}</span>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="mt-4"
            data-testid="button-retry"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Controls Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              {symbol} Stock Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={isLoading || !pythonData?.data || pythonData.data.length === 0}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading || isRefreshing}
                data-testid="button-refresh"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (isLoading || isRefreshing) && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-start-date">Start Date</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-start-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-2">
                      <Select
                        value={startYear.toString()}
                        onValueChange={(value) => handleYearChange(parseInt(value), true)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={startMonth.toString()}
                        onValueChange={(value) => handleMonthChange(parseInt(value), true)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setStartYear(date.getFullYear());
                        setStartMonth(date.getMonth());
                        setStartDateOpen(false);
                      }
                    }}
                    month={new Date(startYear, startMonth)}
                    onMonthChange={(date) => {
                      setStartYear(date.getFullYear());
                      setStartMonth(date.getMonth());
                    }}
                    initialFocus
                    data-testid="calendar-start-date"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-end-date">End Date</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-end-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center gap-2">
                      <Select
                        value={endYear.toString()}
                        onValueChange={(value) => handleYearChange(parseInt(value), false)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={endMonth.toString()}
                        onValueChange={(value) => handleMonthChange(parseInt(value), false)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setEndYear(date.getFullYear());
                        setEndMonth(date.getMonth());
                        setEndDateOpen(false);
                      }
                    }}
                    month={new Date(endYear, endMonth)}
                    onMonthChange={(date) => {
                      setEndYear(date.getFullYear());
                      setEndMonth(date.getMonth());
                    }}
                    initialFocus
                    data-testid="calendar-end-date"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-interval">Frequency</label>
              <TooltipProvider>
                <Select value={interval} onValueChange={(value: IntervalType) => setInterval(value)}>
                  <SelectTrigger data-testid="select-interval">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {/* Intraday frequencies */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                      {categoryLabels.intraday}
                    </div>
                    {frequencyOptions.filter(opt => opt.category === 'intraday').map((option) => (
                      <Tooltip key={option.value} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <SelectItem value={option.value} data-testid={`option-${option.value}`}>
                            <div className="flex items-center gap-2 w-full">
                              <option.icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{option.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    
                    {/* Daily frequencies */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">
                      {categoryLabels.daily}
                    </div>
                    {frequencyOptions.filter(opt => opt.category === 'daily').map((option) => (
                      <Tooltip key={option.value} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <SelectItem value={option.value} data-testid={`option-${option.value}`}>
                            <div className="flex items-center gap-2 w-full">
                              <option.icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{option.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    
                    {/* Long-term frequencies */}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mt-2">
                      {categoryLabels['long-term']}
                    </div>
                    {frequencyOptions.filter(opt => opt.category === 'long-term').map((option) => (
                      <Tooltip key={option.value} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <SelectItem value={option.value} data-testid={`option-${option.value}`}>
                            <div className="flex items-center gap-2 w-full">
                              <option.icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{option.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </SelectContent>
                </Select>
              </TooltipProvider>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-chart-type">Chart Type</label>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger data-testid="select-chart-type">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area" data-testid="option-area">
                    <div className="flex items-center gap-2">
                      <AreaChart className="h-4 w-4" />
                      Area Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line" data-testid="option-line">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preset Date Range Buttons */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPresetDateRange(7)}
                data-testid="button-7d"
              >
                7D
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPresetDateRange(30)}
                data-testid="button-30d"
              >
                30D
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPresetDateRange(90)}
                data-testid="button-90d"
              >
                3M
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPresetDateRange(180)}
                data-testid="button-180d"
              >
                6M
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPresetDateRange(365)}
                data-testid="button-365d"
              >
                1Y
              </Button>
            </div>
            
            {/* Smart Preset Combinations */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Popular Combinations</label>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPresetDateRange(1);
                          setInterval('5m');
                        }}
                        data-testid="button-intraday"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Intraday
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last 24 hours with 5-minute intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPresetDateRange(30);
                          setInterval('1h');
                        }}
                        data-testid="button-hourly-month"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Hourly Month
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last 30 days with 1-hour intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPresetDateRange(365);
                          setInterval('1wk');
                        }}
                        data-testid="button-weekly-year"
                      >
                        <TrendingUpIcon className="h-3 w-3 mr-1" />
                        Weekly Year
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last year with weekly intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPresetDateRange(365 * 5);
                          setInterval('3mo');
                        }}
                        data-testid="button-quarterly-5years"
                      >
                        <TrendingUpIcon className="h-3 w-3 mr-1" />
                        5Y Quarterly
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last 5 years with quarterly intervals</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Stock Info Display */}
          {stockInfo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
                <p className="text-lg font-bold text-blue-600" data-testid="text-current-price">
                  ${stockInfo.currentPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Change</p>
                <p className={cn(
                  "text-lg font-bold flex items-center justify-center gap-1",
                  stockInfo.change >= 0 ? "text-green-600" : "text-red-600"
                )} data-testid="text-price-change">
                  {stockInfo.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {stockInfo.change >= 0 ? '+' : ''}${stockInfo.change.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Change %</p>
                <p className={cn(
                  "text-lg font-bold",
                  stockInfo.changePercent >= 0 ? "text-green-600" : "text-red-600"
                )} data-testid="text-change-percent">
                  {stockInfo.changePercent >= 0 ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Records</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid="text-record-count">
                  {stockInfo.recordCount}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span data-testid="text-chart-title">
              {stockInfo?.companyName || symbol} - Real-Time Data
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs" data-testid="badge-interval">
                {interval.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs" data-testid="badge-data-source">
                Yahoo Finance
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading {symbol} data...</span>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">No data available</p>
                <p className="text-sm text-gray-500">Try adjusting the date range or symbol</p>
              </div>
            </div>
          ) : (
            <div style={{ height }} data-testid="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis 
                    dataKey="date"
                    stroke={colors.muted}
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    data-testid="chart-x-axis"
                  />
                  <YAxis 
                    stroke={colors.muted}
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    domain={['dataMin - 1', 'dataMax + 1']}
                    data-testid="chart-y-axis"
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {chartType === 'area' ? (
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={colors.primary}
                      fill={`${colors.primary}20`}
                      strokeWidth={2}
                      name="Price"
                      data-testid="chart-area"
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={false}
                      name="Price"
                      data-testid="chart-line"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Data Source Information */}
          {pythonData && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span data-testid="text-date-range">
                  Data Range: {stockInfo?.dateRange}
                </span>
                <span data-testid="text-last-updated">
                  Last Updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}