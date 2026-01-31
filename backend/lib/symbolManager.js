/**
 * Symbol Manager for Indian Markets
 * 
 * Maps logical symbols to Yahoo Finance tickers with appropriate suffixes
 * Supports: NSE stocks, BSE stocks, Indices, Forex, Crypto
 * 
 * Indian Market Suffixes:
 * - NSE (National Stock Exchange): .NS
 * - BSE (Bombay Stock Exchange): .BO
 * - Nifty Indices: ^NSEI format
 * - Forex: INR pairs with =X suffix
 * - Crypto: Symbol-INR=X format
 */

// Symbol mapping: logical name → Yahoo Finance ticker
const SYMBOL_MAP = {
  // Indices
  'NIFTY': '^NSEI',
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'BANK_NIFTY': '^NSEBANK',
  'NIFTY_MIDCAP': '^NSEMDCP50',
  'NIFTY_IT': '^NSETECH',

  // Major Stocks - NSE
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'WIPRO': 'WIPRO.NS',
  'HDFC': 'HDFC.NS',
  'ICICI': 'ICICIBANK.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'AXIS': 'AXISBANK.NS',
  'MARUTI': 'MARUTI.NS',
  'BAJAJFINSV': 'BAJAJFINSV.NS',
  'SBI': 'SBIN.NS',
  'SBIN': 'SBIN.NS',
  'ADANIGREEN': 'ADANIGREEN.NS',
  'ADANIENT': 'ADANIENT.NS',
  'ONGC': 'ONGC.NS',
  'POWERGRID': 'POWERGRID.NS',
  'ITC': 'ITC.NS',
  'LT': 'LT.NS',
  'ASIANPAINT': 'ASIANPAINT.NS',
  'BAJAJ_AUTO': 'BAJAJAUTOIN.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'NESTLEIND': 'NESTLEIND.NS',
  'SUNPHARMA': 'SUNPHARMA.NS',
  'TECHM': 'TECHM.NS',

  // Forex
  'INR': 'INR=X',
  'USDINR': 'INR=X',
  'EURINR': 'EURINR=X',
  'GBPINR': 'GBPINR=X',

  // Crypto (trading in INR pairs)
  'BTCINR': 'BTC-INR=X',
  'ETHINR': 'ETH-INR=X',
  'DOGEINR': 'DOGE-INR=X'
};

// Reverse mapping: Yahoo ticker → logical name (for responses)
const REVERSE_MAP = Object.entries(SYMBOL_MAP).reduce((acc, [logical, yahoo]) => {
  acc[yahoo] = logical;
  return acc;
}, {});

/**
 * Get Yahoo Finance ticker from logical symbol
 * Adds default suffix (.NS) for Indian stocks if not specified
 */
function getYahooSymbol(symbol) {
  // Check mapping first
  if (SYMBOL_MAP[symbol]) {
    return SYMBOL_MAP[symbol];
  }

  // Auto-detect Indian stocks without explicit suffix
  if (!symbol.includes('.') && !symbol.includes('=X') && !symbol.includes('^')) {
    // Likely NSE stock, add .NS suffix
    return `${symbol}.NS`;
  }

  // Return as-is if it already has a suffix or looks like an index
  return symbol;
}

/**
 * Get logical symbol from Yahoo ticker (reverse mapping)
 */
function getLogicalSymbol(yahooTicker) {
  return REVERSE_MAP[yahooTicker] || yahooTicker;
}

/**
 * Validate if symbol is tradeable on supported exchanges
 */
function isValidSymbol(symbol) {
  const yahooSymbol = getYahooSymbol(symbol);
  
  // Valid if:
  // 1. In our symbol map
  // 2. Ends with .NS (NSE)
  // 3. Ends with .BO (BSE)
  // 4. Contains =X (forex/crypto)
  // 5. Starts with ^ (indices)
  
  return (
    yahooSymbol in REVERSE_MAP ||
    yahooSymbol.endsWith('.NS') ||
    yahooSymbol.endsWith('.BO') ||
    yahooSymbol.endsWith('.MCX') ||
    yahooSymbol.includes('=X') ||
    yahooSymbol.startsWith('^')
  );
}

/**
 * Get exchange from symbol
 */
function getExchange(symbol) {
  const yahooSymbol = getYahooSymbol(symbol);
  
  if (yahooSymbol.includes('^')) return 'INDICES';
  if (yahooSymbol.endsWith('.NS')) return 'NSE';
  if (yahooSymbol.endsWith('.BO')) return 'BSE';
  if (yahooSymbol.endsWith('.MCX')) return 'MCX';
  if (yahooSymbol.includes('=X')) return 'FOREX';
  
  return 'UNKNOWN';
}

/**
 * Get available symbols by exchange
 */
function getSymbolsByExchange(exchange) {
  return Object.entries(SYMBOL_MAP)
    .filter(([_, yahooSymbol]) => getExchangeFromYahoo(yahooSymbol) === exchange)
    .map(([logical, _]) => logical);
}

function getExchangeFromYahoo(yahooSymbol) {
  if (yahooSymbol.includes('^')) return 'INDICES';
  if (yahooSymbol.endsWith('.NS')) return 'NSE';
  if (yahooSymbol.endsWith('.BO')) return 'BSE';
  if (yahooSymbol.endsWith('.MCX')) return 'MCX';
  if (yahooSymbol.includes('=X')) return 'FOREX';
  return 'UNKNOWN';
}

/**
 * Get all supported symbols
 */
function getSupportedSymbols() {
  return Object.keys(SYMBOL_MAP).sort();
}

/**
 * Get symbol metadata
 */
function getSymbolMetadata(symbol) {
  const yahooSymbol = getYahooSymbol(symbol);
  const exchange = getExchange(symbol);
  
  return {
    logicalSymbol: symbol,
    yahooSymbol,
    exchange,
    isValid: isValidSymbol(symbol),
    category: getCategoryFromExchange(exchange)
  };
}

function getCategoryFromExchange(exchange) {
  const categoryMap = {
    'INDICES': 'INDEX',
    'NSE': 'EQUITY',
    'BSE': 'EQUITY',
    'MCX': 'COMMODITY',
    'FOREX': 'FOREX'
  };
  return categoryMap[exchange] || 'OTHER';
}

module.exports = {
  SYMBOL_MAP,
  REVERSE_MAP,
  getYahooSymbol,
  getLogicalSymbol,
  isValidSymbol,
  getExchange,
  getSymbolsByExchange,
  getSupportedSymbols,
  getSymbolMetadata
};
