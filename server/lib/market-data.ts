import yahooFinance from 'yahoo-finance2';
import { stringify } from 'csv-stringify/sync';
import { format, subDays, subWeeks, subMonths, parseISO } from 'date-fns';
import archiver from 'archiver';
import { PassThrough } from 'stream';

// Market data intervals supported by yahoo-finance2
export type MarketDataInterval = '1d' | '1wk' | '1mo';

// HistoricalOptions interface for yahoo-finance2
export interface HistoricalOptions {
  period1: string;
  period2: string;
  interval: MarketDataInterval;
}

// Market data response interface
export interface MarketDataRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface MarketDataResponse {
  symbol: string;
  data: MarketDataRecord[];
  meta: {
    symbol: string;
    interval: MarketDataInterval;
    startDate: string;
    endDate: string;
    recordCount: number;
  };
}

export interface MarketQuoteResponse {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume: number;
  avgVolume: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  sector?: string;
  industry?: string;
  lastUpdate: string;
}

export interface BatchDownloadRequest {
  symbols: string[];
  startDate: string;
  endDate: string;
  interval: MarketDataInterval;
}

export interface BatchDownloadResponse {
  zipBuffer: Buffer;
  filename: string;
  fileCount: number;
  totalRecords: number;
  errors: Array<{ symbol: string; error: string }>;
}

export class MarketDataService {
  private readonly supportedIntervals: MarketDataInterval[] = ['1d', '1wk', '1mo'];
  private readonly maxSymbolsPerBatch = 50;
  private readonly maxDateRangeDays = 365 * 5; // 5 years max

  /**
   * Get historical data for a single symbol (equivalent to yf.download())
   */
  async getHistoricalData(
    symbol: string, 
    startDate: string, 
    endDate: string, 
    interval: MarketDataInterval = '1d'
  ): Promise<MarketDataResponse> {
    try {
      // Validate inputs
      this.validateSymbol(symbol);
      this.validateDateRange(startDate, endDate);
      this.validateInterval(interval);

      const options: HistoricalOptions = {
        period1: startDate,
        period2: endDate,
        interval: interval,
      };

      const result = await yahooFinance.historical(symbol.toUpperCase(), options);
      
      if (!result || result.length === 0) {
        throw new Error(`No data found for symbol ${symbol}`);
      }

      // Transform data to our format
      const data: MarketDataRecord[] = result.map((record: any) => ({
        date: format(record.date, 'yyyy-MM-dd'),
        open: Number(record.open.toFixed(2)),
        high: Number(record.high.toFixed(2)),
        low: Number(record.low.toFixed(2)),
        close: Number(record.close.toFixed(2)),
        volume: record.volume,
        adjClose: Number((record.adjClose || record.close).toFixed(2)),
      }));

      return {
        symbol: symbol.toUpperCase(),
        data,
        meta: {
          symbol: symbol.toUpperCase(),
          interval,
          startDate,
          endDate,
          recordCount: data.length,
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get current quote/snapshot for a symbol (equivalent to yf.Ticker().info)
   */
  async getCurrentQuote(symbol: string): Promise<MarketQuoteResponse> {
    try {
      this.validateSymbol(symbol);

      const quote = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
        modules: ['price', 'summaryDetail', 'assetProfile']
      });

      const price = quote.price;
      const summaryDetail = quote.summaryDetail;
      const assetProfile = quote.assetProfile;

      if (!price) {
        throw new Error(`Quote data not available for ${symbol}`);
      }

      return {
        symbol: symbol.toUpperCase(),
        companyName: price.longName || price.shortName || symbol.toUpperCase(),
        price: Number(price.regularMarketPrice?.toFixed(2)) || 0,
        change: Number(price.regularMarketChange?.toFixed(2)) || 0,
        changePercent: Number(price.regularMarketChangePercent?.toFixed(2)) || 0,
        marketCap: price.marketCap,
        volume: price.regularMarketVolume || 0,
        avgVolume: summaryDetail?.averageVolume || 0,
        peRatio: summaryDetail?.trailingPE,
        eps: summaryDetail?.epsTrailingTwelveMonths || summaryDetail?.trailingEps,
        dividendYield: summaryDetail?.dividendYield ? Number((summaryDetail.dividendYield * 100).toFixed(2)) : undefined,
        fiftyTwoWeekHigh: Number(summaryDetail?.fiftyTwoWeekHigh?.toFixed(2)) || 0,
        fiftyTwoWeekLow: Number(summaryDetail?.fiftyTwoWeekLow?.toFixed(2)) || 0,
        sector: assetProfile?.sector,
        industry: assetProfile?.industry,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get historical data for multiple symbols
   */
  async getMultipleHistoricalData(
    symbols: string[], 
    startDate: string, 
    endDate: string, 
    interval: MarketDataInterval = '1d'
  ): Promise<{ results: MarketDataResponse[]; errors: Array<{ symbol: string; error: string }> }> {
    if (symbols.length > this.maxSymbolsPerBatch) {
      throw new Error(`Too many symbols requested. Maximum ${this.maxSymbolsPerBatch} symbols allowed per batch.`);
    }

    const results: MarketDataResponse[] = [];
    const errors: Array<{ symbol: string; error: string }> = [];

    // Process symbols in parallel with controlled concurrency
    const promises = symbols.map(async (symbol) => {
      try {
        const data = await this.getHistoricalData(symbol.trim(), startDate, endDate, interval);
        results.push(data);
      } catch (error: any) {
        errors.push({ symbol: symbol.trim(), error: error.message });
      }
    });

    await Promise.allSettled(promises);

    return { results, errors };
  }

  /**
   * Export market data to CSV format
   */
  async exportToCSV(data: MarketDataRecord[], filename?: string): Promise<{ csv: string; filename: string }> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const csvData = stringify(data, {
      header: true,
      columns: {
        date: 'Date',
        open: 'Open',
        high: 'High',
        low: 'Low',
        close: 'Close',
        volume: 'Volume',
        adjClose: 'Adj Close'
      }
    });

    const generatedFilename = filename || `market_data_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;

    return {
      csv: csvData,
      filename: generatedFilename
    };
  }

  /**
   * Create ZIP file with multiple CSV files for batch download
   */
  async createBatchZip(responses: MarketDataResponse[]): Promise<BatchDownloadResponse> {
    if (!responses || responses.length === 0) {
      throw new Error('No data to create batch download');
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    const buffers: Buffer[] = [];
    
    const passThrough = new PassThrough();
    passThrough.on('data', (chunk) => buffers.push(chunk));
    
    archive.pipe(passThrough);

    let totalRecords = 0;

    for (const response of responses) {
      const { csv, filename } = await this.exportToCSV(
        response.data, 
        `${response.symbol}_${response.meta.startDate}_${response.meta.endDate}.csv`
      );
      
      archive.append(csv, { name: filename });
      totalRecords += response.data.length;
    }

    await archive.finalize();
    
    // Wait for all data to be written
    await new Promise((resolve) => {
      passThrough.on('end', resolve);
    });

    const zipBuffer = Buffer.concat(buffers);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const zipFilename = `market_data_batch_${timestamp}.zip`;

    return {
      zipBuffer,
      filename: zipFilename,
      fileCount: responses.length,
      totalRecords,
      errors: []
    };
  }

  /**
   * Validate ticker symbol format
   */
  async validateSymbol(symbol: string): Promise<boolean> {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Symbol is required');
    }

    const trimmedSymbol = symbol.trim().toUpperCase();
    
    if (trimmedSymbol.length === 0) {
      throw new Error('Symbol cannot be empty');
    }

    if (trimmedSymbol.length > 10) {
      throw new Error('Symbol too long');
    }

    // Basic symbol format validation
    if (!/^[A-Z0-9.-]+$/.test(trimmedSymbol)) {
      throw new Error('Invalid symbol format');
    }

    try {
      // Try to fetch quote to validate symbol exists
      await yahooFinance.quoteSummary(trimmedSymbol, { modules: ['price'] });
      return true;
    } catch (error) {
      throw new Error(`Invalid or non-existent symbol: ${trimmedSymbol}`);
    }
  }

  /**
   * Get supported intervals
   */
  getSupportedIntervals(): MarketDataInterval[] {
    return [...this.supportedIntervals];
  }

  /**
   * Get suggested date ranges
   */
  getSupportedPeriods(): Array<{ label: string; value: string; startDate: string; endDate: string }> {
    const today = new Date();
    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

    return [
      {
        label: '1 Week',
        value: '1w',
        startDate: formatDate(subDays(today, 7)),
        endDate: formatDate(today)
      },
      {
        label: '1 Month',
        value: '1m',
        startDate: formatDate(subDays(today, 30)),
        endDate: formatDate(today)
      },
      {
        label: '3 Months',
        value: '3m',
        startDate: formatDate(subDays(today, 90)),
        endDate: formatDate(today)
      },
      {
        label: '6 Months',
        value: '6m',
        startDate: formatDate(subDays(today, 180)),
        endDate: formatDate(today)
      },
      {
        label: '1 Year',
        value: '1y',
        startDate: formatDate(subDays(today, 365)),
        endDate: formatDate(today)
      },
      {
        label: '2 Years',
        value: '2y',
        startDate: formatDate(subDays(today, 730)),
        endDate: formatDate(today)
      },
      {
        label: '5 Years',
        value: '5y',
        startDate: formatDate(subDays(today, 1825)),
        endDate: formatDate(today)
      }
    ];
  }

  /**
   * Get popular stock symbols with metadata
   */
  getPopularSymbols(): Array<{ symbol: string; name: string; sector: string }> {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Cyclical' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer Cyclical' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
      { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Technology' },
      { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' }
    ];
  }

  /**
   * Private validation methods
   */
  private validateInterval(interval: MarketDataInterval): void {
    if (!this.supportedIntervals.includes(interval)) {
      throw new Error(`Unsupported interval: ${interval}. Supported intervals: ${this.supportedIntervals.join(', ')}`);
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const now = new Date();

      if (start >= end) {
        throw new Error('Start date must be before end date');
      }

      if (start > now) {
        throw new Error('Start date cannot be in the future');
      }

      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      if (daysDiff > this.maxDateRangeDays) {
        throw new Error(`Date range too large. Maximum ${this.maxDateRangeDays} days allowed`);
      }

    } catch (error: any) {
      if (error.message.includes('Invalid time value')) {
        throw new Error('Invalid date format. Use YYYY-MM-DD format');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();