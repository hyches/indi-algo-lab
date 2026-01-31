/**
 * Mock Vendor - For testing and demo purposes
 * Returns realistic market data for testing the router architecture
 */

const { VendorError } = require('../tradingErrors');

// Mock data for Indian stocks
const mockData = {
  'RELIANCE.NS': {
    symbol: 'RELIANCE.NS',
    shortName: 'Reliance Industries',
    regularMarketPrice: 3245.50,
    regularMarketChange: 45.25,
    regularMarketChangePercent: 1.42,
    regularMarketOpen: 3215.00,
    regularMarketDayHigh: 3280.00,
    regularMarketDayLow: 3200.00,
    regularMarketVolume: 45000000,
    regularMarketPreviousClose: 3200.25
  },
  'TCS.NS': {
    symbol: 'TCS.NS',
    shortName: 'Tata Consultancy Services',
    regularMarketPrice: 3880.75,
    regularMarketChange: -15.50,
    regularMarketChangePercent: -0.40,
    regularMarketOpen: 3895.00,
    regularMarketDayHigh: 3920.00,
    regularMarketDayLow: 3850.00,
    regularMarketVolume: 32000000,
    regularMarketPreviousClose: 3896.25
  },
  'INFY.NS': {
    symbol: 'INFY.NS',
    shortName: 'Infosys',
    regularMarketPrice: 1420.30,
    regularMarketChange: 22.40,
    regularMarketChangePercent: 1.60,
    regularMarketOpen: 1405.00,
    regularMarketDayHigh: 1435.50,
    regularMarketDayLow: 1410.00,
    regularMarketVolume: 28000000,
    regularMarketPreviousClose: 1397.90
  },
  'NIFTY': {
    symbol: '^NSEI',
    shortName: 'NIFTY 50',
    regularMarketPrice: 24580.25,
    regularMarketChange: 185.30,
    regularMarketChangePercent: 0.76,
    regularMarketOpen: 24420.00,
    regularMarketDayHigh: 24650.00,
    regularMarketDayLow: 24350.00,
    regularMarketVolume: 2500000000,
    regularMarketPreviousClose: 24394.95
  }
};

/**
 * Vendor implementation function
 * Signature: async fn(method, ...args)
 */
async function mockVendor(method, ...args) {
  if (method === 'quote') {
    return getQuote(args[0]);
  } else if (method === 'quotes') {
    return getQuotes(args[0]);
  } else if (method === 'historical') {
    return getHistorical(args[0], args[1]);
  } else if (method === 'options') {
    return getOptions(args[0], args[1]);
  } else {
    throw new VendorError('mock', `Unknown method: ${method}`);
  }
}

/**
 * Get single quote (mocked)
 */
async function getQuote(symbol) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const data = mockData[symbol];
  if (!data) {
    throw new VendorError('mock', `Symbol not found: ${symbol}`);
  }

  return {
    ...data,
    timestamp: new Date(),
    source: 'mock'
  };
}

/**
 * Get multiple quotes (mocked)
 */
async function getQuotes(symbols) {
  return Promise.all(symbols.map(s => getQuote(s)));
}

/**
 * Get historical data (mocked)
 */
async function getHistorical(symbol, period = '1y') {
  await new Promise(resolve => setTimeout(resolve, 50));

  const base = mockData[symbol];
  if (!base) {
    throw new VendorError('mock', `Symbol not found: ${symbol}`);
  }

  // Generate mock historical data
  const data = [];
  const days = period === '1y' ? 252 : period === '1m' ? 21 : 5;
  
  for (let i = days - 1; i >= 0; i--) {
    const variance = (Math.random() - 0.5) * base.regularMarketPrice * 0.02;
    data.push({
      date: new Date(Date.now() - i * 86400000),
      open: base.regularMarketPrice + variance,
      high: base.regularMarketPrice + variance + Math.abs(variance),
      low: base.regularMarketPrice + variance - Math.abs(variance),
      close: base.regularMarketPrice + variance,
      volume: base.regularMarketVolume
    });
  }

  return data;
}

/**
 * Get options chain (mocked)
 */
async function getOptions(symbol, expiry) {
  await new Promise(resolve => setTimeout(resolve, 100));

  const base = mockData[symbol];
  if (!base) {
    throw new VendorError('mock', `Symbol not found: ${symbol}`);
  }

  const price = base.regularMarketPrice;
  const strikes = [];
  
  // Generate ATM and nearby strikes
  for (let i = -5; i <= 5; i++) {
    const strike = Math.round(price / 50 + i) * 50; // Round to nearest 50
    strikes.push({
      strike,
      callBid: Math.max(0, price - strike + Math.random() * 10),
      callAsk: price - strike + 15 + Math.random() * 10,
      callVolume: Math.floor(Math.random() * 100000),
      callIV: 0.25 + Math.random() * 0.1,
      putBid: Math.max(0, strike - price + Math.random() * 10),
      putAsk: strike - price + 15 + Math.random() * 10,
      putVolume: Math.floor(Math.random() * 100000),
      putIV: 0.25 + Math.random() * 0.1
    });
  }

  return {
    symbol,
    expiry: expiry || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    strikes,
    source: 'mock'
  };
}

module.exports = { mockVendor };
