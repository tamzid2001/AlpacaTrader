import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { StockChart } from '@/components/ui/stock-chart';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Settings, 
  Clock, 
  FileText, 
  BarChart3,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface MarketDataOptions {
  intervals: Array<{ value: string; label: string }>;
  periods: Array<{ 
    label: string; 
    value: string; 
    startDate: string; 
    endDate: string; 
  }>;
  popularSymbols: Array<{
    symbol: string;
    name: string;
    sector: string;
  }>;
}

interface MarketDataDownload {
  id: string;
  symbol: string;
  startDate: string;
  endDate: string;
  interval: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  downloadType: 'single' | 'batch';
  status: 'pending' | 'completed' | 'error';
  downloadedAt: string;
}

interface PopularSymbol {
  symbol: string;
  companyName?: string;
  downloadCount: number;
  lastDownloaded: string;
  sector?: string;
  isActive: boolean;
}

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [interval, setInterval] = useState('1d');
  const [multipleSymbols, setMultipleSymbols] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [validatingSymbol, setValidatingSymbol] = useState('');
  
  // Debounced symbol for chart updates (500ms delay)
  const debouncedSymbol = useDebouncedValue(symbol, 500);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch market data options
  const { data: options, isLoading: optionsLoading } = useQuery<MarketDataOptions>({
    queryKey: ['/api/market-data/options'],
  });

  // Fetch user's download history
  const { data: downloads = [], isLoading: downloadsLoading } = useQuery<MarketDataDownload[]>({
    queryKey: ['/api/market-data/downloads'],
  });

  // Fetch popular symbols
  const { data: popularSymbols = [], isLoading: popularSymbolsLoading } = useQuery<PopularSymbol[]>({
    queryKey: ['/api/market-data/popular-symbols'],
  });

  // Download single symbol mutation
  const downloadSingleMutation = useMutation({
    mutationFn: async (params: { symbol: string; startDate: string; endDate: string; interval: string }) => {
      const response = await fetch(
        `/api/market-data/download/${params.symbol}?startDate=${params.startDate}&endDate=${params.endDate}&interval=${params.interval}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }
      
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `${params.symbol}_data.csv`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { filename, size: blob.size };
    },
    onSuccess: (data) => {
      toast({
        title: 'Download Successful',
        description: `${data.filename} downloaded successfully (${(data.size / 1024).toFixed(1)} KB)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/market-data/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market-data/popular-symbols'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Batch download mutation
  const batchDownloadMutation = useMutation({
    mutationFn: async (params: { symbols: string[]; startDate: string; endDate: string; interval: string }) => {
      const response = await apiRequest('/api/market-data/batch-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch download failed');
      }
      
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'market_data_batch.zip';
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { filename, size: blob.size };
    },
    onSuccess: (data) => {
      toast({
        title: 'Batch Download Successful',
        description: `${data.filename} downloaded successfully (${(data.size / 1024 / 1024).toFixed(1)} MB)`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/market-data/downloads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market-data/popular-symbols'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Batch Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDownloadSingle = async () => {
    if (!symbol.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a ticker symbol',
        variant: 'destructive',
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select start and end dates',
        variant: 'destructive',
      });
      return;
    }

    downloadSingleMutation.mutate({
      symbol: symbol.trim().toUpperCase(),
      startDate,
      endDate,
      interval,
    });
  };

  const handleBatchDownload = async () => {
    const symbols = multipleSymbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (symbols.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one ticker symbol',
        variant: 'destructive',
      });
      return;
    }

    if (symbols.length > 50) {
      toast({
        title: 'Validation Error',
        description: 'Maximum 50 symbols allowed per batch',
        variant: 'destructive',
      });
      return;
    }

    batchDownloadMutation.mutate({
      symbols,
      startDate,
      endDate,
      interval,
    });
  };

  const handleQuickDownload = (quickSymbol: string) => {
    setSymbol(quickSymbol);
    downloadSingleMutation.mutate({
      symbol: quickSymbol,
      startDate,
      endDate,
      interval,
    });
  };

  // Handle symbol selection from chart or popular symbols
  const handleSymbolSelect = (selectedSymbol: string) => {
    setSymbol(selectedSymbol.toUpperCase());
  };

  const handleQuickPeriod = (period: any) => {
    setStartDate(period.startDate);
    setEndDate(period.endDate);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getIntervalLabel = (intervalValue: string) => {
    return options?.intervals.find(i => i.value === intervalValue)?.label || intervalValue;
  };

  if (optionsLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Market Data Downloads</h1>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Market Data Downloads</h1>
        <Badge variant="secondary" className="ml-auto">
          yfinance equivalent
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Real-Time Stock Chart */}
        <StockChart 
          symbol={debouncedSymbol} 
          onSymbolChange={handleSymbolSelect}
          height={500}
          className="mb-2"
        />
        
        {/* Main Download Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single Symbol Download */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Single Symbol Download</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ticker Symbol</label>
                  <Input
                    placeholder="Enter ticker (e.g., AAPL)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    data-testid="input-ticker-symbol"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Interval</label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger data-testid="select-interval">
                      <SelectValue placeholder="Interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.intervals.map((int) => (
                        <SelectItem key={int.value} value={int.value}>
                          {int.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium invisible">Download</label>
                  <Button
                    onClick={handleDownloadSingle}
                    disabled={downloadSingleMutation.isPending}
                    className="w-full"
                    data-testid="button-download-single"
                  >
                    {downloadSingleMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Periods */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick Periods</label>
                <div className="flex flex-wrap gap-2">
                  {options?.periods.map((period) => (
                    <Button
                      key={period.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPeriod(period)}
                      data-testid={`button-period-${period.value}`}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch Download */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Batch Download</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Multiple Symbols (comma-separated)</label>
                  <Textarea
                    placeholder="Enter multiple tickers separated by commas (e.g., AAPL, GOOGL, MSFT, TSLA)"
                    value={multipleSymbols}
                    onChange={(e) => setMultipleSymbols(e.target.value)}
                    className="h-24"
                    data-testid="textarea-multiple-symbols"
                  />
                </div>
                
                <Button
                  onClick={handleBatchDownload}
                  disabled={batchDownloadMutation.isPending}
                  variant="outline"
                  data-testid="button-download-multiple"
                >
                  {batchDownloadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Batch ZIP
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Symbols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Symbols
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularSymbolsLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(options?.popularSymbols || []).map((stock) => (
                  <div key={stock.symbol} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSymbolSelect(stock.symbol)}
                      data-testid={`button-popular-${stock.symbol.toLowerCase()}`}
                      className="flex-1"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      {stock.symbol}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickDownload(stock.symbol)}
                      data-testid={`button-download-${stock.symbol.toLowerCase()}`}
                      className="px-2"
                      title={`Download ${stock.symbol} data`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Download History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {downloadsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : downloads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No downloads yet. Start by downloading some market data!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {downloads.slice(0, 10).map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {download.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : download.status === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        <span className="font-medium">{download.symbol}</span>
                        <Badge variant={download.downloadType === 'batch' ? 'default' : 'secondary'} className="text-xs">
                          {download.downloadType}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {download.startDate} to {download.endDate} • {getIntervalLabel(download.interval)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(download.fileSize)}</span>
                      <span>{download.recordCount} records</span>
                      <span>{format(new Date(download.downloadedAt), 'MMM d, HH:mm')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (download.downloadType === 'single') {
                            handleQuickDownload(download.symbol);
                          }
                        }}
                        data-testid={`button-redownload-${download.id}`}
                        disabled={downloadSingleMutation.isPending || batchDownloadMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {popularSymbols.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Market Data Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {popularSymbols.reduce((sum, s) => sum + s.downloadCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Downloads</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{popularSymbols.length}</div>
                  <div className="text-sm text-muted-foreground">Unique Symbols</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{downloads.length}</div>
                  <div className="text-sm text-muted-foreground">Your Downloads</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}