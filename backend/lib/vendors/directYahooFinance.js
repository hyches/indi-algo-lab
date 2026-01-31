/**
 * Direct Yahoo Finance Vendor
 * Primary vendor - fetches directly from Yahoo Finance public API
 * No dependencies, pure fetch-based implementation
 */

const { RateLimitError, NotFoundError, VendorError } = require('../tradingErrors');

// 5-second cache for quotes
const quoteCache = new Map();
const CACHE_DURATION = 5000;

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

/**
 * Fetch JSON from URL with proper headers
 */
async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    timeout: 10000
  });

  // Check for rate limiting
  if (response.status === 429) {
    throw new RateLimitError('directYahoo', 'HTTP 429: Too Many Requests');
  }

  if (response.status === 404) {
    throw new NotFoundError('directYahoo', 'unknown', 'Symbol not found');
  }

  if (!response.ok) {
    throw new VendorError('directYahoo', `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Vendor implementation function
 * Signature: async fn(method, ...args)
 */
async function directYahooVendor(method, ...args) {
  if (method === 'quote') {
    return getQuote(args[0]);
  } else if (method === 'quotes') {
    return getQuotes(args[0]);
  } else if (method === 'historical') {
    return getHistorical(args[0], args[1]);
  } else if (method === 'options') {
    return getOptions(args[0], args[1]);
  } else {
    throw new VendorError('directYahoo', `Unknown method: ${method}`);
  }
}

/**
 * Get single quote
 */
async function getQuote(symbol) {
  // Check cache first
  const cached = getCachedQuote(symbol);
  if (cached) {
    console.log(`[directYahoo] Cache hit for ${symbol}`);
    return cached;
  }

  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`;
  const data = await fetchJSON(url);

  if (!data.quoteSummary?.result?.[0]?.price) {
    throw new NotFoundError('directYahoo', symbol, `No price data for ${symbol}`);
  }

  const price = data.quoteSummary.result[0].price;
  const quote = {
    symbol: price.symbol,
    shortName: price.shortName || symbol,
    regularMarketPrice: price.regularMarketPrice?.raw || 0,
    regularMarketChange: price.regularMarketChange?.raw || 0,
    regularMarketChangePercent: price.regularMarketChangePercent?.raw || 0,
    regularMarketOpen: price.regularMarketOpen?.raw || 0,
    regularMarketDayHigh: price.regularMarketDayHigh?.raw || 0,
    regularMarketDayLow: price.regularMarketDayLow?.raw || 0,
    regularMarketVolume: price.regularMarketVolume?.raw || 0,
    regularMarketPreviousClose: price.regularMarketPreviousClose?.raw || 0,
    timestamp: new Date()
  };

  setCachedQuote(symbol, quote);
  return quote;
}

/**
 * Get multiple quotes in parallel
 */
async function getQuotes(symbols) {
  const quotes = await Promise.allSettled(
    symbols.map(symbol => getQuote(symbol))
  );

  const results = quotes
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  if (results.length === 0) {
    throw new VendorError('directYahoo', 'No quotes retrieved');
  }

  return results;
}

/**
 * Get historical OHLCV data
 */
async function getHistorical(symbol, period = '1mo') {
  const to = new Date();
  const from = new Date();

  const periodMap = {
    '1d': () => from.setDate(from.getDate() - 1),
    '5d': () => from.setDate(from.getDate() - 5),
    '1mo': () => from.setMonth(from.getMonth() - 1),
    '3mo': () => from.setMonth(from.getMonth() - 3),
    '6mo': () => from.setMonth(from.getMonth() - 6),
    '1y': () => from.setFullYear(from.getFullYear() - 1),
    '2y': () => from.setFullYear(from.getFullYear() - 2),
    '5y': () => from.setFullYear(from.getFullYear() - 5),
    '10y': () => from.setFullYear(from.getFullYear() - 10),
    'max': () => from.setFullYear(1990)
  };

  if (periodMap[period]) {
    periodMap[period]();
  }

  const fromTime = Math.floor(from.getTime() / 1000);
  const toTime = Math.floor(to.getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${fromTime}&period2=${toTime}&interval=1d&events=history`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (response.status === 429) {
    throw new RateLimitError('directYahoo', 'HTTP 429: Too Many Requests');
  }

  if (!response.ok) {
    throw new VendorError('directYahoo', `HTTP ${response.status}`);
  }

  const csv = await response.text();
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    return [];
  }

  const data = lines.slice(1).map(line => {
    const [date, open, high, low, close, volume] = line.split(',');
    return {
      timestamp: new Date(date),
      open: parseFloat(open) || 0,
      high: parseFloat(high) || 0,
      low: parseFloat(low) || 0,
      close: parseFloat(close) || 0,
      volume: parseInt(volume) || 0
    };
  }).filter(d => d.close > 0);

  return data;
}

/**
 * Get options chain
 */
async function getOptions(symbol, expiry) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=optionChain`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (response.status === 429) {
    throw new RateLimitError('directYahoo', 'HTTP 429: Too Many Requests');
  }

  if (!response.ok) {
    throw new VendorError('directYahoo', `HTTP ${response.status}`);
  }

  const jsonData = await response.json();

  if (!jsonData.quoteSummary?.result?.[0]?.optionChain?.result?.[0]) {
    return {
      expirations: [],
      options: []
    };
  }

  const optionChain = jsonData.quoteSummary.result[0].optionChain.result[0];
  const expirations = optionChain.expirationDates || [];
  let selectedExpiry = expiry;

  if (!selectedExpiry && expirations.length > 0) {
    selectedExpiry = expirations[0];
  }

  let options = [];
  if (selectedExpiry && optionChain.options) {
    const expiryOptions = optionChain.options.find(
      opt => opt.expirationDate === parseInt(selectedExpiry)
    );

    if (expiryOptions?.calls && expiryOptions?.puts) {
      const allOptions = [
        ...expiryOptions.calls.map(opt => ({ ...opt, type: 'call' })),
        ...expiryOptions.puts.map(opt => ({ ...opt, type: 'put' }))
      ];

      options = allOptions
        .sort((a, b) => a.strike - b.strike)
        .map(opt => ({
          strike: opt.strike,
          type: opt.type,
          bid: opt.bid || 0,
          ask: opt.ask || 0,
          volume: opt.volume || 0,
          openInterest: opt.openInterest || 0,
          impliedVolatility: opt.impliedVolatility || 0,
          inTheMoney: opt.inTheMoney || false,
          contractSymbol: opt.contractSymbol || ''
        }));
    }
  }

  const expirationDates = expirations.map(timestamp => {
    const date = new Date(timestamp * 1000);
    return {
      timestamp: timestamp,
      date: date.toISOString().split('T')[0],
      formatted: date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })
    };
  });

  return {
    expirations: expirationDates,
    options: options,
    selectedExpiry: selectedExpiry
  };
}

module.exports = {
  directYahooVendor,
  getQuote,
  getQuotes,
  getHistorical,
  getOptions
};
