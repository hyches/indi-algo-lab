/**
 * Multi-Vendor Market Data Router
 * 
 * Inspired by TauricResearch/TradingAgents architecture
 * 
 * Features:
 * - Automatic vendor selection and fallback
 * - Rate limit detection and handling
 * - Exponential backoff retry logic
 * - Unified error handling
 * - Transparent logging
 */

const { RateLimitError, NotFoundError, VendorError } = require('./tradingErrors');

/**
 * Market data router with automatic vendor fallback
 * 
 * Usage:
 * const router = new MarketDataRouter([
 *   { name: 'directYahoo', fn: directYahooVendor, weight: 1.0 },
 *   { name: 'yfinance', fn: yfinanceVendor, weight: 0.8 },
 *   { name: 'cache', fn: cacheVendor, weight: 0.5 }
 * ]);
 * 
 * const data = await router.fetch('quote', 'RELIANCE.NS');
 */
class MarketDataRouter {
  constructor(vendors = []) {
    this.vendors = vendors;
    this.vendorStats = {};
    this.failureThreshold = 3;
    
    // Initialize stats for each vendor
    vendors.forEach(v => {
      this.vendorStats[v.name] = {
        attempts: 0,
        successes: 0,
        failures: 0,
        rateLimits: 0,
        lastUsed: null,
        isHealthy: true,
        weight: v.weight || 1.0
      };
    });
  }

  /**
   * Fetch data with automatic fallback
   */
  async fetch(method, ...args) {
    const startTime = Date.now();
    const errors = [];
    
    // Sort vendors by weight (healthy ones first)
    const vendorOrder = this._getVendorOrder();
    
    for (const vendor of vendorOrder) {
      const stats = this.vendorStats[vendor.name];
      
      // Skip unhealthy vendors
      if (!stats.isHealthy) {
        console.log(`[ROUTER] Skipping unhealthy vendor: ${vendor.name}`);
        continue;
      }
      
      console.log(`[ROUTER] Attempting ${vendor.name} for ${method}`);
      stats.attempts++;
      stats.lastUsed = new Date();
      
      try {
        // Built-in retry with exponential backoff
        let lastError;
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            const result = await vendor.fn(method, ...args);
            stats.successes++;
            stats.isHealthy = true;
            const duration = Date.now() - startTime;
            console.log(`[ROUTER] ✓ ${vendor.name} succeeded in ${duration}ms`);
            
            return {
              data: result,
              vendor: vendor.name,
              timestamp: new Date(),
              duration
            };
          } catch (error) {
            lastError = error;
            console.log(`[RETRY] ${vendor.name} attempt ${attempt}/4 failed: ${error.message}`);
            
            if (error instanceof RateLimitError) {
              stats.rateLimits++;
              // Don't retry rate limits immediately, try next vendor
              throw error;
            }
            
            if (attempt < 4) {
              const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }
        
        throw lastError;
      } catch (error) {
        stats.failures++;
        
        // Handle specific error types
        if (error instanceof RateLimitError) {
          stats.rateLimits++;
          console.log(`[ROUTER] ⚠ ${vendor.name} rate limited`);
          errors.push({
            vendor: vendor.name,
            error: error.message,
            type: 'rate_limit'
          });
        } else if (error instanceof NotFoundError) {
          console.log(`[ROUTER] ✗ ${vendor.name} symbol not found: ${error.symbol}`);
          errors.push({
            vendor: vendor.name,
            error: error.message,
            type: 'not_found'
          });
          // Don't fallback for not-found errors, return early
          throw error;
        } else {
          console.log(`[ROUTER] ✗ ${vendor.name} error: ${error.message}`);
          errors.push({
            vendor: vendor.name,
            error: error.message,
            type: 'error'
          });
        }
        
        // Mark vendor as unhealthy if too many failures
        if (stats.failures >= this.failureThreshold) {
          stats.isHealthy = false;
          console.log(`[ROUTER] ⛔ ${vendor.name} marked unhealthy (${stats.failures} failures)`);
        }
        
        // Continue to next vendor
        continue;
      }
    }
    
    // All vendors exhausted
    console.log(`[ROUTER] ✗ All vendors failed for ${method}`);
    const duration = Date.now() - startTime;
    
    const error = new Error(`All vendors failed after ${duration}ms`);
    error.attemptedVendors = errors;
    throw error;
  }

  /**
   * Fetch bulk data (e.g., multiple symbols)
   * Returns partial results instead of failing completely
   */
  async fetchBulk(method, items) {
    const results = await Promise.allSettled(
      items.map(item => this.fetch(method, item))
    );
    
    const successful = results
      .map((result, index) => ({
        input: items[index],
        ...result.value
      }))
      .filter(r => r.status !== 'rejected');
    
    const failed = results
      .map((result, index) => ({
        input: items[index],
        error: result.reason
      }))
      .filter(r => r.error);
    
    console.log(`[ROUTER] Bulk fetch: ${successful.length}/${items.length} succeeded`);
    
    return {
      successful,
      failed,
      totalTime: Date.now()
    };
  }

  /**
   * Get vendor ordering based on health and weight
   */
  _getVendorOrder() {
    return [...this.vendors].sort((a, b) => {
      const statsA = this.vendorStats[a.name];
      const statsB = this.vendorStats[b.name];
      
      // Healthy vendors first
      if (statsA.isHealthy !== statsB.isHealthy) {
        return statsA.isHealthy ? -1 : 1;
      }
      
      // Then by success rate
      const successRateA = statsA.attempts > 0 ? statsA.successes / statsA.attempts : 0;
      const successRateB = statsB.attempts > 0 ? statsB.successes / statsB.attempts : 0;
      
      if (successRateA !== successRateB) {
        return successRateB - successRateA;
      }
      
      // Finally by weight
      return (statsB.weight || 1.0) - (statsA.weight || 1.0);
    });
  }

  /**
   * Get router statistics
   */
  getStats() {
    const stats = {};
    
    for (const [vendorName, vendorStats] of Object.entries(this.vendorStats)) {
      const successRate = vendorStats.attempts > 0 
        ? (vendorStats.successes / vendorStats.attempts * 100).toFixed(1)
        : 0;
      
      stats[vendorName] = {
        ...vendorStats,
        successRate: `${successRate}%`,
        lastUsed: vendorStats.lastUsed ? vendorStats.lastUsed.toISOString() : 'Never'
      };
    }
    
    return stats;
  }

  /**
   * Reset a vendor's health status (e.g., after fixing an issue)
   */
  resetVendorHealth(vendorName) {
    if (this.vendorStats[vendorName]) {
      this.vendorStats[vendorName].isHealthy = true;
      this.vendorStats[vendorName].failures = 0;
      console.log(`[ROUTER] Reset health for vendor: ${vendorName}`);
    }
  }
}

module.exports = {
  MarketDataRouter,
  RateLimitError,
  NotFoundError,
  VendorError
};
