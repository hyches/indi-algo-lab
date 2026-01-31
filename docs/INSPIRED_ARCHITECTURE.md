# Architecture Inspired by TauricResearch/TradingAgents

## Key Learnings from TradingAgents (Applied to Indian Markets)

### 1. **Multi-Vendor Routing Pattern** ⭐ CORE PATTERN
The TradingAgents repo uses a genius **routing architecture** that solves our rate-limiting & reliability issues:

```
route_to_vendor(method, *args, **kwargs)
  ├─ Get configured vendor for method
  ├─ Create fallback chain: [primary vendors] → [fallback vendors]
  ├─ Loop through vendors with error handling:
  │   ├─ Try primary vendor (e.g., Alpha Vantage)
  │   ├─ If rate-limited → auto-fallback to next vendor
  │   ├─ If error → continue to next vendor
  │   └─ Return results when successful
  └─ Raise error only if ALL vendors fail
```

**For our project:**
- Primary: Direct Yahoo Finance API (no deps)
- Fallback 1: yfinance Python library
- Fallback 2: Local cache / mock data
- Fallback 3: Alternative API (e.g., Finnhub for Indian stocks)

### 2. **Vendor-Specific Implementation Modules**
Each vendor is isolated in its own file:
- `alpha_vantage_stock.py` - Alpha Vantage stock data
- `alpha_vantage_indicator.py` - Indicators via Alpha Vantage
- `y_finance.py` - yfinance wrappers
- `local.py` - Local/cached data
- `interface.py` - Central router + VENDOR_METHODS mapping

**For Indian markets, we need:**
- `nse_yfinance.py` - NSE data via Yahoo Finance (RELIANCE.NS format)
- `bse_yfinance.py` - BSE data via Yahoo Finance
- `nsepy_wrapper.py` - Optional: nsepy library for advanced NSE features
- `local_india.py` - Local caching for NSE/BSE data

### 3. **Rate Limiting + Retry Logic with Exponential Backoff**
```python
@retry(
    retry=retry_if_result(is_rate_limited),
    wait=wait_exponential(multiplier=1, min=4, max=60),
    stop=stop_after_attempt(5),
)
def make_request(url, headers):
    response = requests.get(url, headers=headers)
    return response
```

**Implement for Yahoo Finance API calls:**
- Detect 429 (rate limit) response
- Retry with exponential backoff: 2s, 4s, 8s, 16s, 32s
- Max 5 attempts before failing over to next vendor

### 4. **Caching Strategy**
```
Data Flow:
  Quote Request
    ├─ Check 5-sec cache (prevent rapid re-requests)
    ├─ If miss → Fetch from API
    ├─ Store with timestamp
    └─ Return cached copy for 5 seconds
```

**Our implementation already has this** - but improve with:
- Cache invalidation at market open/close
- Symbol-specific TTLs (liquid vs illiquid stocks)
- Fallback to older cache if API fails

### 5. **Bulkoperation Pattern** (Fetch Once, Calculate Once)
Instead of:
```python
# BAD: N+1 problem
for symbol in ['NIFTY', 'BANKNIFTY', 'RELIANCE']:
    data = fetch(symbol)  # 3 API calls
```

Do:
```python
# GOOD: Single bulk fetch
symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE']
quotes = fetch_bulk(symbols)  # 1 API call
```

**TauricResearch uses:** `Promise.allSettled()` equivalent
- Fetch all symbols in parallel
- Handle individual failures gracefully
- Return partial results if some fail

### 6. **Configuration-Driven Vendor Selection**
```python
config["data_vendors"] = {
    "core_stock_apis": "yfinance",           # Primary
    "technical_indicators": "yfinance",      # Primary
    "fundamental_data": "alpha_vantage",     # Primary
    "news_data": "alpha_vantage",            # Primary
}

# Tool-level override (takes precedence)
config["tool_vendors"] = {
    "get_quotes": "direct_api",  # Override category for this specific tool
}
```

**For Indian markets:**
```javascript
config["market_data_vendors"] = {
    "quotes": "direct_yahoo",          // Primary: Direct fetch
    "historical": "yfinance",          // Fallback: Python lib
    "options": "nse_public_api",       // NSE-specific
    "sector_data": "local_cache",      // Cached fundamentals
}
```

### 7. **Error Handling with Specific Exception Types**
```python
class AlphaVantageRateLimitError(Exception):
    """Rate limit exceeded - trigger fallback"""
    pass

# In route_to_vendor():
try:
    result = vendor_method(...)
except AlphaVantageRateLimitError:
    print("Rate limited, trying next vendor...")
    continue  # Try next vendor
except Exception as e:
    print(f"Error: {e}")
    continue  # Try next vendor
```

**For our project:**
```typescript
class YahooFinanceRateLimitError extends Error {}
class YahooFinanceNotFoundError extends Error {}

if (response.status === 429) {
    throw new YahooFinanceRateLimitError("Rate limited");
}
```

### 8. **Symbol Canonicalization** (CRITICAL for Indian stocks)
```python
# Map logical symbols to vendor-specific formats
YAHOO_SYMBOL_MAP = {
    'RELIANCE': 'RELIANCE.NS',          # NSE
    'TCS': 'TCS.NS',                    # NSE
    'NIFTY': '^NSEI',                   # Nifty Index
    'BANKNIFTY': '^NSEBANK',            # Bank Nifty Index
    'BTC-INR': 'BTC-INR=X',             # Crypto in INR
}

# Before API call:
yahoo_symbol = YAHOO_SYMBOL_MAP.get(symbol, symbol)
data = fetch(yahoo_symbol)
```

**Current state:** Already implemented in `yahooFinance.ts`
**Improvement:** Add support for:
- BSE stocks (`.BO` suffix)
- MCX futures (`.MCX`)
- NCDEX commodities

### 9. **Bulk Data with Promise.allSettled (Partial Success Pattern)**
```javascript
// Fetch all quotes, handle partial failures
const quotes = await Promise.allSettled(
  symbols.map(symbol => fetchQuote(symbol))
);

// Extract successful results
const successful = quotes
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

return successful;  // Return what we got, don't fail completely
```

**Benefits:**
- 1 symbol fails → return 4 out of 5
- Better UX than "all or nothing"
- Transparent to frontend

---

## Implementation Blueprint for indi-algo-lab

### Phase 1: Multi-Vendor Router (THIS WEEK)
```
backend/lib/marketDataRouter.js
├─ Router({ method, vendors: [primary, fallback1, fallback2], ...args })
├─ Automatic vendor selection
├─ Fallback on rate-limit/error
└─ Unified error reporting

backend/vendors/
├─ directYahooFinance.js (primary - already working)
├─ yfinanceWrapper.js (fallback - Python-style wrapped)
├─ localCache.js (fallback - stale data)
└─ finnhubWrapper.js (optional - news/sentiment)
```

### Phase 2: Symbol Management
```
backend/lib/symbolManager.js
├─ SYMBOL_MAP for NSE/BSE/MCX/Crypto
├─ getYahooSymbol(logicalSymbol)
├─ validateSymbol(symbol)
└─ getSupportedExchanges()
```

### Phase 3: Enhanced Caching
```
backend/lib/cacheManager.js
├─ TTL by symbol (liquid vs illiquid)
├─ Market-hours aware invalidation
├─ LRU eviction for memory limits
└─ Disk backup for persistent cache
```

### Phase 4: Rate Limit Handling
```
backend/middleware/rateLimitHandler.js
├─ Detect 429 responses
├─ Exponential backoff retry
├─ Vendor auto-rotation
└─ Health check for vendor availability
```

---

## Key Metrics (from TradingAgents philosophy)

1. **Availability > Accuracy** - Return stale data rather than fail
2. **Transparent Errors** - Always tell frontend which vendor was used
3. **Graceful Degradation** - 90% of features work even if 1 vendor fails
4. **Observability** - Log every vendor attempt (for debugging)
5. **User Feedback** - Show "Quote delayed" vs "Quote unavailable"

---

## Next Steps
1. ✅ Create router architecture
2. ✅ Implement vendor modules
3. ✅ Add rate-limit detection
4. ✅ Test fallback chain
5. ✅ Deploy with config management

