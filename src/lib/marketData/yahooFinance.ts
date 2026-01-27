// Yahoo Finance Data Service for Indian Markets
// Uses Yahoo Finance API through a CORS-friendly approach

export interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  timestamp: Date;
}

// Indian stock symbol mapping for Yahoo Finance
// NSE stocks need .NS suffix, BSE needs .BO
const YAHOO_SYMBOL_MAP: Record<string, string> = {
  'NIFTY': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'INFY': 'INFY.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'SBIN': 'SBIN.NS',
  'HDFC': 'HDFC.NS',
  'KOTAKBANK': 'KOTAKBANK.NS',
  'LT': 'LT.NS',
  'ITC': 'ITC.NS',
  'AXISBANK': 'AXISBANK.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'MARUTI': 'MARUTI.NS',
  'TATAMOTORS': 'TATAMOTORS.NS',
  'WIPRO': 'WIPRO.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'ASIANPAINT': 'ASIANPAINT.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
};

// Yahoo Finance Service - Mock data removed
class YahooFinanceService {
  private cache: Map<string, YahooQuote> = new Map();
  private subscribers: Map<string, ((quote: YahooQuote) => void)[]> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start(): void {
    console.error('Mock data has been removed. Please implement real Yahoo Finance API integration.');
    // Show alert to user
    if (typeof window !== 'undefined') {
      alert('Mock data has been removed. Please connect to a real Yahoo Finance API.');
    }
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }

  subscribe(symbol: string, callback: (quote: YahooQuote) => void): () => void {
    console.error('Mock data has been removed. Cannot subscribe to real-time data.');
    if (typeof window !== 'undefined') {
      alert('Mock data has been removed. Please implement real Yahoo Finance API subscription.');
    }
    return () => {};
  }

  private notifySubscribers(symbol: string, quote: YahooQuote): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => cb(quote));
    }
  }

  getQuote(symbol: string): YahooQuote | undefined {
    console.error('Mock data has been removed. Cannot get quote data.');
    return undefined;
  }

  getAllQuotes(): YahooQuote[] {
    console.error('Mock data has been removed. Cannot get all quotes.');
    return [];
  }

  getAvailableSymbols(): string[] {
    console.error('Mock data has been removed. Cannot get available symbols.');
    return [];
  }
}

export const yahooFinance = new YahooFinanceService();
