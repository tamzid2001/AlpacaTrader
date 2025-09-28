import yahooFinance from 'yahoo-finance2';
import { format } from 'date-fns';

// Python yfinance-style data interfaces
export interface PythonYFinanceRecord {
  Item_Id: string;
  Date: string;
  Price: number;
}

export interface PythonYFinanceResponse {
  data: PythonYFinanceRecord[];
  meta: {
    symbol: string;
    interval: string;
    startDate: string;
    endDate: string;
    recordCount: number;
  };
}

// Comprehensive Yahoo Finance data interfaces
export interface ComprehensiveTickerData {
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

export interface QuoteData {
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

export interface EarningsData {
  recentEarnings: {
    date: string;
    reportedEPS?: number;
    estimatedEPS?: number;
    surprise?: number;
    surprisePercent?: number;
    revenue?: number;
    estimatedRevenue?: number;
  }[];
  upcomingEarnings: {
    date: string;
    estimatedEPS?: number;
    estimatedRevenue?: number;
  }[];
  earningsHistory: {
    quarter: string;
    year: number;
    actualEPS?: number;
    estimateEPS?: number;
    revenue?: number;
  }[];
  earningsTrend: {
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
  }[];
}

export interface FinancialStatementsData {
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

export interface FinancialPeriod {
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

export interface BalanceSheetPeriod {
  endDate: string;
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  cash?: number;
  totalDebt?: number;
  workingCapital?: number;
  retainedEarnings?: number;
}

export interface CashFlowPeriod {
  endDate: string;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditures?: number;
}

export interface TechnicalIndicatorsData {
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

export interface OptionsData {
  expirationDates: string[];
  calls: OptionContract[];
  puts: OptionContract[];
  impliedVolatility?: number;
  optionsVolume?: number;
  putCallRatio?: number;
}

export interface OptionContract {
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

export interface AnalystData {
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
  upgrades: {
    date: string;
    firm: string;
    action: string;
    fromRating?: string;
    toRating?: string;
    priceTarget?: number;
  }[];
  downgrades: {
    date: string;
    firm: string;
    action: string;
    fromRating?: string;
    toRating?: string;
    priceTarget?: number;
  }[];
}

export interface NewsData {
  recentNews: {
    title: string;
    publisher: string;
    publishTime: string;
    summary: string;
    link: string;
    source: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  }[];
  pressReleases: {
    title: string;
    publishTime: string;
    summary: string;
    link: string;
  }[];
}

export interface CompanyProfileData {
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
  executives: {
    name: string;
    title: string;
    age?: number;
    compensation?: number;
  }[];
  description?: string;
  marketCap?: number;
  foundedYear?: number;
}

export interface KeyStatisticsData {
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

export interface CalendarData {
  earnings: {
    date: string;
    estimate?: number;
    confirmed: boolean;
  }[];
  dividends: {
    exDate: string;
    payDate: string;
    amount: number;
  }[];
  splits: {
    date: string;
    ratio: string;
  }[];
  events: {
    date: string;
    event: string;
    description: string;
  }[];
}

export class ComprehensiveYahooFinanceService {
  
  /**
   * Get ALL available Yahoo Finance data for a ticker
   */
  async getComprehensiveTickerData(symbol: string): Promise<ComprehensiveTickerData> {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      // Fetch all data in parallel for better performance
      const [
        quoteData,
        earningsData,
        financialsData,
        statisticsData,
        profileData,
        newsData,
        optionsData,
        technicalData,
        calendarData
      ] = await Promise.allSettled([
        this.getQuoteData(upperSymbol),
        this.getEarningsData(upperSymbol),
        this.getFinancialStatements(upperSymbol),
        this.getKeyStatistics(upperSymbol),
        this.getCompanyProfile(upperSymbol),
        this.getNewsData(upperSymbol),
        this.getOptionsData(upperSymbol),
        this.getTechnicalIndicators(upperSymbol),
        this.getCalendarData(upperSymbol)
      ]);

      return {
        quote: quoteData.status === 'fulfilled' ? quoteData.value : this.getEmptyQuoteData(upperSymbol),
        earnings: earningsData.status === 'fulfilled' ? earningsData.value : this.getEmptyEarningsData(),
        financials: financialsData.status === 'fulfilled' ? financialsData.value : this.getEmptyFinancialsData(),
        technicals: technicalData.status === 'fulfilled' ? technicalData.value : this.getEmptyTechnicalData(),
        options: optionsData.status === 'fulfilled' ? optionsData.value : this.getEmptyOptionsData(),
        analyst: { recommendations: { buy: 0, hold: 0, sell: 0, strongBuy: 0, strongSell: 0, consensus: 'HOLD' }, priceTargets: { current: 0, high: 0, low: 0, mean: 0, median: 0, count: 0 }, upgrades: [], downgrades: [] },
        news: newsData.status === 'fulfilled' ? newsData.value : this.getEmptyNewsData(),
        profile: profileData.status === 'fulfilled' ? profileData.value : this.getEmptyProfileData(upperSymbol),
        statistics: statisticsData.status === 'fulfilled' ? statisticsData.value : this.getEmptyStatisticsData(),
        calendar: calendarData.status === 'fulfilled' ? calendarData.value : this.getEmptyCalendarData(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch comprehensive data for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get current quote data
   */
  async getQuoteData(symbol: string): Promise<QuoteData> {
    const quote = await yahooFinance.quoteSummary(symbol, {
      modules: ['price', 'summaryDetail']
    });

    const price = quote.price;
    const summaryDetail = quote.summaryDetail;

    return {
      symbol,
      companyName: price?.longName || price?.shortName || symbol,
      price: price?.regularMarketPrice || 0,
      change: price?.regularMarketChange || 0,
      changePercent: price?.regularMarketChangePercent || 0,
      marketCap: price?.marketCap,
      volume: price?.regularMarketVolume || 0,
      avgVolume: summaryDetail?.averageVolume || 0,
      open: price?.regularMarketOpen || 0,
      high: price?.regularMarketDayHigh || 0,
      low: price?.regularMarketDayLow || 0,
      previousClose: price?.regularMarketPreviousClose || 0,
      fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow || 0,
      marketState: price?.marketState || 'UNKNOWN',
      currency: price?.currency || 'USD',
      exchangeName: price?.exchangeName || '',
      exchangeTimezone: price?.exchangeTimezoneName || price?.exchangeTimezoneShortName || '',
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get earnings data
   */
  async getEarningsData(symbol: string): Promise<EarningsData> {
    try {
      const earnings = await yahooFinance.quoteSummary(symbol, {
        modules: ['earnings', 'earningsHistory', 'earningsTrend', 'calendarEvents']
      });

      const earningsHistory = earnings.earningsHistory?.history || [];
      const earningsTrend = earnings.earningsTrend?.trend || [];
      const calendarEvents = earnings.calendarEvents;

      return {
        recentEarnings: earningsHistory.slice(0, 4).map((item: any) => ({
          date: item.quarter || '',
          reportedEPS: item.epsActual,
          estimatedEPS: item.epsEstimate,
          surprise: item.epsDifference,
          surprisePercent: item.surprisePercent
        })),
        upcomingEarnings: calendarEvents?.earnings ? [{
          date: calendarEvents.earnings.earningsDate?.[0] ? new Date(calendarEvents.earnings.earningsDate[0]).toISOString() : '',
          estimatedEPS: calendarEvents.earnings.earningsAverage,
          estimatedRevenue: calendarEvents.earnings.revenueAverage
        }] : [],
        earningsHistory: earningsHistory.map((item: any) => ({
          quarter: item.quarter?.fmt || '',
          year: new Date(item.quarter?.fmt || '').getFullYear() || 0,
          actualEPS: item.epsActual?.raw,
          estimateEPS: item.epsEstimate?.raw
        })),
        earningsTrend: earningsTrend.map((item: any) => ({
          period: item.period,
          growth: item.growth?.raw,
          earningsEstimate: item.earningsEstimate ? {
            avg: item.earningsEstimate.avg?.raw || 0,
            low: item.earningsEstimate.low?.raw || 0,
            high: item.earningsEstimate.high?.raw || 0,
            count: item.earningsEstimate.numberOfAnalysts?.raw || 0
          } : undefined,
          revenueEstimate: item.revenueEstimate ? {
            avg: item.revenueEstimate.avg?.raw || 0,
            low: item.revenueEstimate.low?.raw || 0,
            high: item.revenueEstimate.high?.raw || 0,
            count: item.revenueEstimate.numberOfAnalysts?.raw || 0
          } : undefined
        }))
      };
    } catch (error) {
      return this.getEmptyEarningsData();
    }
  }

  /**
   * Get financial statements
   */
  async getFinancialStatements(symbol: string): Promise<FinancialStatementsData> {
    try {
      const financials = await yahooFinance.quoteSummary(symbol, {
        modules: ['incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory',
                 'incomeStatementHistoryQuarterly', 'balanceSheetHistoryQuarterly', 'cashflowStatementHistoryQuarterly']
      });

      const processIncomeStatement = (statements: any[]) => statements.map((stmt: any) => ({
        endDate: stmt.endDate?.fmt || '',
        totalRevenue: stmt.totalRevenue?.raw,
        costOfRevenue: stmt.costOfRevenue?.raw,
        grossProfit: stmt.grossProfit?.raw,
        operatingExpense: stmt.totalOperatingExpenses?.raw,
        operatingIncome: stmt.operatingIncome?.raw,
        netIncome: stmt.netIncome?.raw,
        ebitda: stmt.ebitda?.raw,
        eps: stmt.dilutedEPS?.raw,
        sharesOutstanding: stmt.dilutedAverageShares?.raw
      }));

      const processBalanceSheet = (statements: any[]) => statements.map((stmt: any) => ({
        endDate: stmt.endDate?.fmt || '',
        totalAssets: stmt.totalAssets?.raw,
        totalLiabilities: stmt.totalLiab?.raw,
        totalEquity: stmt.totalStockholderEquity?.raw,
        cash: stmt.cash?.raw,
        totalDebt: stmt.totalDebt?.raw,
        workingCapital: stmt.totalCurrentAssets?.raw && stmt.totalCurrentLiabilities?.raw ? 
          stmt.totalCurrentAssets.raw - stmt.totalCurrentLiabilities.raw : undefined,
        retainedEarnings: stmt.retainedEarnings?.raw
      }));

      const processCashFlow = (statements: any[]) => statements.map((stmt: any) => ({
        endDate: stmt.endDate?.fmt || '',
        operatingCashFlow: stmt.totalCashFromOperatingActivities?.raw,
        investingCashFlow: stmt.totalCashflowsFromInvestingActivities?.raw,
        financingCashFlow: stmt.totalCashFromFinancingActivities?.raw,
        freeCashFlow: stmt.freeCashflow?.raw,
        capitalExpenditures: stmt.capitalExpenditures?.raw
      }));

      return {
        incomeStatement: {
          annual: processIncomeStatement(financials.incomeStatementHistory?.incomeStatementHistory || []),
          quarterly: processIncomeStatement(financials.incomeStatementHistoryQuarterly?.incomeStatementHistory || [])
        },
        balanceSheet: {
          annual: processBalanceSheet(financials.balanceSheetHistory?.balanceSheetStatements || []),
          quarterly: processBalanceSheet(financials.balanceSheetHistoryQuarterly?.balanceSheetStatements || [])
        },
        cashFlow: {
          annual: processCashFlow(financials.cashflowStatementHistory?.cashflowStatements || []),
          quarterly: processCashFlow(financials.cashflowStatementHistoryQuarterly?.cashflowStatements || [])
        }
      };
    } catch (error) {
      return this.getEmptyFinancialsData();
    }
  }

  /**
   * Get key statistics
   */
  async getKeyStatistics(symbol: string): Promise<KeyStatisticsData> {
    try {
      const stats = await yahooFinance.quoteSummary(symbol, {
        modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail']
      });

      const keyStats = stats.defaultKeyStatistics;
      const financialData = stats.financialData;
      const summaryDetail = stats.summaryDetail;

      return {
        valuationMetrics: {
          peRatio: summaryDetail?.trailingPE,
          pegRatio: keyStats?.pegRatio,
          priceToBook: keyStats?.priceToBook,
          priceToSales: keyStats?.priceToSales,
          enterpriseValue: keyStats?.enterpriseValue,
          evToRevenue: keyStats?.enterpriseToRevenue,
          evToEbitda: keyStats?.enterpriseToEbitda
        },
        financialHealth: {
          currentRatio: financialData?.currentRatio,
          debtToEquity: financialData?.debtToEquity,
          returnOnEquity: financialData?.returnOnEquity,
          returnOnAssets: financialData?.returnOnAssets,
          grossMargin: financialData?.grossMargins,
          operatingMargin: financialData?.operatingMargins,
          profitMargin: financialData?.profitMargins
        },
        dividendInfo: {
          dividendYield: summaryDetail?.dividendYield,
          dividendRate: summaryDetail?.dividendRate,
          payoutRatio: keyStats?.payoutRatio || summaryDetail?.payoutRatio,
          exDividendDate: keyStats?.exDividendDate ? new Date(keyStats.exDividendDate).toISOString() : undefined,
          lastDividendDate: keyStats?.lastDividendDate ? new Date(keyStats.lastDividendDate).toISOString() : undefined
        },
        shareInfo: {
          sharesOutstanding: keyStats?.sharesOutstanding,
          floatShares: keyStats?.floatShares,
          beta: summaryDetail?.beta,
          shortInterest: keyStats?.sharesShort,
          shortRatio: keyStats?.shortRatio
        }
      };
    } catch (error) {
      return this.getEmptyStatisticsData();
    }
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfileData> {
    try {
      const profile = await yahooFinance.quoteSummary(symbol, {
        modules: ['assetProfile', 'summaryProfile']
      });

      const assetProfile = profile.assetProfile;
      const summaryProfile = profile.summaryProfile;

      return {
        companyName: assetProfile?.longBusinessSummary || summaryProfile?.name || symbol,
        businessSummary: assetProfile?.longBusinessSummary || '',
        sector: assetProfile?.sector || '',
        industry: assetProfile?.industry || '',
        employees: assetProfile?.fullTimeEmployees,
        website: assetProfile?.website,
        headquarters: {
          city: assetProfile?.city,
          state: assetProfile?.state,
          country: assetProfile?.country
        },
        executives: (assetProfile?.companyOfficers || []).map((exec: any) => ({
          name: exec.name,
          title: exec.title,
          age: exec.age,
          compensation: exec.totalPay?.raw
        })),
        description: assetProfile?.longBusinessSummary
      };
    } catch (error) {
      return this.getEmptyProfileData(symbol);
    }
  }

  /**
   * Get news data
   */
  async getNewsData(symbol: string): Promise<NewsData> {
    try {
      const search = await yahooFinance.search(symbol, { newsCount: 20 });
      const news = search.news || [];

      return {
        recentNews: news.map((item: any) => ({
          title: item.title || '',
          publisher: item.publisher || '',
          publishTime: new Date(item.providerPublishTime * 1000).toISOString(),
          summary: item.summary || '',
          link: item.link || '',
          source: item.source || item.publisher || ''
        })),
        pressReleases: []
      };
    } catch (error) {
      return this.getEmptyNewsData();
    }
  }

  /**
   * Get options data
   */
  async getOptionsData(symbol: string): Promise<OptionsData> {
    try {
      const options = await yahooFinance.options(symbol, {});
      
      if (!options || !options.options || options.options.length === 0) {
        return this.getEmptyOptionsData();
      }

      const firstExpiration = options.options[0];
      
      return {
        expirationDates: options.expirationDates?.map((date: Date) => 
          new Date(date).toISOString().split('T')[0]
        ) || [],
        calls: (firstExpiration.calls || []).map((call: any) => ({
          contractSymbol: call.contractSymbol || '',
          strike: call.strike || 0,
          lastPrice: call.lastPrice || 0,
          change: call.change,
          changePercent: call.percentChange,
          volume: call.volume,
          openInterest: call.openInterest,
          bid: call.bid,
          ask: call.ask,
          impliedVolatility: call.impliedVolatility,
          inTheMoney: call.inTheMoney || false,
          expiration: new Date(call.expiration * 1000).toISOString().split('T')[0]
        })),
        puts: (firstExpiration.puts || []).map((put: any) => ({
          contractSymbol: put.contractSymbol || '',
          strike: put.strike || 0,
          lastPrice: put.lastPrice || 0,
          change: put.change,
          changePercent: put.percentChange,
          volume: put.volume,
          openInterest: put.openInterest,
          bid: put.bid,
          ask: put.ask,
          impliedVolatility: put.impliedVolatility,
          inTheMoney: put.inTheMoney || false,
          expiration: new Date(put.expiration * 1000).toISOString().split('T')[0]
        }))
      };
    } catch (error) {
      return this.getEmptyOptionsData();
    }
  }

  /**
   * Get technical indicators (simplified implementation)
   */
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicatorsData> {
    try {
      // Get historical data for technical analysis
      const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        period2: new Date(),
        interval: '1d'
      });

      if (!historical || historical.length === 0) {
        return this.getEmptyTechnicalData();
      }

      const prices = historical.map(h => h.close);
      const volumes = historical.map(h => h.volume);

      // Calculate simple moving averages
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, 50);
      const sma200 = this.calculateSMA(prices, 200);

      return {
        movingAverages: {
          sma20,
          sma50,
          sma200
        },
        technicalSignals: {
          rsi: this.calculateRSI(prices, 14)
        },
        priceTargets: {
          high: Math.max(...prices.slice(-52)),  // 52-week high
          low: Math.min(...prices.slice(-52)),   // 52-week low
          mean: prices.reduce((a, b) => a + b, 0) / prices.length
        }
      };
    } catch (error) {
      return this.getEmptyTechnicalData();
    }
  }

  /**
   * Get calendar data
   */
  async getCalendarData(symbol: string): Promise<CalendarData> {
    try {
      const calendar = await yahooFinance.quoteSummary(symbol, {
        modules: ['calendarEvents']
      });

      const events = calendar.calendarEvents;

      return {
        earnings: events?.earnings?.earningsDate ? [{
          date: events.earnings.earningsDate[0] ? new Date(events.earnings.earningsDate[0]).toISOString() : '',
          estimate: events.earnings.earningsAverage,
          confirmed: true
        }] : [],
        dividends: events?.dividendHistory ? events.dividendHistory.map((div: any) => ({
          exDate: div.exDividendDate ? new Date(div.exDividendDate).toISOString() : '',
          payDate: div.paymentDate ? new Date(div.paymentDate).toISOString() : '',
          amount: div.dividendRate || 0
        })) : [],
        splits: [],
        events: []
      };
    } catch (error) {
      return this.getEmptyCalendarData();
    }
  }

  // Helper methods for calculations
  private calculateSMA(prices: number[], period: number): number | undefined {
    if (prices.length < period) return undefined;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private calculateRSI(prices: number[], period: number = 14): number | undefined {
    if (prices.length < period + 1) return undefined;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Empty data fallbacks
  private getEmptyQuoteData(symbol: string): QuoteData {
    return {
      symbol,
      companyName: symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      avgVolume: 0,
      open: 0,
      high: 0,
      low: 0,
      previousClose: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      marketState: 'UNKNOWN',
      currency: 'USD',
      exchangeName: '',
      exchangeTimezone: '',
      lastUpdate: new Date().toISOString()
    };
  }

  private getEmptyEarningsData(): EarningsData {
    return { recentEarnings: [], upcomingEarnings: [], earningsHistory: [], earningsTrend: [] };
  }

  private getEmptyFinancialsData(): FinancialStatementsData {
    return {
      incomeStatement: { annual: [], quarterly: [] },
      balanceSheet: { annual: [], quarterly: [] },
      cashFlow: { annual: [], quarterly: [] }
    };
  }

  private getEmptyTechnicalData(): TechnicalIndicatorsData {
    return {
      movingAverages: {},
      technicalSignals: {},
      priceTargets: {}
    };
  }

  private getEmptyOptionsData(): OptionsData {
    return { expirationDates: [], calls: [], puts: [] };
  }

  private getEmptyNewsData(): NewsData {
    return { recentNews: [], pressReleases: [] };
  }

  private getEmptyProfileData(symbol: string): CompanyProfileData {
    return {
      companyName: symbol,
      businessSummary: '',
      sector: '',
      industry: '',
      headquarters: {},
      executives: []
    };
  }

  private getEmptyStatisticsData(): KeyStatisticsData {
    return {
      valuationMetrics: {},
      financialHealth: {},
      dividendInfo: {},
      shareInfo: {}
    };
  }

  private getEmptyCalendarData(): CalendarData {
    return { earnings: [], dividends: [], splits: [], events: [] };
  }

  /**
   * Get historical price data in Python yfinance format (Item_Id, Date, Price)
   * Equivalent to: colab_download_price_csv(ticker, start, end, interval)
   */
  async getPythonStyleHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string,
    interval: '1d' | '1wk' | '1mo' = '1d'
  ): Promise<PythonYFinanceResponse> {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      // Validate inputs
      if (!symbol || typeof symbol !== 'string') {
        throw new Error('Symbol is required');
      }
      
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      // Validate date format and range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD format');
      }
      
      if (start >= end) {
        throw new Error('Start date must be before end date');
      }
      
      if (start > new Date()) {
        throw new Error('Start date cannot be in the future');
      }

      // Fetch historical data from Yahoo Finance
      const result = await yahooFinance.historical(upperSymbol, {
        period1: startDate,
        period2: endDate,
        interval: interval,
      });
      
      if (!result || result.length === 0) {
        throw new Error(`No data found for symbol ${symbol} in the specified date range`);
      }

      // Transform data to Python yfinance format: Item_Id, Date, Price
      const data: PythonYFinanceRecord[] = result.map((record: any) => ({
        Item_Id: symbol.toLowerCase(),  // ticker.lower() as in Python
        Date: format(record.date, 'yyyy-MM-dd'),  // Format date as YYYY-MM-DD
        Price: Number(record.close.toFixed(2))  // Use Close price, formatted to 2 decimals
      }));

      return {
        data,
        meta: {
          symbol: upperSymbol,
          interval,
          startDate,
          endDate,
          recordCount: data.length,
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch Python-style data for ${symbol}: ${error.message}`);
    }
  }
}

// Export singleton instance
export const comprehensiveYahooFinanceService = new ComprehensiveYahooFinanceService();