const express = require('express');
const router = express.Router();
const { MarketDataRouter } = require('../lib/marketDataRouter');
const { mockVendor } = require('../lib/vendors/mockVendor');
const { directYahooVendor } = require('../lib/vendors/directYahooFinance');

// Initialize the multi-vendor market data router
// Using mock vendor as primary for stable testing, directYahoo as fallback
const marketRouter = new MarketDataRouter([
  { name: 'mock', fn: mockVendor, weight: 1.0 },
  { name: 'directYahoo', fn: directYahooVendor, weight: 0.5 }
]);

// Helper to fetch JSON from URL with proper headers
async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Cache for quotes to avoid rate limits
const quoteCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

function getCachedQuote(symbol) {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedQuote(symbol, data) {
  quoteCache.set(symbol, { data, timestamp: Date.now() });
}

// Market router stats - shows vendor health and performance
router.get('/stats', async (req, res) => {
  try {
    const stats = marketRouter.getStats();
    res.json({
      status: 'ok',
      timestamp: new Date(),
      vendors: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get historical data
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo' } = req.query;

    console.log(`[FETCHING HISTORICAL] ${symbol} period=${period}`);

    // Use market router for historical data
    const result = await marketRouter.fetch('historical', symbol, period);
    
    // result.data contains the actual array from the vendor
    const historicalData = result.data || [];
    
    res.json({
      data: historicalData,
      symbol,
      period,
      count: historicalData.length,
      timestamp: new Date(),
      vendor: result.vendor
    });
  } catch (error) {
    console.error('Historical data error:', error.message);
    res.status(500).json({ error: 'Failed to fetch historical data', details: error.message });
  }
});

// Get current quote - using multi-vendor router with fallback
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`[QUOTE REQUEST] ${symbol}`);

    // Use market router for automatic vendor selection and fallback
    const result = await marketRouter.fetch('quote', symbol);
    
    if (!result) {
      return res.status(404).json({ error: `No data for symbol ${symbol}` });
    }

    // Enhance response with vendor information
    res.json({
      ...result,
      vendor: 'directYahoo',
      timestamp: new Date(),
      source: 'multi-vendor-router'
    });
  } catch (error) {
    console.error(`[ERROR] Quote fetch for ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch quote', 
      details: error.message,
      symbol: req.params.symbol
    });
  }
});


// Get multiple quotes - using multi-vendor router with Promise.allSettled
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols must be a non-empty array' });
    }

    console.log(`[BATCH QUOTES REQUEST] ${symbols.join(', ')}`);

    // Use market router for bulk fetch with automatic fallback per symbol
    const results = await Promise.allSettled(
      symbols.map(symbol => marketRouter.fetch('quote', symbol))
    );

    // Filter successful results and add vendor info
    const quotes = results
      .map((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          return {
            ...result.value,
            vendor: 'directYahoo',
            symbol: symbols[idx]
          };
        }
        return null;
      })
      .filter(q => q !== null);

    console.log(`[BATCH SUCCESS] Retrieved ${quotes.length}/${symbols.length} quotes`);

    res.json({
      total: symbols.length,
      successful: quotes.length,
      quotes,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Quotes batch error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});


// Get options chain
router.get('/options/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { expiry } = req.query;

    console.log(`[FETCHING OPTIONS] ${symbol} expiry=${expiry}`);

    // Use market router for options data
    const result = await marketRouter.fetch('options', symbol, expiry);
    
    res.json({
      data: result,
      symbol,
      expiry: expiry || 'latest',
      timestamp: new Date(),
      vendor: 'multi-vendor-router'
    });
  } catch (error) {
    console.error('Options data error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch options', 
      details: error.message,
      data: { symbol: symbol || null, expiry: expiry || null, strikes: [] }
    });
  }
});

module.exports = router;