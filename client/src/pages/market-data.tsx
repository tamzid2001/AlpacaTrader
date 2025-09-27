import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { StockChart } from '@/components/ui/stock-chart';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { 
  TrendingUp, 
  TrendingDown,
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
  Loader2,
  Share2,
  Building2,
  Target,
  PieChart,
  Newspaper,
  LineChart,
  Calculator,
  Users,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Zap,
  Info
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import ShareDialog from '@/components/sharing/share-dialog';

// Comprehensive Yahoo Finance Data Interfaces
interface ComprehensiveTickerData {
  quote: QuoteData;
  earnings: EarningsData;
  financials: FinancialStatementsData;
  technicals: TechnicalIndicatorsData;
  options: OptionsData;
  analyst: AnalystData;
  news: NewsData;
  profile: CompanyProfileData;
  statistics: KeyStatisticsData;
  calendar: CalendarData;
  lastUpdated: string;
}

interface QuoteData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume: number;
  avgVolume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketState: string;
  currency: string;
  exchangeName: string;
  exchangeTimezone: string;
  lastUpdate: string;
}

interface EarningsData {
  recentEarnings: Array<{
    date: string;
    reportedEPS?: number;
    estimatedEPS?: number;
    surprise?: number;
    surprisePercent?: number;
    revenue?: number;
    estimatedRevenue?: number;
  }>;
  upcomingEarnings: Array<{
    date: string;
    estimatedEPS?: number;
    estimatedRevenue?: number;
  }>;
  earningsHistory: Array<{
    quarter: string;
    year: number;
    actualEPS?: number;
    estimateEPS?: number;
    revenue?: number;
  }>;
  earningsTrend: Array<{
    period: string;
    growth?: number;
    earningsEstimate?: {
      avg: number;
      low: number;
      high: number;
      count: number;
    };
    revenueEstimate?: {
      avg: number;
      low: number;
      high: number;
      count: number;
    };
  }>;
}

interface FinancialStatementsData {
  incomeStatement: {
    annual: FinancialPeriod[];
    quarterly: FinancialPeriod[];
  };
  balanceSheet: {
    annual: BalanceSheetPeriod[];
    quarterly: BalanceSheetPeriod[];
  };
  cashFlow: {
    annual: CashFlowPeriod[];
    quarterly: CashFlowPeriod[];
  };
}

interface FinancialPeriod {
  endDate: string;
  totalRevenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  operatingExpense?: number;
  operatingIncome?: number;
  netIncome?: number;
  ebitda?: number;
  eps?: number;
  sharesOutstanding?: number;
}

interface BalanceSheetPeriod {
  endDate: string;
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  cash?: number;
  totalDebt?: number;
  workingCapital?: number;
  retainedEarnings?: number;
}

interface CashFlowPeriod {
  endDate: string;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditures?: number;
}

interface TechnicalIndicatorsData {
  movingAverages: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
  };
  technicalSignals: {
    rsi?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  priceTargets: {
    high?: number;
    low?: number;
    mean?: number;
    median?: number;
  };
}

interface OptionsData {
  expirationDates: string[];
  calls: OptionContract[];
  puts: OptionContract[];
  impliedVolatility?: number;
  optionsVolume?: number;
  putCallRatio?: number;
}

interface OptionContract {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  openInterest?: number;
  bid?: number;
  ask?: number;
  impliedVolatility?: number;
  inTheMoney: boolean;
  expiration: string;
}

interface AnalystData {
  recommendations: {
    buy: number;
    hold: number;
    sell: number;
    strongBuy: number;
    strongSell: number;
    consensus: string;
  };
  priceTargets: {
    current: number;
    high: number;
    low: number;
    mean: number;
    median: number;
    count: number;
  };
  upgrades: Array<{
    date: string;
    firm: string;
    action: string;
    fromRating?: string;
    toRating?: string;
    priceTarget?: number;
  }>;
  downgrades: Array<{
    date: string;
    firm: string;
    action: string;
    fromRating?: string;
    toRating?: string;
    priceTarget?: number;
  }>;
}

interface NewsData {
  recentNews: Array<{
    title: string;
    publisher: string;
    publishTime: string;
    summary: string;
    link: string;
    source: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }>;
  pressReleases: Array<{
    title: string;
    publishTime: string;
    summary: string;
    link: string;
  }>;
}

interface CompanyProfileData {
  companyName: string;
  businessSummary: string;
  sector: string;
  industry: string;
  employees?: number;
  website?: string;
  headquarters: {
    city?: string;
    state?: string;
    country?: string;
  };
  executives: Array<{
    name: string;
    title: string;
    age?: number;
    compensation?: number;
  }>;
  description?: string;
  marketCap?: number;
  foundedYear?: number;
}

interface KeyStatisticsData {
  valuationMetrics: {
    peRatio?: number;
    pegRatio?: number;
    priceToBook?: number;
    priceToSales?: number;
    enterpriseValue?: number;
    evToRevenue?: number;
    evToEbitda?: number;
  };
  financialHealth: {
    currentRatio?: number;
    debtToEquity?: number;
    returnOnEquity?: number;
    returnOnAssets?: number;
    grossMargin?: number;
    operatingMargin?: number;
    profitMargin?: number;
  };
  dividendInfo: {
    dividendYield?: number;
    dividendRate?: number;
    payoutRatio?: number;
    exDividendDate?: string;
    lastDividendDate?: string;
  };
  shareInfo: {
    sharesOutstanding?: number;
    floatShares?: number;
    beta?: number;
    shortInterest?: number;
    shortRatio?: number;
  };
}

interface CalendarData {
  earnings: Array<{
    date: string;
    estimate?: number;
    confirmed: boolean;
  }>;
  dividends: Array<{
    exDate: string;
    payDate: string;
    amount: number;
  }>;
  splits: Array<{
    date: string;
    ratio: string;
  }>;
  events: Array<{
    date: string;
    event: string;
    description: string;
  }>;
}

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Debounced symbol for API calls (800ms delay for comprehensive data)
  const debouncedSymbol = useDebouncedValue(symbol, 800);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comprehensive Yahoo Finance data
  const { data: comprehensiveData, isLoading: dataLoading, error: dataError } = useQuery<ComprehensiveTickerData>({
    queryKey: ['/api/yahoo-finance', debouncedSymbol],
    enabled: !!debouncedSymbol && debouncedSymbol.length > 0,
  });

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol.toUpperCase());
  };

  const formatCurrency = (value?: number, currency = 'USD') => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value?: number, decimals = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatLargeNumber = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change >= 0 ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-600';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (dataError) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Comprehensive Market Data</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading market data: {(dataError as any)?.message || 'Unknown error'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Professional Market Dashboard</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          Powered by Yahoo Finance
        </Badge>
      </div>

      {/* Symbol Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter ticker symbol (e.g., AAPL, GOOGL, TSLA)"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="text-lg font-semibold"
                data-testid="input-ticker-symbol"
              />
            </div>
            {dataLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading comprehensive data...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {dataLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comprehensive Data Display */}
      {comprehensiveData && !dataLoading && (
        <>
          {/* Quote Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Current Price</p>
                    <p className="text-2xl font-bold">{formatCurrency(comprehensiveData.quote.price)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getChangeIcon(comprehensiveData.quote.change)}
                      <span className={`text-sm font-medium ${getChangeColor(comprehensiveData.quote.change)}`}>
                        {formatCurrency(comprehensiveData.quote.change)} ({formatPercent(comprehensiveData.quote.changePercent)})
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Market Cap</p>
                    <p className="text-2xl font-bold">{formatLargeNumber(comprehensiveData.quote.marketCap)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Volume: {formatNumber(comprehensiveData.quote.volume, 0)}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">P/E Ratio</p>
                    <p className="text-2xl font-bold">
                      {comprehensiveData.statistics.valuationMetrics.peRatio?.toFixed(2) || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Beta: {comprehensiveData.statistics.shareInfo.beta?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">52W Range</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(comprehensiveData.quote.fiftyTwoWeekLow)} - {formatCurrency(comprehensiveData.quote.fiftyTwoWeekHigh)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dividend Yield: {formatPercent(comprehensiveData.statistics.dividendInfo.dividendYield)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Info Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{comprehensiveData.quote.companyName}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary">{comprehensiveData.quote.symbol}</Badge>
                    <Badge variant="outline">{comprehensiveData.profile.sector}</Badge>
                    <Badge variant="outline">{comprehensiveData.profile.industry}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {comprehensiveData.quote.exchangeName} • {comprehensiveData.quote.marketState}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">
                    {new Date(comprehensiveData.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-Time Stock Chart - Now placed after company info */}
          <StockChart 
            symbol={debouncedSymbol} 
            onSymbolChange={handleSymbolChange}
            height={400}
            className="mb-2"
          />

          {/* Comprehensive Data Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <PieChart className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="financials" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Financials
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="options" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Options
              </TabsTrigger>
              <TabsTrigger value="technicals" className="flex items-center gap-1">
                <LineChart className="h-4 w-4" />
                Technicals
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-1">
                <Newspaper className="h-4 w-4" />
                News
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Key Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">P/E Ratio</p>
                        <p className="font-semibold">{comprehensiveData.statistics.valuationMetrics.peRatio?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">EPS</p>
                        <p className="font-semibold">{comprehensiveData.earnings.recentEarnings[0]?.reportedEPS?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{formatLargeNumber(comprehensiveData.earnings.recentEarnings[0]?.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit Margin</p>
                        <p className="font-semibold">{formatPercent(comprehensiveData.statistics.financialHealth.profitMargin)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ROE</p>
                        <p className="font-semibold">{formatPercent(comprehensiveData.statistics.financialHealth.returnOnEquity)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Debt/Equity</p>
                        <p className="font-semibold">{comprehensiveData.statistics.financialHealth.debtToEquity?.toFixed(2) || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Earnings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comprehensiveData.earnings.recentEarnings.length > 0 ? (
                      <div className="space-y-3">
                        {comprehensiveData.earnings.recentEarnings.slice(0, 3).map((earning, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{earning.date}</p>
                              <p className="text-sm text-muted-foreground">
                                EPS: {earning.reportedEPS?.toFixed(2) || 'N/A'} vs Est: {earning.estimatedEPS?.toFixed(2) || 'N/A'}
                              </p>
                            </div>
                            {earning.surprisePercent && (
                              <Badge variant={earning.surprisePercent >= 0 ? "default" : "destructive"}>
                                {earning.surprisePercent >= 0 ? '+' : ''}{earning.surprisePercent.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No recent earnings data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comprehensiveData.earnings.upcomingEarnings.map((earning, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div>
                            <p className="font-medium">Earnings Report</p>
                            <p className="text-sm text-muted-foreground">{earning.date}</p>
                          </div>
                          <Badge variant="outline">
                            Est: ${earning.estimatedEPS?.toFixed(2) || 'N/A'}
                          </Badge>
                        </div>
                      ))}
                      {comprehensiveData.statistics.dividendInfo.exDividendDate && (
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div>
                            <p className="font-medium">Ex-Dividend Date</p>
                            <p className="text-sm text-muted-foreground">{comprehensiveData.statistics.dividendInfo.exDividendDate}</p>
                          </div>
                          <Badge variant="outline">
                            ${comprehensiveData.statistics.dividendInfo.dividendRate?.toFixed(2) || 'N/A'}
                          </Badge>
                        </div>
                      )}
                      {comprehensiveData.earnings.upcomingEarnings.length === 0 && !comprehensiveData.statistics.dividendInfo.exDividendDate && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No upcoming events available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Technical Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Moving Averages</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">SMA 20:</span> {formatCurrency(comprehensiveData.technicals.movingAverages.sma20)}
                          </div>
                          <div>
                            <span className="font-medium">SMA 50:</span> {formatCurrency(comprehensiveData.technicals.movingAverages.sma50)}
                          </div>
                          <div>
                            <span className="font-medium">SMA 200:</span> {formatCurrency(comprehensiveData.technicals.movingAverages.sma200)}
                          </div>
                        </div>
                      </div>
                      {comprehensiveData.technicals.technicalSignals.rsi && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">RSI (14)</p>
                          <div className="flex items-center gap-2">
                            <Progress value={comprehensiveData.technicals.technicalSignals.rsi} className="flex-1" />
                            <span className="text-sm font-medium">{comprehensiveData.technicals.technicalSignals.rsi.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comprehensiveData.earnings.earningsHistory.slice(0, 6).map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{item.quarter} {item.year}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${item.actualEPS?.toFixed(2) || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Est: ${item.estimateEPS?.toFixed(2) || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Estimates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comprehensiveData.earnings.earningsTrend.map((trend, index) => (
                        <div key={index} className="p-4 bg-muted rounded-lg">
                          <p className="font-medium mb-2">{trend.period}</p>
                          {trend.earningsEstimate && (
                            <div className="space-y-1 text-sm">
                              <p>Avg Estimate: ${trend.earningsEstimate.avg.toFixed(2)}</p>
                              <p>Range: ${trend.earningsEstimate.low.toFixed(2)} - ${trend.earningsEstimate.high.toFixed(2)}</p>
                              <p>Analysts: {trend.earningsEstimate.count}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Statements Tab */}
            <TabsContent value="financials" className="space-y-6">
              <Tabs defaultValue="income" className="w-full">
                <TabsList>
                  <TabsTrigger value="income">Income Statement</TabsTrigger>
                  <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
                  <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                </TabsList>
                
                <TabsContent value="income">
                  <Card>
                    <CardHeader>
                      <CardTitle>Income Statement (Annual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Metric</th>
                              {comprehensiveData.financials.incomeStatement.annual.slice(0, 4).map((period, index) => (
                                <th key={index} className="text-right py-2">{period.endDate}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Revenue</td>
                              {comprehensiveData.financials.incomeStatement.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.totalRevenue)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Gross Profit</td>
                              {comprehensiveData.financials.incomeStatement.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.grossProfit)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Net Income</td>
                              {comprehensiveData.financials.incomeStatement.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.netIncome)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">EPS</td>
                              {comprehensiveData.financials.incomeStatement.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">${period.eps?.toFixed(2) || 'N/A'}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="balance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Balance Sheet (Annual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Metric</th>
                              {comprehensiveData.financials.balanceSheet.annual.slice(0, 4).map((period, index) => (
                                <th key={index} className="text-right py-2">{period.endDate}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Total Assets</td>
                              {comprehensiveData.financials.balanceSheet.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.totalAssets)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Total Debt</td>
                              {comprehensiveData.financials.balanceSheet.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.totalDebt)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Shareholders Equity</td>
                              {comprehensiveData.financials.balanceSheet.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.totalEquity)}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cashflow">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow Statement (Annual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Metric</th>
                              {comprehensiveData.financials.cashFlow.annual.slice(0, 4).map((period, index) => (
                                <th key={index} className="text-right py-2">{period.endDate}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Operating Cash Flow</td>
                              {comprehensiveData.financials.cashFlow.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.operatingCashFlow)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Free Cash Flow</td>
                              {comprehensiveData.financials.cashFlow.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.freeCashFlow)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 font-medium">Capital Expenditures</td>
                              {comprehensiveData.financials.cashFlow.annual.slice(0, 4).map((period, index) => (
                                <td key={index} className="text-right py-2">{formatLargeNumber(period.capitalExpenditures)}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>P/E Ratio</span>
                        <span className="font-semibold">{comprehensiveData.statistics.valuationMetrics.peRatio?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PEG Ratio</span>
                        <span className="font-semibold">{comprehensiveData.statistics.valuationMetrics.pegRatio?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price to Book</span>
                        <span className="font-semibold">{comprehensiveData.statistics.valuationMetrics.priceToBook?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price to Sales</span>
                        <span className="font-semibold">{comprehensiveData.statistics.valuationMetrics.priceToSales?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enterprise Value</span>
                        <span className="font-semibold">{formatLargeNumber(comprehensiveData.statistics.valuationMetrics.enterpriseValue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Current Ratio</span>
                        <span className="font-semibold">{comprehensiveData.statistics.financialHealth.currentRatio?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Debt to Equity</span>
                        <span className="font-semibold">{comprehensiveData.statistics.financialHealth.debtToEquity?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return on Equity</span>
                        <span className="font-semibold">{formatPercent(comprehensiveData.statistics.financialHealth.returnOnEquity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return on Assets</span>
                        <span className="font-semibold">{formatPercent(comprehensiveData.statistics.financialHealth.returnOnAssets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin</span>
                        <span className="font-semibold">{formatPercent(comprehensiveData.statistics.financialHealth.profitMargin)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dividend Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Dividend Yield</span>
                        <span className="font-semibold">{formatPercent(comprehensiveData.statistics.dividendInfo.dividendYield)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dividend Rate</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.statistics.dividendInfo.dividendRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payout Ratio</span>
                        <span className="font-semibold">{formatPercent(comprehensiveData.statistics.dividendInfo.payoutRatio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ex-Dividend Date</span>
                        <span className="font-semibold">{comprehensiveData.statistics.dividendInfo.exDividendDate || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Share Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Shares Outstanding</span>
                        <span className="font-semibold">{formatLargeNumber(comprehensiveData.statistics.shareInfo.sharesOutstanding)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Float</span>
                        <span className="font-semibold">{formatLargeNumber(comprehensiveData.statistics.shareInfo.floatShares)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beta</span>
                        <span className="font-semibold">{comprehensiveData.statistics.shareInfo.beta?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Short Interest</span>
                        <span className="font-semibold">{formatLargeNumber(comprehensiveData.statistics.shareInfo.shortInterest)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Company Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Business Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      {comprehensiveData.profile.businessSummary || 'No business summary available.'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sector</p>
                        <p className="font-semibold">{comprehensiveData.profile.sector || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-semibold">{comprehensiveData.profile.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="font-semibold">{comprehensiveData.profile.employees?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Headquarters</p>
                        <p className="font-semibold">
                          {[
                            comprehensiveData.profile.headquarters.city,
                            comprehensiveData.profile.headquarters.state,
                            comprehensiveData.profile.headquarters.country
                          ].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                      {comprehensiveData.profile.website && (
                        <div>
                          <p className="text-sm text-muted-foreground">Website</p>
                          <a 
                            href={comprehensiveData.profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-4 w-4" />
                            {comprehensiveData.profile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {comprehensiveData.profile.executives && comprehensiveData.profile.executives.length > 0 && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Key Executives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {comprehensiveData.profile.executives.slice(0, 6).map((exec, index) => (
                          <div key={index} className="p-4 bg-muted rounded-lg">
                            <p className="font-semibold">{exec.name}</p>
                            <p className="text-sm text-muted-foreground">{exec.title}</p>
                            {exec.age && <p className="text-sm">Age: {exec.age}</p>}
                            {exec.compensation && (
                              <p className="text-sm">Compensation: {formatLargeNumber(exec.compensation)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Options Tab */}
            <TabsContent value="options" className="space-y-6">
              <Tabs defaultValue="calls" className="w-full">
                <TabsList>
                  <TabsTrigger value="calls">Call Options</TabsTrigger>
                  <TabsTrigger value="puts">Put Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calls">
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comprehensiveData.options.calls.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Strike</th>
                                <th className="text-right py-2">Last Price</th>
                                <th className="text-right py-2">Change</th>
                                <th className="text-right py-2">Volume</th>
                                <th className="text-right py-2">Open Interest</th>
                                <th className="text-right py-2">Implied Vol</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comprehensiveData.options.calls.slice(0, 10).map((option, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 font-medium">${option.strike}</td>
                                  <td className="text-right py-2">${option.lastPrice.toFixed(2)}</td>
                                  <td className={`text-right py-2 ${getChangeColor(option.change)}`}>
                                    {option.change ? option.change.toFixed(2) : 'N/A'}
                                  </td>
                                  <td className="text-right py-2">{option.volume?.toLocaleString() || 'N/A'}</td>
                                  <td className="text-right py-2">{option.openInterest?.toLocaleString() || 'N/A'}</td>
                                  <td className="text-right py-2">{formatPercent(option.impliedVolatility)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No call options data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="puts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Put Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {comprehensiveData.options.puts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Strike</th>
                                <th className="text-right py-2">Last Price</th>
                                <th className="text-right py-2">Change</th>
                                <th className="text-right py-2">Volume</th>
                                <th className="text-right py-2">Open Interest</th>
                                <th className="text-right py-2">Implied Vol</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comprehensiveData.options.puts.slice(0, 10).map((option, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 font-medium">${option.strike}</td>
                                  <td className="text-right py-2">${option.lastPrice.toFixed(2)}</td>
                                  <td className={`text-right py-2 ${getChangeColor(option.change)}`}>
                                    {option.change ? option.change.toFixed(2) : 'N/A'}
                                  </td>
                                  <td className="text-right py-2">{option.volume?.toLocaleString() || 'N/A'}</td>
                                  <td className="text-right py-2">{option.openInterest?.toLocaleString() || 'N/A'}</td>
                                  <td className="text-right py-2">{formatPercent(option.impliedVolatility)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No put options data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Technical Analysis Tab */}
            <TabsContent value="technicals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Moving Averages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>SMA 20</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.movingAverages.sma20)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>SMA 50</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.movingAverages.sma50)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>SMA 200</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.movingAverages.sma200)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Technical Indicators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comprehensiveData.technicals.technicalSignals.rsi ? (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span>RSI (14)</span>
                            <span className="font-semibold">{comprehensiveData.technicals.technicalSignals.rsi.toFixed(1)}</span>
                          </div>
                          <Progress value={comprehensiveData.technicals.technicalSignals.rsi} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Oversold (30)</span>
                            <span>Overbought (70)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <LineChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No technical indicators data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Price Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>52W High</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.priceTargets.high)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>52W Low</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.priceTargets.low)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average</span>
                        <span className="font-semibold">{formatCurrency(comprehensiveData.technicals.priceTargets.mean)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Recent News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comprehensiveData.news.recentNews.length > 0 ? (
                    <div className="space-y-4">
                      {comprehensiveData.news.recentNews.slice(0, 10).map((article, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1">
                                <a 
                                  href={article.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {article.title}
                                </a>
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">{article.summary}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{article.publisher}</span>
                                <span>•</span>
                                <span>{new Date(article.publishTime).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {article.sentiment && (
                              <Badge 
                                variant={
                                  article.sentiment === 'positive' ? 'default' : 
                                  article.sentiment === 'negative' ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {article.sentiment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent news available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}