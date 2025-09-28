import { useEffect, useState, useCallback } from 'react';
import { 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle, 
  Loader2,
  BarChart3
} from 'lucide-react';

interface ChartData {
  time: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  priceDisplay: string;
}

interface StockInfo {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap?: string;
  pe?: number;
  dayRange?: string;
  yearRange?: string;
  isMarketOpen: boolean;
}

interface StockChartProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
  className?: string;
  height?: number;
}

type TimeFrame = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export function StockChart({ symbol, onSymbolChange, className = '', height = 400 }: StockChartProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('area');
  
  const { toast } = useToast();

  // Mock data generator for demonstration (in production, this would fetch real data)
  const generateMockData = useCallback((symbol: string, days: number): ChartData[] => {
    const data: ChartData[] = [];
    const basePrice = 150 + Math.random() * 200; // Random base price between 150-350
    let currentPrice = basePrice;
    
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price movement
      const volatility = 0.02; // 2% daily volatility
      const trend = (Math.random() - 0.5) * volatility * 2;
      const open = currentPrice;
      const change = open * trend;
      const close = open + change;
      
      // Generate high/low within realistic bounds
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      // Generate volume
      const baseVolume = 1000000 + Math.random() * 10000000;
      const volume = Math.floor(baseVolume * (1 + Math.abs(change / open) * 5));
      
      data.push({
        time: date.toLocaleDateString(),
        date,
        open,
        high,
        low,
        close,
        volume,
        priceDisplay: `$${close.toFixed(2)}`
      });
      
      currentPrice = close;
    }
    
    return data;
  }, []);

  // Generate mock stock info
  const generateMockStockInfo = useCallback((symbol: string, data: ChartData[]): StockInfo => {
    if (data.length === 0) {
      return {
        symbol,
        companyName: 'Unknown Company',
        currentPrice: 0,
        change: 0,
        changePercent: 0,
        isMarketOpen: false
      };
    }
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = latest.close - (previous?.close || latest.close);
    const changePercent = (change / (previous?.close || latest.close)) * 100;
    
    const companyNames: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla, Inc.',
      'SPY': 'SPDR S&P 500 ETF Trust',
      'NVDA': 'NVIDIA Corporation',
      'AMZN': 'Amazon.com, Inc.',
      'META': 'Meta Platforms, Inc.'
    };
    
    return {
      symbol,
      companyName: companyNames[symbol] || `${symbol} Corporation`,
      currentPrice: latest.close,
      change,
      changePercent,
      marketCap: `$${(Math.random() * 2000 + 100).toFixed(0)}B`,
      pe: Math.random() * 50 + 10,
      dayRange: `${(latest.low).toFixed(2)} - ${(latest.high).toFixed(2)}`,
      yearRange: `${(Math.min(...data.map(d => d.low))).toFixed(2)} - ${(Math.max(...data.map(d => d.high))).toFixed(2)}`,
      isMarketOpen: new Date().getHours() >= 9 && new Date().getHours() < 16
    };
  }, []);

  const getDaysForTimeFrame = (tf: TimeFrame): number => {
    switch (tf) {
      case '1D': return 1;
      case '5D': return 5;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      case '5Y': return 1825;
      default: return 30;
    }
  };

  const loadChartData = useCallback(async (currentSymbol: string, currentTimeFrame: TimeFrame) => {
    if (!currentSymbol.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Validate symbol (basic validation)
      if (currentSymbol.length < 1 || currentSymbol.length > 5) {
        throw new Error('Invalid ticker symbol');
      }
      
      const days = getDaysForTimeFrame(currentTimeFrame);
      const data = generateMockData(currentSymbol, days);
      const info = generateMockStockInfo(currentSymbol, data);
      
      setChartData(data);
      setStockInfo(info);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      setError(errorMessage);
      setStockInfo(null);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockData, generateMockStockInfo]);

  // Load data when symbol or timeframe changes
  useEffect(() => {
    if (symbol) {
      loadChartData(symbol, timeFrame);
    }
  }, [symbol, timeFrame, loadChartData]);

  const timeFrames: TimeFrame[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">Open: ${data.open?.toFixed(2)}</p>
            <p className="text-blue-600">High: ${data.high?.toFixed(2)}</p>
            <p className="text-red-600">Low: ${data.low?.toFixed(2)}</p>
            <p className="font-semibold">Close: ${data.close?.toFixed(2)}</p>
            {data.volume && (
              <p className="text-muted-foreground">Volume: {data.volume.toLocaleString()}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    const minPrice = Math.min(...chartData.map(d => d.low)) * 0.95;
    const maxPrice = Math.max(...chartData.map(d => d.high)) * 1.05;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--foreground))"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="price"
            domain={[minPrice, maxPrice]}
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          {showVolume && (
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {chartType === 'area' && (
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
              name="Price"
            />
          )}
          
          {chartType === 'line' && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
          )}
          
          {chartType === 'candlestick' && (
            <>
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="high"
                stroke="transparent"
                dot={false}
                name="High"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="low"
                stroke="transparent"
                dot={false}
                name="Low"
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                name="Close Price"
              />
            </>
          )}
          
          {showVolume && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="hsl(var(--muted))"
              opacity={0.6}
              name="Volume"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={`w-full ${className}`} data-testid="stock-chart-container">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Real-Time Stock Chart
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              {stockInfo && (
                <Badge 
                  variant={stockInfo.isMarketOpen ? "default" : "secondary"}
                  className="text-xs"
                  data-testid="market-status-badge"
                >
                  {stockInfo.isMarketOpen ? "Market Open" : "Market Closed"}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 border rounded-md p-1">
                {timeFrames.map((tf) => (
                  <Button
                    key={tf}
                    variant={timeFrame === tf ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setTimeFrame(tf)}
                    data-testid={`button-timeframe-${tf.toLowerCase()}`}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={chartType === 'area' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType('area')}
                  data-testid="button-chart-area"
                >
                  Area
                </Button>
                <Button
                  variant={chartType === 'line' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType('line')}
                  data-testid="button-chart-line"
                >
                  Line
                </Button>
                <Button
                  variant={showVolume ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                  data-testid="button-toggle-volume"
                >
                  <Activity className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Volume</span>
                </Button>
              </div>
            </div>
          </div>
        
          {/* Stock Info */}
          {stockInfo && !error && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t" data-testid="stock-info-section">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-stock-symbol">{stockInfo.symbol}</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-company-name">{stockInfo.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" data-testid="text-current-price">
                    ${stockInfo.currentPrice.toFixed(2)}
                  </span>
                  <div className={`flex items-center gap-1 ${stockInfo.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockInfo.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-medium" data-testid="text-price-change">
                      ${Math.abs(stockInfo.change).toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {stockInfo.marketCap && (
                  <span data-testid="text-market-cap">Market Cap: {stockInfo.marketCap}</span>
                )}
                {stockInfo.pe && (
                  <span data-testid="text-pe-ratio">P/E: {stockInfo.pe.toFixed(1)}</span>
                )}
                {stockInfo.dayRange && (
                  <span data-testid="text-day-range">Day: {stockInfo.dayRange}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center" data-testid="chart-error-state">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Chart</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => loadChartData(symbol, timeFrame)}
              data-testid="button-retry-chart"
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-96" data-testid="chart-loading-state">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="w-full border rounded-lg p-4"
              data-testid="chart-canvas"
            >
              {renderChart()}
            </div>
            
            {symbol && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Timeframe: {timeFrame} • Chart Type: {chartType}</span>
                <span>Powered by Recharts</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}