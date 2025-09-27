import yahooFinance from 'yahoo-finance2';
import { storage } from '../storage';
import { sendPriceAlert } from './email';

// Market Data Service for MarketDifferentials
export class MarketDataService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_PRICE_HISTORY = 100; // Keep last 100 price points for percentile calculations

  constructor() {
    console.log('🔄 MarketDataService initialized');
  }

  /**
   * Fetch real-time market data from Yahoo Finance
   */
  async fetchMarketData(ticker: string): Promise<{
    success: boolean;
    data?: {
      currentPrice: number;
      previousClose: number;
      change: number;
      changePercent: number;
      volume: number;
      timestamp: Date;
    };
    error?: string;
  }> {
    try {
      const quote = await yahooFinance.quote(ticker);
      
      if (!quote || !quote.regularMarketPrice) {
        return {
          success: false,
          error: `No market data found for ticker: ${ticker}`
        };
      }

      const data = {
        currentPrice: quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        timestamp: new Date()
      };

      console.log(`📈 Fetched ${ticker}: $${data.currentPrice} (${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`);
      
      return { success: true, data };
    } catch (error: any) {
      console.error(`❌ Failed to fetch market data for ${ticker}:`, error.message);
      return {
        success: false,
        error: `Failed to fetch market data: ${error.message}`
      };
    }
  }

  /**
   * Calculate P1-P99 percentiles from price history
   */
  calculatePercentiles(prices: number[]): { [key: string]: number } {
    if (prices.length === 0) {
      return {};
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const percentiles: { [key: string]: number } = {};
    
    // Calculate P1, P5, P10, P25, P50, P75, P90, P95, P99
    const percentileValues = [1, 5, 10, 25, 50, 75, 90, 95, 99];
    
    for (const p of percentileValues) {
      const index = (p / 100) * (sortedPrices.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      
      percentiles[`P${p}`] = sortedPrices[lower] * (1 - weight) + sortedPrices[upper] * weight;
    }
    
    return percentiles;
  }

  /**
   * Update market data cache with latest price and percentiles
   */
  async updateMarketDataCache(ticker: string): Promise<boolean> {
    try {
      const marketData = await this.fetchMarketData(ticker);
      
      if (!marketData.success || !marketData.data) {
        console.error(`❌ Failed to update cache for ${ticker}: ${marketData.error}`);
        return false;
      }

      // Get existing cache entry
      const existingCache = await storage.getMarketDataCacheByTicker(ticker);
      let priceHistory: number[] = [];
      
      if (existingCache?.priceHistory) {
        priceHistory = Array.isArray(existingCache.priceHistory) 
          ? existingCache.priceHistory 
          : [];
      }
      
      // Add new price to history
      priceHistory.push(marketData.data.currentPrice);
      
      // Limit history size
      if (priceHistory.length > this.MAX_PRICE_HISTORY) {
        priceHistory = priceHistory.slice(-this.MAX_PRICE_HISTORY);
      }
      
      // Calculate percentiles
      const percentileData = this.calculatePercentiles(priceHistory);
      
      // Update or create cache entry
      const cacheData = {
        ticker,
        currentPrice: marketData.data.currentPrice,
        previousClose: marketData.data.previousClose,
        percentileData,
        priceHistory,
        lastUpdated: new Date(),
        isValid: true
      };

      await storage.upsertMarketDataCache(cacheData);
      
      console.log(`✅ Updated market data cache for ${ticker}: $${marketData.data.currentPrice}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error updating market data cache for ${ticker}:`, error);
      return false;
    }
  }

  /**
   * Check price alerts and trigger notifications
   */
  async checkPriceAlerts(): Promise<void> {
    try {
      console.log('🔍 Checking price alerts...');
      
      // Get all active price alerts
      const activeAlerts = await storage.getActivePriceAlerts();
      
      if (activeAlerts.length === 0) {
        console.log('📝 No active price alerts to check');
        return;
      }

      // Group alerts by ticker for efficient processing
      const alertsByTicker = new Map<string, any[]>();
      for (const alert of activeAlerts) {
        if (!alertsByTicker.has(alert.ticker)) {
          alertsByTicker.set(alert.ticker, []);
        }
        alertsByTicker.get(alert.ticker)!.push(alert);
      }

      // Process each ticker
      for (const [ticker, alerts] of alertsByTicker) {
        await this.checkTickerAlerts(ticker, alerts);
      }
      
      console.log(`✅ Completed checking ${activeAlerts.length} price alerts across ${alertsByTicker.size} tickers`);
    } catch (error: any) {
      console.error('❌ Error checking price alerts:', error);
    }
  }

  /**
   * Check alerts for a specific ticker
   */
  private async checkTickerAlerts(ticker: string, alerts: any[]): Promise<void> {
    try {
      // Update market data cache first
      const updated = await this.updateMarketDataCache(ticker);
      if (!updated) {
        console.error(`❌ Failed to update market data for ${ticker}, skipping alerts`);
        return;
      }

      // Get updated cache data
      const cacheData = await storage.getMarketDataCacheByTicker(ticker);
      if (!cacheData) {
        console.error(`❌ No cache data found for ${ticker}`);
        return;
      }

      const currentPrice = cacheData.currentPrice;
      const percentileData = cacheData.percentileData || {};

      // Check each alert
      for (const alert of alerts) {
        const triggered = await this.checkIndividualAlert(alert, currentPrice, percentileData);
        if (triggered) {
          await this.handleTriggeredAlert(alert, currentPrice, cacheData);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error checking alerts for ${ticker}:`, error);
    }
  }

  /**
   * Check if an individual alert should be triggered
   */
  private async checkIndividualAlert(
    alert: any, 
    currentPrice: number, 
    percentileData: any
  ): Promise<boolean> {
    const { alertType, targetPrice, percentile, lastTriggered } = alert;
    
    // Cooldown period: don't trigger same alert within 1 hour
    if (lastTriggered) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(lastTriggered) > hourAgo) {
        return false;
      }
    }

    switch (alertType) {
      case 'crossing_up':
        return targetPrice && currentPrice > targetPrice;
        
      case 'crossing_down':
        return targetPrice && currentPrice < targetPrice;
        
      case 'near_percentile':
        if (!percentile || !percentileData[`P${percentile}`]) {
          return false;
        }
        const percentileValue = percentileData[`P${percentile}`];
        const tolerance = percentileValue * 0.02; // 2% tolerance
        return Math.abs(currentPrice - percentileValue) <= tolerance;
        
      default:
        console.warn(`⚠️ Unknown alert type: ${alertType}`);
        return false;
    }
  }

  /**
   * Handle triggered alert - send notification and update database
   */
  private async handleTriggeredAlert(alert: any, currentPrice: number, cacheData: any): Promise<void> {
    try {
      // Get user information
      const user = await storage.getUser(alert.userId);
      if (!user?.email) {
        console.error(`❌ User not found or no email for alert ${alert.id}`);
        return;
      }

      // Send email notification
      const emailSent = await sendPriceAlert(
        user.email,
        alert.ticker,
        currentPrice,
        alert.alertType,
        alert.targetPrice,
        alert.percentile,
        alert.userId
      );

      if (emailSent) {
        // Update alert last triggered time
        await storage.updatePriceAlertLastTriggered(alert.id, new Date());
        
        // Create email notification record
        await storage.createEmailNotification({
          userId: alert.userId,
          type: 'price_alert',
          subject: `${alert.ticker} Price Alert: ${alert.alertType}`,
          message: `Price alert triggered for ${alert.ticker} at $${currentPrice}`,
          status: 'sent',
          adminApproved: true, // Price alerts are auto-approved
          sentAt: new Date(),
          metadata: {
            ticker: alert.ticker,
            currentPrice,
            alertType: alert.alertType,
            targetPrice: alert.targetPrice,
            percentile: alert.percentile
          }
        });

        console.log(`🚨 Price alert triggered: ${alert.ticker} ${alert.alertType} at $${currentPrice} for user ${user.email}`);
      } else {
        console.error(`❌ Failed to send price alert email for ${alert.ticker}`);
      }
    } catch (error: any) {
      console.error(`❌ Error handling triggered alert:`, error);
    }
  }

  /**
   * Start background monitoring of market data and price alerts
   */
  startMarketDataMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('⚠️ Market data monitoring already running');
      return;
    }

    console.log(`🚀 Starting market data monitoring (${this.MONITORING_INTERVAL_MS / 1000}s intervals)`);
    
    // Run initial check
    this.checkPriceAlerts();
    
    // Set up recurring checks
    this.monitoringInterval = setInterval(() => {
      this.checkPriceAlerts();
    }, this.MONITORING_INTERVAL_MS);
    
    console.log('✅ Market data monitoring started successfully');
  }

  /**
   * Stop background monitoring
   */
  stopMarketDataMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Market data monitoring stopped');
    }
  }

  /**
   * Get market data monitoring status
   */
  getMonitoringStatus(): {
    running: boolean;
    intervalMs: number;
    nextCheckIn?: number;
  } {
    return {
      running: this.monitoringInterval !== null,
      intervalMs: this.MONITORING_INTERVAL_MS,
      nextCheckIn: this.monitoringInterval ? this.MONITORING_INTERVAL_MS : undefined
    };
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualCheck(): Promise<{ success: boolean; message: string }> {
    try {
      await this.checkPriceAlerts();
      return {
        success: true,
        message: 'Manual price alert check completed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Manual check failed: ${error.message}`
      };
    }
  }

  /**
   * Get popular tickers for market data monitoring
   */
  async getPopularTickers(): Promise<string[]> {
    try {
      const popularSymbols = await storage.getPopularSymbols();
      return popularSymbols.map(symbol => symbol.symbol);
    } catch (error) {
      // Fallback to common tickers
      return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META'];
    }
  }

  /**
   * Batch update market data for multiple tickers
   */
  async batchUpdateMarketData(tickers: string[]): Promise<{
    successful: string[];
    failed: string[];
  }> {
    const successful: string[] = [];
    const failed: string[] = [];

    console.log(`📊 Batch updating market data for ${tickers.length} tickers...`);

    for (const ticker of tickers) {
      try {
        const success = await this.updateMarketDataCache(ticker);
        if (success) {
          successful.push(ticker);
        } else {
          failed.push(ticker);
        }
      } catch (error) {
        console.error(`❌ Error updating ${ticker}:`, error);
        failed.push(ticker);
      }
    }

    console.log(`✅ Batch update complete: ${successful.length} successful, ${failed.length} failed`);
    
    return { successful, failed };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();

// Export utility functions
export async function fetchMarketData(ticker: string) {
  return marketDataService.fetchMarketData(ticker);
}

export function calculatePercentiles(prices: number[]) {
  return marketDataService.calculatePercentiles(prices);
}

export async function checkPriceAlerts() {
  return marketDataService.checkPriceAlerts();
}

export function startMarketDataMonitoring() {
  return marketDataService.startMarketDataMonitoring();
}

export function stopMarketDataMonitoring() {
  return marketDataService.stopMarketDataMonitoring();
}

export function getMarketDataStatus() {
  return marketDataService.getMonitoringStatus();
}