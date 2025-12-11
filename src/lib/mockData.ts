// Mock data for Indian stock market - NSE/BSE
export interface StockQuote {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  exchange: 'NSE' | 'BSE';
}

export interface OptionData {
  strikePrice: number;
  callOI: number;
  callOIChange: number;
  callLTP: number;
  callIV: number;
  putOI: number;
  putOIChange: number;
  putLTP: number;
  putIV: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'CE' | 'PE' | 'FUT';
  strike?: number;
  expiry: string;
  qty: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

export interface Trade {
  id: string;
  timestamp: Date;
  symbol: string;
  type: 'CE' | 'PE' | 'FUT';
  strike?: number;
  action: 'BUY' | 'SELL';
  qty: number;
  price: number;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED';
}

export interface MLSignal {
  symbol: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  predictedMove: number;
  timestamp: Date;
  features: {
    name: string;
    value: number;
    weight: number;
  }[];
}

// Nifty 50 Index Components (top ones)
export const watchlistData: StockQuote[] = [
  { symbol: 'NIFTY', name: 'Nifty 50', ltp: 24850.50, change: 125.30, changePercent: 0.51, open: 24725.20, high: 24892.00, low: 24680.50, volume: 245000000, exchange: 'NSE' },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', ltp: 52340.75, change: -180.25, changePercent: -0.34, open: 52521.00, high: 52600.00, low: 52200.00, volume: 89000000, exchange: 'NSE' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2945.80, change: 32.50, changePercent: 1.12, open: 2913.30, high: 2958.00, low: 2905.00, volume: 12500000, exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy', ltp: 4125.60, change: -45.20, changePercent: -1.08, open: 4170.80, high: 4180.00, low: 4100.00, volume: 3200000, exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1685.25, change: 18.75, changePercent: 1.13, open: 1666.50, high: 1692.00, low: 1660.00, volume: 8900000, exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys', ltp: 1892.40, change: -12.60, changePercent: -0.66, open: 1905.00, high: 1910.00, low: 1885.00, volume: 5600000, exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1245.90, change: 28.40, changePercent: 2.33, open: 1217.50, high: 1252.00, low: 1215.00, volume: 7800000, exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 825.75, change: -8.25, changePercent: -0.99, open: 834.00, high: 838.00, low: 820.00, volume: 15200000, exchange: 'NSE' },
];

// Generate option chain data for Nifty
export const generateOptionChain = (spotPrice: number): OptionData[] => {
  const strikes: OptionData[] = [];
  const baseStrike = Math.round(spotPrice / 50) * 50;
  
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + i * 50;
    const distance = Math.abs(spotPrice - strike);
    const moneyness = distance / spotPrice;
    
    strikes.push({
      strikePrice: strike,
      callOI: Math.round(Math.random() * 500000 + 100000),
      callOIChange: Math.round((Math.random() - 0.5) * 50000),
      callLTP: Math.max(5, strike < spotPrice ? spotPrice - strike + Math.random() * 50 : Math.random() * 100 * Math.exp(-moneyness * 10)),
      callIV: 12 + Math.random() * 8 + moneyness * 20,
      putOI: Math.round(Math.random() * 500000 + 100000),
      putOIChange: Math.round((Math.random() - 0.5) * 50000),
      putLTP: Math.max(5, strike > spotPrice ? strike - spotPrice + Math.random() * 50 : Math.random() * 100 * Math.exp(-moneyness * 10)),
      putIV: 12 + Math.random() * 8 + moneyness * 20,
    });
  }
  
  return strikes;
};

export const optionChainData = generateOptionChain(24850);

// Mock positions
export const positionsData: Position[] = [
  { id: '1', symbol: 'NIFTY', type: 'CE', strike: 24900, expiry: '26-DEC-24', qty: 50, avgPrice: 185.50, ltp: 210.25, pnl: 1237.50, pnlPercent: 13.34 },
  { id: '2', symbol: 'NIFTY', type: 'PE', strike: 24800, expiry: '26-DEC-24', qty: -50, avgPrice: 145.00, ltp: 125.75, pnl: 962.50, pnlPercent: 13.28 },
  { id: '3', symbol: 'BANKNIFTY', type: 'CE', strike: 52500, expiry: '26-DEC-24', qty: 15, avgPrice: 320.00, ltp: 285.50, pnl: -517.50, pnlPercent: -10.78 },
  { id: '4', symbol: 'RELIANCE', type: 'FUT', expiry: '26-DEC-24', qty: 250, avgPrice: 2920.00, ltp: 2945.80, pnl: 6450.00, pnlPercent: 0.88 },
];

// Mock trades history
export const tradesData: Trade[] = [
  { id: '1', timestamp: new Date(), symbol: 'NIFTY', type: 'CE', strike: 24900, action: 'BUY', qty: 50, price: 185.50, status: 'EXECUTED' },
  { id: '2', timestamp: new Date(Date.now() - 3600000), symbol: 'NIFTY', type: 'PE', strike: 24800, action: 'SELL', qty: 50, price: 145.00, status: 'EXECUTED' },
  { id: '3', timestamp: new Date(Date.now() - 7200000), symbol: 'BANKNIFTY', type: 'CE', strike: 52500, action: 'BUY', qty: 15, price: 320.00, status: 'EXECUTED' },
  { id: '4', timestamp: new Date(Date.now() - 10800000), symbol: 'RELIANCE', type: 'FUT', action: 'BUY', qty: 250, price: 2920.00, status: 'EXECUTED' },
];

// ML Signals
export const mlSignals: MLSignal[] = [
  {
    symbol: 'NIFTY',
    signal: 'BULLISH',
    confidence: 0.78,
    predictedMove: 1.2,
    timestamp: new Date(),
    features: [
      { name: 'RSI', value: 58, weight: 0.25 },
      { name: 'MACD', value: 0.8, weight: 0.30 },
      { name: 'Volume Trend', value: 1.15, weight: 0.20 },
      { name: 'OI Analysis', value: 0.65, weight: 0.25 },
    ],
  },
  {
    symbol: 'BANKNIFTY',
    signal: 'BEARISH',
    confidence: 0.65,
    predictedMove: -0.8,
    timestamp: new Date(),
    features: [
      { name: 'RSI', value: 42, weight: 0.25 },
      { name: 'MACD', value: -0.3, weight: 0.30 },
      { name: 'Volume Trend', value: 0.92, weight: 0.20 },
      { name: 'OI Analysis', value: -0.45, weight: 0.25 },
    ],
  },
];

// Portfolio summary
export const portfolioSummary = {
  totalCapital: 1000000,
  usedMargin: 425000,
  availableMargin: 575000,
  totalPnL: 8132.50,
  todayPnL: 2850.25,
  realizedPnL: 15420.00,
  unrealizedPnL: -7287.50,
  winRate: 0.68,
  totalTrades: 156,
  avgReturn: 1.24,
};
