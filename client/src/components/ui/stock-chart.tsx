import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  RefreshCw
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
type IntervalType = '1d' | '1wk' | '1mo';

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
              <Popover>
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
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    data-testid="calendar-start-date"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-end-date">End Date</label>
              <Popover>
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
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    data-testid="calendar-end-date"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" data-testid="label-interval">Frequency</label>
              <Select value={interval} onValueChange={(value: IntervalType) => setInterval(value)}>
                <SelectTrigger data-testid="select-interval">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d" data-testid="option-1d">Daily (1d)</SelectItem>
                  <SelectItem value="1wk" data-testid="option-1wk">Weekly (1wk)</SelectItem>
                  <SelectItem value="1mo" data-testid="option-1mo">Monthly (1mo)</SelectItem>
                </SelectContent>
              </Select>
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
                  <Tooltip content={<CustomTooltip />} />
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