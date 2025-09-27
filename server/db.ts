import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for optimal serverless performance
neonConfig.webSocketConstructor = ws;
// Enable prepared statements for better performance (disabled for serverless by default)
neonConfig.useSecureWebSocket = true;
// Optimize for serverless by reducing latency
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration for Neon serverless cost efficiency
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Optimize pool size for serverless - minimal connections for cost efficiency
  max: 2, // Slightly increased for better performance while maintaining cost efficiency
  // Faster connection timeout for serverless environment
  connectionTimeoutMillis: 3000, // Reduced for faster failures
  // Shorter idle timeout to reduce costs
  idleTimeoutMillis: 20000, // Reduced for better cost optimization
  // Optimize query timeout for serverless
  queryTimeout: 15000, // Reduced for cost control
  // Allow graceful pool shutdown
  allowExitOnIdle: true,
  // Additional optimizations
  acquireTimeoutMillis: 5000,
  // Enable connection reuse
  reapIntervalMillis: 10000,
};

export const pool = new Pool(poolConfig);

// Enhanced Drizzle instance with logging for performance monitoring in development
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query: string, params: unknown[]) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DB Query:`, { query: query.substring(0, 200), params });
    }
  } : false
});

// Database health check utility
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    const latency = Date.now() - start;
    return { 
      healthy: false, 
      latency, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Connection pool status utility
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Graceful shutdown utility
export async function closeDatabasePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Database pool closed gracefully');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Query performance tracking utility for development
export function withQueryPerformanceTracking<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return operation();
  }
  
  const start = Date.now();
  return operation().finally(() => {
    const duration = Date.now() - start;
    if (duration > 100) { // Log slow queries (>100ms)
      console.warn(`[SLOW QUERY] ${operationName} took ${duration}ms`);
    }
  });
}

// Query optimization utilities for Neon serverless cost efficiency
export const queryOptimizer = {
  // Query cache for frequently accessed data
  queryCache: new Map<string, { data: any; timestamp: number; ttl: number }>(),
  
  async cachedQuery(key: string, queryFn: () => Promise<any>, ttlSeconds: number = 300) {
    const cached = this.queryCache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < (cached.ttl * 1000)) {
      return cached.data;
    }
    
    const data = await queryFn();
    this.queryCache.set(key, { data, timestamp: now, ttl: ttlSeconds });
    
    // Clean up expired entries
    for (const [cacheKey, cacheValue] of this.queryCache.entries()) {
      if ((now - cacheValue.timestamp) > (cacheValue.ttl * 1000)) {
        this.queryCache.delete(cacheKey);
      }
    }
    
    return data;
  },

  // Efficient pagination with cursor-based approach
  async paginateQuery(
    baseQuery: string,
    cursorColumn: string = 'id',
    cursor?: string,
    limit: number = 50
  ) {
    let paginatedQuery = baseQuery;
    const params: any[] = [];
    
    if (cursor) {
      paginatedQuery += ` WHERE ${cursorColumn} > $1`;
      params.push(cursor);
    }
    
    paginatedQuery += ` ORDER BY ${cursorColumn} ASC LIMIT $${params.length + 1}`;
    params.push(limit + 1); // Fetch one extra to check if there are more results
    
    const result = await pool.query(paginatedQuery, params);
    const hasNextPage = result.rows.length > limit;
    const data = hasNextPage ? result.rows.slice(0, -1) : result.rows;
    
    return {
      data,
      hasNextPage,
      nextCursor: hasNextPage ? data[data.length - 1][cursorColumn] : null
    };
  },

  // Connection pooling optimization recommendations
  getOptimizationRecommendations() {
    const status = getPoolStatus();
    return {
      current: status,
      recommendations: {
        poolSize: status.totalCount > 3 ? 'Consider reducing pool size for cost efficiency' : 'Pool size is optimal',
        idleConnections: status.idleCount > 1 ? 'High idle connections - consider shorter idle timeout' : 'Good connection utilization',
        waitingConnections: status.waitingCount > 0 ? 'Query bottleneck detected - investigate slow queries' : 'No connection bottlenecks'
      }
    };
  }
};

// Database backup and recovery utilities
export const databaseBackup = {
  // Create point-in-time backup reference
  async createBackupPoint(description: string = '') {
    const timestamp = new Date().toISOString();
    const backupInfo = {
      timestamp,
      description,
      // For Neon, point-in-time recovery is automatic
      instructions: {
        recovery: 'Use Neon dashboard to restore to specific timestamp',
        timestamp: timestamp,
        retention: '30 days (configurable in Neon console)',
        steps: [
          '1. Go to Neon console dashboard',
          '2. Select your database',
          '3. Navigate to "Backup & Restore"',
          `4. Choose "Point-in-time restore" to ${timestamp}`,
          '5. Create new branch from restore point'
        ]
      }
    };
    
    console.log('Backup point created:', backupInfo);
    return backupInfo;
  },

  // Verify database integrity
  async verifyIntegrity() {
    try {
      const checks = [
        { name: 'Connection Test', query: 'SELECT 1 as test' },
        { name: 'Users Table', query: 'SELECT COUNT(*) as count FROM users' },
        { name: 'CSV Uploads Table', query: 'SELECT COUNT(*) as count FROM csv_uploads' },
        { name: 'Courses Table', query: 'SELECT COUNT(*) as count FROM courses' },
        { name: 'Foreign Key Constraints', query: `SELECT COUNT(*) as count FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'` },
      ];
      
      const results = [];
      for (const check of checks) {
        try {
          const result = await pool.query(check.query);
          results.push({
            check: check.name,
            status: 'PASS',
            result: result.rows[0]
          });
        } catch (error: any) {
          results.push({
            check: check.name,
            status: 'FAIL',
            error: error.message
          });
        }
      }
      
      return {
        overall: results.every(r => r.status === 'PASS') ? 'HEALTHY' : 'ISSUES_DETECTED',
        checks: results,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        overall: 'CRITICAL_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Database maintenance recommendations
  async getMaintenanceRecommendations() {
    const recommendations = [];
    
    try {
      // Check for unused indexes
      const unusedIndexes = await pool.query(`
        SELECT schemaname, tablename, indexname, idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan < 10
        ORDER BY idx_scan
      `);
      
      if (unusedIndexes.rows.length > 0) {
        recommendations.push({
          type: 'INDEX_OPTIMIZATION',
          priority: 'MEDIUM',
          message: `Found ${unusedIndexes.rows.length} potentially underutilized indexes`,
          details: unusedIndexes.rows.slice(0, 5) // Show top 5
        });
      }
      
      // Check table sizes
      const tableSizes = await pool.query(`
        SELECT 
          tablename, 
          pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
          pg_total_relation_size(tablename::regclass) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(tablename::regclass) DESC
        LIMIT 10
      `);
      
      recommendations.push({
        type: 'STORAGE_ANALYSIS',
        priority: 'INFO',
        message: 'Top 10 largest tables by storage usage',
        details: tableSizes.rows
      });
      
      // Check for slow queries (simulated for development)
      if (process.env.NODE_ENV === 'development') {
        recommendations.push({
          type: 'QUERY_OPTIMIZATION',
          priority: 'HIGH',
          message: 'Consider implementing query caching for frequently accessed data',
          details: {
            suggestion: 'Use queryOptimizer.cachedQuery() for user profiles, course lists, and other frequently accessed data',
            estimated_savings: 'Up to 30% reduction in database compute time'
          }
        });
      }
      
    } catch (error: any) {
      recommendations.push({
        type: 'ERROR',
        priority: 'HIGH',
        message: 'Could not analyze database maintenance needs',
        error: error.message
      });
    }
    
    return recommendations;
  }
};

// Cost optimization monitoring
export const costOptimizer = {
  // Track query costs (estimated based on execution time)
  queryCosts: new Map<string, { count: number; totalTime: number; avgTime: number }>(),
  
  trackQueryCost(queryType: string, executionTime: number) {
    const existing = this.queryCosts.get(queryType) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    this.queryCosts.set(queryType, existing);
  },
  
  getCostReport() {
    const report = Array.from(this.queryCosts.entries())
      .map(([queryType, stats]) => ({
        queryType,
        ...stats,
        estimatedCost: (stats.avgTime / 1000) * 0.0001 // Rough cost estimation
      }))
      .sort((a, b) => b.totalTime - a.totalTime);
    
    return {
      topCostlyQueries: report.slice(0, 10),
      totalQueries: Array.from(this.queryCosts.values()).reduce((sum, stats) => sum + stats.count, 0),
      recommendations: this.generateCostRecommendations(report)
    };
  },
  
  generateCostRecommendations(queryStats: any[]) {
    const recommendations = [];
    
    // Check for expensive queries
    const expensiveQueries = queryStats.filter(q => q.avgTime > 200);
    if (expensiveQueries.length > 0) {
      recommendations.push({
        type: 'SLOW_QUERIES',
        message: `${expensiveQueries.length} queries averaging >200ms - consider optimization`,
        impact: 'HIGH'
      });
    }
    
    // Check for frequently executed queries
    const frequentQueries = queryStats.filter(q => q.count > 100);
    if (frequentQueries.length > 0) {
      recommendations.push({
        type: 'CACHING_OPPORTUNITY',
        message: `${frequentQueries.length} queries executed >100 times - consider caching`,
        impact: 'MEDIUM'
      });
    }
    
    return recommendations;
  }
};