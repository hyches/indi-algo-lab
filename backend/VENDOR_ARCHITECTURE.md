# Multi-Vendor Market Data Architecture

## Overview

The backend now uses an intelligent multi-vendor router for market data fetching. This architecture, inspired by TauricResearch/TradingAgents, provides:

- **Automatic Fallback**: If one vendor fails, automatically try the next
- **Rate Limit Handling**: Detect 429 responses and retry with exponential backoff
- **Health Checking**: Automatically disable unhealthy vendors
- **Transparent Logging**: Full visibility into which vendor was used
- **Bulk Operations**: Fetch multiple symbols in parallel, return partial results

## Architecture

```
Frontend
    ↓
Backend Express API
    ↓
Market Data Router (marketDataRouter.js)
    ├─ Vendor Selection
    ├─ Error Handling
    ├─ Rate Limit Detection
    └─ Fallback Logic
    ↓
Vendor Implementations
    ├─ directYahooFinance.js (Primary) ← Uses public API
    ├─ yfinanceWrapper.js (Fallback 1) ← Python library wrapper
    ├─ cacheVendor.js (Fallback 2) ← Local cached data
    └─ finnhubWrapper.js (Fallback 3) ← Alternative API
```

## Components

### 1. MarketDataRouter (`backend/lib/marketDataRouter.js`)

Main router class that handles:
- Vendor selection based on health and success rates
- Automatic fallback on errors
- Rate limit detection and retry logic
- Bulk operations with partial result support

**Usage:**

```javascript
const router = new MarketDataRouter([
  { name: 'directYahoo', fn: directYahooVendor, weight: 1.0 },
  { name: 'yfinance', fn: yfinanceVendor, weight: 0.8 },
  { name: 'cache', fn: cacheVendor, weight: 0.5 }
]);

// Single fetch with automatic fallback
const result = await router.fetch('quote', 'RELIANCE.NS');
// result = { data, vendor: 'directYahoo', timestamp, duration }

// Bulk fetch (returns partial results)
const results = await router.fetchBulk('quote', ['NIFTY', 'BANKNIFTY', 'RELIANCE.NS']);
// results = { successful: [...], failed: [...], totalTime }

// Get statistics
console.log(router.getStats());
```

### 2. Direct Yahoo Finance Vendor (`backend/lib/vendors/directYahooFinance.js`)

Primary vendor using Yahoo Finance public API:
- **Pros**: No external dependencies, fast, reliable for Indian stocks
- **Cons**: Rate limited (~100 requests/min), no authentication
- **Methods**: quote, quotes, historical, options

Implements:
- 5-second in-memory caching
- HTTP 429 detection
- Proper error handling
- Symbol validation

### 3. Symbol Manager (`backend/lib/symbolManager.js`)

Handles symbol mapping and validation:

**Features:**
- Maps logical symbols to Yahoo Finance tickers
- Supports NSE (.NS), BSE (.BO), MCX (.MCX) exchanges
- Handles indices (^NSEI), forex (INR=X), crypto

**Example:**

```javascript
const { getYahooSymbol, getExchange } = require('./symbolManager');

getYahooSymbol('RELIANCE');      // → 'RELIANCE.NS'
getYahooSymbol('NIFTY');         // → '^NSEI'
getExchange('RELIANCE');         // → 'NSE'
getSupportedSymbols();           // → ['RELIANCE', 'TCS', 'INFY', ...]
```

## Data Flow: Single Quote

```
GET /api/market/quote/RELIANCE.NS
    ↓
marketDataRouter.fetch('quote', 'RELIANCE.NS')
    ↓
[Vendor 1: directYahoo]
    ├─ Check 5-sec cache
    ├─ If miss → Fetch from Yahoo API
    ├─ If success → Return with vendor='directYahoo'
    └─ If error (429, network, etc.) → Fall through to Vendor 2
    ↓
[Vendor 2: yfinance] (if Vendor 1 failed)
    ├─ Try Python wrapper
    ├─ If success → Return with vendor='yfinance'
    └─ If error → Fall through to Vendor 3
    ↓
[Vendor 3: cache] (if Vendor 2 failed)
    ├─ Try local cached data (may be stale)
    ├─ If success → Return with vendor='cache'
    └─ If error → Raise error
    ↓
Response to Frontend:
{
  "data": { symbol, price, change, ... },
  "vendor": "directYahoo",
  "timestamp": "2026-01-31T...",
  "duration": 245
}
```

## Data Flow: Bulk Quotes

```
POST /api/market/quotes
Body: { symbols: ['NIFTY', 'RELIANCE', 'TCS'] }
    ↓
marketDataRouter.fetchBulk('quote', [...])
    ↓
Promise.allSettled([
  fetch('NIFTY'),       // Successfully returns
  fetch('RELIANCE'),    // Successfully returns
  fetch('TCS')          // Fails with 404
])
    ↓
Response to Frontend:
{
  "successful": [
    { symbol: 'NIFTY', data: {...}, vendor: 'directYahoo' },
    { symbol: 'RELIANCE', data: {...}, vendor: 'directYahoo' }
  ],
  "failed": [
    { symbol: 'TCS', error: 'Not found' }
  ]
}
```

## Error Handling

### Custom Exceptions

```javascript
RateLimitError      // HTTP 429 → Auto-retry, then fallback
NotFoundError       // Symbol not found → Don't retry, fail immediately
VendorError         // Generic vendor error → Retry with exponential backoff
```

### Retry Logic

- **Attempts**: 3 retries per vendor
- **Backoff**: Exponential with randomization
- **Min Wait**: 1 second
- **Max Wait**: 5 seconds

Example: First attempt fails, then 1.2s, 2.4s, 4.1s delays

### Health Checking

- Vendors start with `isHealthy: true`
- After 3 consecutive failures → `isHealthy: false`
- Unhealthy vendors are skipped in rotation
- Health can be manually reset: `router.resetVendorHealth('yfinance')`

## Configuration

### Environment Variables

```bash
# .env
MARKET_DATA_PRIMARY_VENDOR=directYahoo
MARKET_DATA_FALLBACK_VENDORS=yfinance,cache
CACHE_DURATION=5000          # milliseconds
RATE_LIMIT_THRESHOLD=100     # requests per minute
```

### Programmatic

```javascript
const router = new MarketDataRouter([
  // Order matters - tried in sequence
  { name: 'directYahoo', fn: directYahooVendor, weight: 1.0 },
  { name: 'yfinance', fn: yfinanceVendor, weight: 0.8 },
  { name: 'cache', fn: cacheVendor, weight: 0.5 }
]);

// Later: adjust vendor weight based on performance
router.failureThreshold = 5;  // Mark unhealthy after 5 failures
```

## Monitoring & Debugging

### Get Router Statistics

```javascript
router.getStats()
// Returns:
// {
//   directYahoo: {
//     attempts: 150,
//     successes: 148,
//     failures: 2,
//     rateLimits: 0,
//     successRate: "98.7%",
//     isHealthy: true,
//     lastUsed: "2026-01-31T10:45:23.123Z"
//   },
//   ...
// }
```

### Console Logs

All operations are logged with prefixes:

```
[ROUTER] Attempting directYahoo for quote
[RETRY] directYahoo attempt 1/3 failed: HTTP 429
[ROUTER] ⚠ directYahoo rate limited
[ROUTER] Attempting yfinance for quote
[ROUTER] ✓ yfinance succeeded in 412ms
[ROUTER] Bulk fetch: 148/150 succeeded
```

## Adding New Vendors

### 1. Create Vendor Module

```javascript
// backend/lib/vendors/myVendor.js
async function myVendor(method, ...args) {
  if (method === 'quote') {
    return fetchMyData(args[0]);
  }
  throw new Error(`Unknown method: ${method}`);
}

module.exports = { myVendor };
```

### 2. Register with Router

```javascript
const { myVendor } = require('../lib/vendors/myVendor');

const router = new MarketDataRouter([
  { name: 'directYahoo', fn: directYahooVendor, weight: 1.0 },
  { name: 'myVendor', fn: myVendor, weight: 0.9 },
  { name: 'cache', fn: cacheVendor, weight: 0.5 }
]);
```

## Performance Considerations

### Caching

- **Quote Cache**: 5-second TTL (prevents rapid re-requests)
- **Historical Cache**: Consider disk-based cache for larger datasets
- **Options Cache**: 10-second TTL (less liquid than regular quotes)

### Batch Operations

- Use `fetchBulk()` for multiple symbols
- Runs in parallel with `Promise.allSettled()`
- Returns partial results (doesn't fail if 1 of 100 fails)

### Rate Limiting

- Yahoo Finance: ~100 requests/minute
- With 5-second cache: ~12 quotes/min per unique symbol
- With bulk fetch: Can fetch 100 different symbols in 1 request

## Testing

### Unit Tests

```bash
npm test -- market.test.js
```

### Integration Tests

```bash
# Start backend
npm run dev

# Test single quote
curl http://localhost:3001/api/market/quote/RELIANCE.NS

# Test bulk quotes
curl -X POST http://localhost:3001/api/market/quotes \
  -H "Content-Type: application/json" \
  -d '{"symbols":["NIFTY","RELIANCE","TCS"]}'

# Check health
curl http://localhost:3001/api/market/health
```

## Troubleshooting

### All Vendors Failing

Check logs:
```
[ROUTER] ✗ All vendors failed for quote
```

**Solutions:**
- Check internet connectivity
- Verify symbol format (e.g., RELIANCE.NS vs RELIANCE)
- Check if Yahoo Finance is blocking (IP ban)
- Try manual reset: `router.resetVendorHealth('directYahoo')`

### Rate Limiting

```
[ROUTER] ⚠ directYahoo rate limited
```

**Solutions:**
- Increase cache duration
- Use bulk fetch instead of individual requests
- Add fallback vendors
- Implement request queuing

### Vendor Always Unhealthy

```
[ROUTER] ⛔ directYahoo marked unhealthy (3 failures)
```

**Solutions:**
- Check vendor-specific logs
- Verify API keys/credentials
- Check endpoint availability
- Reset health manually if issue is resolved

## Related Files

- [INSPIRED_ARCHITECTURE.md](../INSPIRED_ARCHITECTURE.md) - Design philosophy
- [copilot-instructions.md](../../.github/copilot-instructions.md) - Development guide
- [backend/server.js](../server.js) - Express server setup

