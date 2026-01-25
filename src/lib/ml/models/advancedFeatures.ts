// Advanced Feature Engineering for Professional Trading
import { OHLCV, calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, calculateSMA, calculateEMA } from '@/lib/backtesting/engine';
import { CandlestickPattern, SupportResistance, TechnicalPattern, MarketRegime } from './modelTypes';

export interface AdvancedFeatures {
  // Price Action
  priceChanges: number[];          // Multiple timeframes
  returns: number[];               // Log returns
  volatility: number[];            // Rolling volatility
  
  // Technical Indicators
  rsi: number;
  rsiDivergence: number;           // Price vs RSI divergence
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdCrossover: number;           // -1, 0, 1
  
  // Bollinger Bands
  bbPosition: number;
  bbWidth: number;
  bbSqueeze: boolean;
  
  // Moving Averages
  smaPositions: number[];          // Price relative to multiple SMAs
  emaCrossovers: number[];         // EMA crossover signals
  
  // Volume Analysis
  volumeRatio: number;
  volumeTrend: number;
  obv: number;                     // On-Balance Volume normalized
  vwap: number;                    // VWAP position
  
  // Momentum
  momentum: number[];
  roc: number;                     // Rate of Change
  willr: number;                   // Williams %R
  stochastic: { k: number; d: number };
  cci: number;                     // Commodity Channel Index
  
  // Volatility
  atr: number;
  atrPercent: number;
  historicalVolatility: number;
  ivRank: number;
  
  // Pattern Features
  trendStrength: number;
  trendDirection: number;
  higherHighs: number;
  lowerLows: number;
  swingHighLow: number;
  
  // Candlestick
  bodyRatio: number;
  upperWickRatio: number;
  lowerWickRatio: number;
  candlePattern: string;
  
  // Support/Resistance
  nearSupport: number;
  nearResistance: number;
  
  // Time Features
  hourOfDay: number;
  dayOfWeek: number;
  monthOfYear: number;
  isMarketOpen: boolean;
  minutesToClose: number;
  
  // Market Regime
  regime: number;                  // Encoded regime
}

export const ADVANCED_FEATURE_NAMES = [
  // Price Changes (5)
  'priceChange1m', 'priceChange5m', 'priceChange15m', 'priceChange1h', 'priceChange1d',
  // Returns (3)
  'logReturn1m', 'logReturn5m', 'logReturn15m',
  // Volatility (3)
  'volatility5m', 'volatility15m', 'volatility1h',
  // RSI (2)
  'rsi', 'rsiDivergence',
  // MACD (4)
  'macd', 'macdSignal', 'macdHistogram', 'macdCrossover',
  // Bollinger (3)
  'bbPosition', 'bbWidth', 'bbSqueeze',
  // Moving Averages (8)
  'priceVsSma10', 'priceVsSma20', 'priceVsSma50', 'priceVsSma200',
  'ema9VsEma21', 'ema12VsEma26', 'sma50VsSma200', 'allMaAlignment',
  // Volume (4)
  'volumeRatio', 'volumeTrend', 'obvNormalized', 'vwapPosition',
  // Momentum (6)
  'momentum5', 'momentum10', 'roc', 'willr', 'stochK', 'stochD',
  // Volatility (4)
  'atr', 'atrPercent', 'historicalVolatility', 'ivRank',
  // Pattern (5)
  'trendStrength', 'trendDirection', 'higherHighs', 'lowerLows', 'swingHighLow',
  // Candlestick (4)
  'bodyRatio', 'upperWickRatio', 'lowerWickRatio', 'candlePatternEncoded',
  // Support/Resistance (2)
  'nearSupport', 'nearResistance',
  // Time (5)
  'hourOfDay', 'dayOfWeek', 'monthOfYear', 'isMarketOpen', 'minutesToClose',
  // Regime (1)
  'marketRegime',
];

export function extractAdvancedFeatures(
  data: OHLCV[],
  index: number,
  lookback: number = 200
): number[] | null {
  if (index < lookback) return null;
  
  const slice = data.slice(Math.max(0, index - lookback), index + 1);
  const current = slice[slice.length - 1];
  const closes = slice.map(d => d.close);
  const highs = slice.map(d => d.high);
  const lows = slice.map(d => d.low);
  const volumes = slice.map(d => d.volume);
  
  const features: number[] = [];
  
  // Price Changes (5)
  features.push(index >= 1 ? ((current.close - data[index - 1].close) / data[index - 1].close) * 100 : 0);
  features.push(index >= 5 ? ((current.close - data[index - 5].close) / data[index - 5].close) * 100 : 0);
  features.push(index >= 15 ? ((current.close - data[index - 15].close) / data[index - 15].close) * 100 : 0);
  features.push(index >= 60 ? ((current.close - data[index - 60].close) / data[index - 60].close) * 100 : 0);
  features.push(index >= 240 ? ((current.close - data[index - 240].close) / data[index - 240].close) * 100 : 0);
  
  // Log Returns (3)
  features.push(index >= 1 ? Math.log(current.close / data[index - 1].close) * 100 : 0);
  features.push(index >= 5 ? Math.log(current.close / data[index - 5].close) * 100 : 0);
  features.push(index >= 15 ? Math.log(current.close / data[index - 15].close) * 100 : 0);
  
  // Rolling Volatility (3)
  const calcVolatility = (period: number) => {
    const returns = [];
    for (let i = Math.max(1, closes.length - period); i < closes.length; i++) {
      returns.push(Math.log(closes[i] / closes[i - 1]));
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized
  };
  features.push(calcVolatility(5));
  features.push(calcVolatility(15));
  features.push(calcVolatility(60));
  
  // RSI (2)
  const rsiValues = calculateRSI(closes, 14);
  const rsi = rsiValues[rsiValues.length - 1] || 50;
  features.push(rsi / 100);
  
  // RSI Divergence
  const priceChange = closes.length > 20 ? (closes[closes.length - 1] - closes[closes.length - 20]) / closes[closes.length - 20] : 0;
  const rsiChange = rsiValues.length > 20 ? (rsiValues[rsiValues.length - 1] - rsiValues[rsiValues.length - 20]) / 100 : 0;
  const rsiDivergence = priceChange > 0 && rsiChange < 0 ? -1 : priceChange < 0 && rsiChange > 0 ? 1 : 0;
  features.push(rsiDivergence);
  
  // MACD (4)
  const macdData = calculateMACD(closes);
  const macd = macdData.macd[macdData.macd.length - 1] || 0;
  const macdSignal = macdData.signal[macdData.signal.length - 1] || 0;
  const macdHist = macdData.histogram[macdData.histogram.length - 1] || 0;
  const prevMacdHist = macdData.histogram[macdData.histogram.length - 2] || 0;
  const macdCrossover = macdHist > 0 && prevMacdHist <= 0 ? 1 : macdHist < 0 && prevMacdHist >= 0 ? -1 : 0;
  features.push(macd / current.close * 100);
  features.push(macdSignal / current.close * 100);
  features.push(macdHist / current.close * 100);
  features.push(macdCrossover);
  
  // Bollinger Bands (3)
  const bb = calculateBollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];
  const bbMiddle = bb.middle[bb.middle.length - 1];
  const bbPosition = bbUpper !== bbLower ? (current.close - bbLower) / (bbUpper - bbLower) : 0.5;
  const bbWidth = bbMiddle > 0 ? (bbUpper - bbLower) / bbMiddle : 0;
  const prevBbWidth = bb.middle.length > 5 ? 
    (bb.upper[bb.upper.length - 5] - bb.lower[bb.lower.length - 5]) / bb.middle[bb.middle.length - 5] : bbWidth;
  const bbSqueeze = bbWidth < prevBbWidth * 0.8 ? 1 : 0;
  features.push(bbPosition);
  features.push(bbWidth);
  features.push(bbSqueeze);
  
  // Moving Averages (8)
  const sma10 = calculateSMA(closes.slice(-10), 10)[0] || current.close;
  const sma20 = calculateSMA(closes.slice(-20), 20)[0] || current.close;
  const sma50 = calculateSMA(closes.slice(-50), 50)[0] || current.close;
  const sma200 = calculateSMA(closes.slice(-200), 200)[0] || current.close;
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  features.push((current.close - sma10) / sma10 * 100);
  features.push((current.close - sma20) / sma20 * 100);
  features.push((current.close - sma50) / sma50 * 100);
  features.push((current.close - sma200) / sma200 * 100);
  features.push(((ema9[ema9.length - 1] || 0) - (ema21[ema21.length - 1] || 0)) / current.close * 100);
  features.push(((ema12[ema12.length - 1] || 0) - (ema26[ema26.length - 1] || 0)) / current.close * 100);
  features.push((sma50 - sma200) / sma200 * 100);
  
  // All MA alignment
  const maAlignment = 
    (current.close > sma10 ? 1 : 0) + 
    (current.close > sma20 ? 1 : 0) + 
    (current.close > sma50 ? 1 : 0) + 
    (current.close > sma200 ? 1 : 0);
  features.push(maAlignment / 4);
  
  // Volume (4)
  const avgVolume = volumes.slice(-20, -1).reduce((a, b) => a + b, 0) / 19;
  features.push(avgVolume > 0 ? current.volume / avgVolume : 1);
  const recentVol = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const olderVol = volumes.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
  features.push(olderVol > 0 ? recentVol / olderVol : 1);
  
  // OBV (normalized)
  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += volumes[i];
    else if (closes[i] < closes[i - 1]) obv -= volumes[i];
  }
  const maxObv = volumes.reduce((a, b) => a + b, 0);
  features.push(maxObv > 0 ? obv / maxObv : 0);
  
  // VWAP position
  const typicalPrice = (current.high + current.low + current.close) / 3;
  const cumTV = slice.reduce((sum, d) => sum + (d.high + d.low + d.close) / 3 * d.volume, 0);
  const cumV = slice.reduce((sum, d) => sum + d.volume, 0);
  const vwap = cumV > 0 ? cumTV / cumV : current.close;
  features.push((current.close - vwap) / vwap * 100);
  
  // Momentum (6)
  features.push(index >= 5 ? current.close - data[index - 5].close : 0);
  features.push(index >= 10 ? current.close - data[index - 10].close : 0);
  features.push(index >= 10 ? ((current.close - data[index - 10].close) / data[index - 10].close) * 100 : 0);
  
  // Williams %R
  const high14 = Math.max(...highs.slice(-14));
  const low14 = Math.min(...lows.slice(-14));
  const willr = high14 !== low14 ? ((high14 - current.close) / (high14 - low14)) * -100 : -50;
  features.push(willr / 100);
  
  // Stochastic
  const stochK = high14 !== low14 ? ((current.close - low14) / (high14 - low14)) * 100 : 50;
  const stochDValues = [];
  for (let i = closes.length - 3; i < closes.length; i++) {
    const h = Math.max(...highs.slice(i - 14, i));
    const l = Math.min(...lows.slice(i - 14, i));
    stochDValues.push(h !== l ? ((closes[i] - l) / (h - l)) * 100 : 50);
  }
  const stochD = stochDValues.reduce((a, b) => a + b, 0) / stochDValues.length;
  features.push(stochK / 100);
  features.push(stochD / 100);
  
  // Volatility (4)
  const atrValues = calculateATR(slice, 14);
  const atr = atrValues[atrValues.length - 1] || 0;
  features.push(atr);
  features.push(current.close > 0 ? (atr / current.close) * 100 : 0);
  features.push(calcVolatility(20));
  features.push(0.5); // IV Rank placeholder
  
  // Pattern Features (5)
  const trendStrength = Math.abs(priceChange);
  const trendDirection = priceChange > 0 ? 1 : priceChange < 0 ? -1 : 0;
  features.push(Math.min(trendStrength, 1));
  features.push(trendDirection);
  
  let higherHighs = 0;
  let lowerLows = 0;
  for (let i = slice.length - 5; i < slice.length - 1; i++) {
    if (slice[i].high < slice[i + 1].high) higherHighs++;
    if (slice[i].low > slice[i + 1].low) lowerLows++;
  }
  features.push(higherHighs / 4);
  features.push(lowerLows / 4);
  features.push((higherHighs - lowerLows) / 4);
  
  // Candlestick (4)
  const body = Math.abs(current.close - current.open);
  const range = current.high - current.low;
  features.push(range > 0 ? body / range : 0);
  features.push(range > 0 ? (current.high - Math.max(current.open, current.close)) / range : 0);
  features.push(range > 0 ? (Math.min(current.open, current.close) - current.low) / range : 0);
  features.push(detectCandlePatternEncoded(current, slice));
  
  // Support/Resistance (2)
  const { nearSupport, nearResistance } = findNearestLevels(current.close, slice);
  features.push(nearSupport);
  features.push(nearResistance);
  
  // Time Features (5)
  features.push(current.timestamp.getHours() / 24);
  features.push(current.timestamp.getDay() / 7);
  features.push(current.timestamp.getMonth() / 12);
  const hour = current.timestamp.getHours();
  features.push(hour >= 9 && hour < 16 ? 1 : 0);
  features.push((16 - hour) * 60 / (7 * 60));
  
  // Market Regime (1)
  features.push(detectMarketRegimeEncoded(closes, atr));
  
  return features;
}

function detectCandlePatternEncoded(current: OHLCV, slice: OHLCV[]): number {
  const body = current.close - current.open;
  const range = current.high - current.low;
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  
  if (range === 0) return 0;
  
  // Doji
  if (Math.abs(body) / range < 0.1) return 0.1;
  
  // Hammer (bullish)
  if (lowerWick > 2 * Math.abs(body) && upperWick < Math.abs(body) * 0.3) return 0.8;
  
  // Shooting Star (bearish)
  if (upperWick > 2 * Math.abs(body) && lowerWick < Math.abs(body) * 0.3) return -0.8;
  
  // Engulfing
  if (slice.length >= 2) {
    const prev = slice[slice.length - 2];
    const prevBody = prev.close - prev.open;
    
    // Bullish Engulfing
    if (prevBody < 0 && body > 0 && Math.abs(body) > Math.abs(prevBody) * 1.5) return 0.9;
    
    // Bearish Engulfing
    if (prevBody > 0 && body < 0 && Math.abs(body) > Math.abs(prevBody) * 1.5) return -0.9;
  }
  
  // Strong bullish
  if (body > 0 && body / range > 0.7) return 0.6;
  
  // Strong bearish
  if (body < 0 && Math.abs(body) / range > 0.7) return -0.6;
  
  return body > 0 ? 0.3 : -0.3;
}

function findNearestLevels(price: number, slice: OHLCV[]): { nearSupport: number; nearResistance: number } {
  const levels: number[] = [];
  
  // Find swing highs and lows
  for (let i = 2; i < slice.length - 2; i++) {
    const isSwingHigh = slice[i].high > slice[i - 1].high && slice[i].high > slice[i - 2].high &&
                        slice[i].high > slice[i + 1].high && slice[i].high > slice[i + 2].high;
    const isSwingLow = slice[i].low < slice[i - 1].low && slice[i].low < slice[i - 2].low &&
                       slice[i].low < slice[i + 1].low && slice[i].low < slice[i + 2].low;
    
    if (isSwingHigh) levels.push(slice[i].high);
    if (isSwingLow) levels.push(slice[i].low);
  }
  
  const supports = levels.filter(l => l < price).sort((a, b) => b - a);
  const resistances = levels.filter(l => l > price).sort((a, b) => a - b);
  
  const nearestSupport = supports[0] || price * 0.95;
  const nearestResistance = resistances[0] || price * 1.05;
  
  return {
    nearSupport: (price - nearestSupport) / price,
    nearResistance: (nearestResistance - price) / price,
  };
}

function detectMarketRegimeEncoded(closes: number[], atr: number): number {
  if (closes.length < 50) return 0.5;
  
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
  const current = closes[closes.length - 1];
  
  // Calculate trend
  const trendUp = current > sma20 && sma20 > sma50;
  const trendDown = current < sma20 && sma20 < sma50;
  
  // Calculate volatility regime
  const avgAtr = closes.slice(-20).reduce((sum, _, i, arr) => {
    if (i === 0) return 0;
    return sum + Math.abs(arr[i] - arr[i - 1]);
  }, 0) / 19;
  const highVol = atr > avgAtr * 1.5;
  const lowVol = atr < avgAtr * 0.5;
  
  if (trendUp && !highVol) return 0.9;  // Trending up
  if (trendDown && !highVol) return 0.1; // Trending down
  if (highVol) return 0.3;              // Volatile
  if (lowVol) return 0.7;               // Low volatility / ranging
  return 0.5;                           // Neutral
}

// Detect candlestick patterns
export function detectCandlestickPatterns(data: OHLCV[]): CandlestickPattern[] {
  const patterns: CandlestickPattern[] = [];
  if (data.length < 5) return patterns;
  
  const current = data[data.length - 1];
  const prev = data[data.length - 2];
  const prev2 = data[data.length - 3];
  
  const body = current.close - current.open;
  const range = current.high - current.low;
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  
  // Doji
  if (range > 0 && Math.abs(body) / range < 0.1) {
    patterns.push({
      name: 'Doji',
      type: 'neutral',
      confidence: 0.7,
      significance: 'medium',
    });
  }
  
  // Hammer
  if (lowerWick > 2 * Math.abs(body) && upperWick < Math.abs(body) * 0.3 && body > 0) {
    patterns.push({
      name: 'Hammer',
      type: 'bullish',
      confidence: 0.75,
      significance: 'high',
    });
  }
  
  // Shooting Star
  if (upperWick > 2 * Math.abs(body) && lowerWick < Math.abs(body) * 0.3 && body < 0) {
    patterns.push({
      name: 'Shooting Star',
      type: 'bearish',
      confidence: 0.75,
      significance: 'high',
    });
  }
  
  // Engulfing patterns
  const prevBody = prev.close - prev.open;
  if (prevBody < 0 && body > 0 && current.open < prev.close && current.close > prev.open) {
    patterns.push({
      name: 'Bullish Engulfing',
      type: 'bullish',
      confidence: 0.8,
      significance: 'high',
    });
  }
  if (prevBody > 0 && body < 0 && current.open > prev.close && current.close < prev.open) {
    patterns.push({
      name: 'Bearish Engulfing',
      type: 'bearish',
      confidence: 0.8,
      significance: 'high',
    });
  }
  
  // Morning/Evening Star
  const prev2Body = prev2.close - prev2.open;
  if (prev2Body < 0 && Math.abs(prev.close - prev.open) < range * 0.1 && body > 0) {
    patterns.push({
      name: 'Morning Star',
      type: 'bullish',
      confidence: 0.85,
      significance: 'high',
    });
  }
  if (prev2Body > 0 && Math.abs(prev.close - prev.open) < range * 0.1 && body < 0) {
    patterns.push({
      name: 'Evening Star',
      type: 'bearish',
      confidence: 0.85,
      significance: 'high',
    });
  }
  
  // Three White Soldiers
  if (data.length >= 3) {
    const candles = data.slice(-3);
    const allBullish = candles.every(c => c.close > c.open);
    const progressive = candles[1].close > candles[0].close && candles[2].close > candles[1].close;
    if (allBullish && progressive) {
      patterns.push({
        name: 'Three White Soldiers',
        type: 'bullish',
        confidence: 0.85,
        significance: 'high',
      });
    }
  }
  
  // Three Black Crows
  if (data.length >= 3) {
    const candles = data.slice(-3);
    const allBearish = candles.every(c => c.close < c.open);
    const progressive = candles[1].close < candles[0].close && candles[2].close < candles[1].close;
    if (allBearish && progressive) {
      patterns.push({
        name: 'Three Black Crows',
        type: 'bearish',
        confidence: 0.85,
        significance: 'high',
      });
    }
  }
  
  return patterns;
}

// Detect chart patterns
export function detectChartPatterns(data: OHLCV[]): TechnicalPattern[] {
  const patterns: TechnicalPattern[] = [];
  if (data.length < 50) return patterns;
  
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const current = data[data.length - 1].close;
  
  // Find swing points
  const swingHighs: { price: number; index: number }[] = [];
  const swingLows: { price: number; index: number }[] = [];
  
  for (let i = 5; i < data.length - 5; i++) {
    const isSwingHigh = highs[i] === Math.max(...highs.slice(i - 5, i + 6));
    const isSwingLow = lows[i] === Math.min(...lows.slice(i - 5, i + 6));
    
    if (isSwingHigh) swingHighs.push({ price: highs[i], index: i });
    if (isSwingLow) swingLows.push({ price: lows[i], index: i });
  }
  
  // Double Bottom
  if (swingLows.length >= 2) {
    const recent = swingLows.slice(-2);
    const priceDiff = Math.abs(recent[0].price - recent[1].price) / recent[0].price;
    if (priceDiff < 0.02 && current > Math.max(recent[0].price, recent[1].price) * 1.02) {
      patterns.push({
        name: 'Double Bottom',
        type: 'bullish',
        confidence: 0.75,
        description: 'Bullish reversal pattern with two equal lows',
        priceTarget: current + (current - recent[0].price),
        timeframe: '1D',
      });
    }
  }
  
  // Double Top
  if (swingHighs.length >= 2) {
    const recent = swingHighs.slice(-2);
    const priceDiff = Math.abs(recent[0].price - recent[1].price) / recent[0].price;
    if (priceDiff < 0.02 && current < Math.min(recent[0].price, recent[1].price) * 0.98) {
      patterns.push({
        name: 'Double Top',
        type: 'bearish',
        confidence: 0.75,
        description: 'Bearish reversal pattern with two equal highs',
        priceTarget: current - (recent[0].price - current),
        timeframe: '1D',
      });
    }
  }
  
  // Ascending Triangle
  if (swingHighs.length >= 3 && swingLows.length >= 3) {
    const recentHighs = swingHighs.slice(-3);
    const recentLows = swingLows.slice(-3);
    const highsFlat = Math.abs(recentHighs[0].price - recentHighs[2].price) / recentHighs[0].price < 0.02;
    const lowsRising = recentLows[2].price > recentLows[0].price * 1.02;
    
    if (highsFlat && lowsRising) {
      patterns.push({
        name: 'Ascending Triangle',
        type: 'bullish',
        confidence: 0.7,
        description: 'Bullish continuation with flat resistance and rising support',
        priceTarget: recentHighs[0].price * 1.05,
        timeframe: '1D',
      });
    }
  }
  
  // Descending Triangle
  if (swingHighs.length >= 3 && swingLows.length >= 3) {
    const recentHighs = swingHighs.slice(-3);
    const recentLows = swingLows.slice(-3);
    const lowsFlat = Math.abs(recentLows[0].price - recentLows[2].price) / recentLows[0].price < 0.02;
    const highsFalling = recentHighs[2].price < recentHighs[0].price * 0.98;
    
    if (lowsFlat && highsFalling) {
      patterns.push({
        name: 'Descending Triangle',
        type: 'bearish',
        confidence: 0.7,
        description: 'Bearish continuation with flat support and falling resistance',
        priceTarget: recentLows[0].price * 0.95,
        timeframe: '1D',
      });
    }
  }
  
  // Head and Shoulders (simplified detection)
  if (swingHighs.length >= 3) {
    const [left, head, right] = swingHighs.slice(-3);
    const headHigher = head.price > left.price * 1.02 && head.price > right.price * 1.02;
    const shouldersEqual = Math.abs(left.price - right.price) / left.price < 0.03;
    
    if (headHigher && shouldersEqual && current < Math.min(left.price, right.price)) {
      patterns.push({
        name: 'Head and Shoulders',
        type: 'bearish',
        confidence: 0.8,
        description: 'Bearish reversal pattern indicating trend exhaustion',
        priceTarget: current - (head.price - current),
        timeframe: '1D',
      });
    }
  }
  
  // Bull Flag
  const recentTrend = closes.slice(-20, -10);
  const flagPeriod = closes.slice(-10);
  const trendUp = recentTrend[recentTrend.length - 1] > recentTrend[0] * 1.05;
  const flagConsolidation = Math.max(...flagPeriod) - Math.min(...flagPeriod) < 
    (recentTrend[recentTrend.length - 1] - recentTrend[0]) * 0.5;
  
  if (trendUp && flagConsolidation) {
    patterns.push({
      name: 'Bull Flag',
      type: 'bullish',
      confidence: 0.7,
      description: 'Bullish continuation pattern after strong uptrend',
      timeframe: '1D',
    });
  }
  
  // Bear Flag
  const trendDown = recentTrend[recentTrend.length - 1] < recentTrend[0] * 0.95;
  
  if (trendDown && flagConsolidation) {
    patterns.push({
      name: 'Bear Flag',
      type: 'bearish',
      confidence: 0.7,
      description: 'Bearish continuation pattern after strong downtrend',
      timeframe: '1D',
    });
  }
  
  // Cup and Handle (simplified)
  if (data.length >= 100) {
    const cupStart = closes.slice(-100, -50);
    const cupBottom = closes.slice(-70, -30);
    const cupEnd = closes.slice(-50, -20);
    const handle = closes.slice(-20);
    
    const cupFormed = cupStart[0] > Math.min(...cupBottom) * 1.1 && 
                      cupEnd[cupEnd.length - 1] > Math.min(...cupBottom) * 1.1;
    const handlePullback = Math.max(...handle) < cupEnd[cupEnd.length - 1] &&
                           Math.min(...handle) > Math.min(...cupBottom);
    
    if (cupFormed && handlePullback && current > Math.max(...handle) * 0.98) {
      patterns.push({
        name: 'Cup and Handle',
        type: 'bullish',
        confidence: 0.75,
        description: 'Bullish continuation with rounded bottom and consolidation',
        timeframe: '1D',
      });
    }
  }
  
  return patterns;
}

// Detect market regime
export function detectMarketRegime(data: OHLCV[]): MarketRegime {
  if (data.length < 50) {
    return {
      type: 'ranging',
      confidence: 0.5,
      description: 'Insufficient data for regime detection',
      recommendedStrategy: 'Wait for more data',
    };
  }
  
  const closes = data.map(d => d.close);
  const current = closes[closes.length - 1];
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
  
  // Calculate ATR for volatility
  const atrValues = calculateATR(data, 14);
  const atr = atrValues[atrValues.length - 1];
  const avgAtr = atrValues.slice(-20).reduce((a, b) => a + b, 0) / 20;
  
  // Calculate trend strength using ADX concept
  let dmPlus = 0, dmMinus = 0;
  for (let i = 1; i < Math.min(14, data.length); i++) {
    const highDiff = data[data.length - i].high - data[data.length - i - 1].high;
    const lowDiff = data[data.length - i - 1].low - data[data.length - i].low;
    
    if (highDiff > lowDiff && highDiff > 0) dmPlus += highDiff;
    if (lowDiff > highDiff && lowDiff > 0) dmMinus += lowDiff;
  }
  const adxProxy = Math.abs(dmPlus - dmMinus) / (dmPlus + dmMinus + 0.001);
  
  // Determine regime
  if (atr > avgAtr * 1.5) {
    return {
      type: 'volatile',
      confidence: Math.min(0.9, atr / avgAtr - 0.5),
      description: 'High volatility environment with increased price swings',
      recommendedStrategy: 'Reduce position size, use wider stops, consider options strategies',
    };
  }
  
  if (atr < avgAtr * 0.6) {
    return {
      type: 'low_volatility',
      confidence: Math.min(0.9, (avgAtr / atr) - 0.4),
      description: 'Low volatility consolidation phase',
      recommendedStrategy: 'Watch for breakout, consider selling options premium',
    };
  }
  
  if (current > sma20 && sma20 > sma50 && adxProxy > 0.3) {
    return {
      type: 'trending_up',
      confidence: Math.min(0.9, adxProxy + 0.3),
      description: 'Strong uptrend with aligned moving averages',
      recommendedStrategy: 'Trend following, buy dips, trail stops',
    };
  }
  
  if (current < sma20 && sma20 < sma50 && adxProxy > 0.3) {
    return {
      type: 'trending_down',
      confidence: Math.min(0.9, adxProxy + 0.3),
      description: 'Strong downtrend with aligned moving averages',
      recommendedStrategy: 'Trend following short, sell rallies, trail stops',
    };
  }
  
  return {
    type: 'ranging',
    confidence: 0.6,
    description: 'Sideways market with no clear trend',
    recommendedStrategy: 'Range trading, mean reversion, support/resistance plays',
  };
}
