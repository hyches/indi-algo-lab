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

// Yahoo Finance Service - Real API integration
class YahooFinanceService {
  private cache: Map<string, YahooQuote> = new Map();
  private subscribers: Map<string, ((quote: YahooQuote) => void)[]> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://your-backend-url.com/api'
    : 'http://localhost:3001/api';

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start real-time updates every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateAllQuotes();
    }, 5000);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }

  private async updateAllQuotes(): Promise<void> {
    const symbols = Array.from(this.cache.keys());
    if (symbols.length === 0) return;

    try {
      const response = await fetch(`${this.API_BASE}/market/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const quotes: YahooQuote[] = await response.json();

      quotes.forEach(quote => {
        this.cache.set(quote.symbol, quote);
        this.notifySubscribers(quote.symbol, quote);
      });
    } catch (error) {
      console.error('Error updating quotes:', error);
    }
  }

  subscribe(symbol: string, callback: (quote: YahooQuote) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);

    // Fetch initial data
    this.getQuote(symbol).then(quote => {
      if (quote) {
        callback(quote);
      }
    });

    // Start service if not running
    if (!this.isRunning) {
      this.start();
    }

    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        const idx = subs.indexOf(callback);
        if (idx > -1) subs.splice(idx, 1);
      }
    };
  }

  async getQuote(symbol: string): Promise<YahooQuote | undefined> {
    try {
      const response = await fetch(`${this.API_BASE}/market/quote/${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const quote: YahooQuote = await response.json();
      this.cache.set(symbol, quote);
      return quote;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return undefined;
    }
  }

  getAllQuotes(): YahooQuote[] {
    return Array.from(this.cache.values());
  }

  getAvailableSymbols(): string[] {
    return ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'WIPRO'];
  }

  private notifySubscribers(symbol: string, quote: YahooQuote): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => cb(quote));
    }
  }
}

export const yahooFinance = new YahooFinanceService();
