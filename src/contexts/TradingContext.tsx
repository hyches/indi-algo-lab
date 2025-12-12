import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { yahooFinance, YahooQuote } from '@/lib/marketData/yahooFinance';
import { toast } from 'sonner';

// Types
export interface Position {
  id: string;
  symbol: string;
  type: 'CE' | 'PE' | 'FUT' | 'EQ';
  strike?: number;
  expiry?: string;
  qty: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
}

export interface Trade {
  id: string;
  timestamp: Date;
  symbol: string;
  type: 'CE' | 'PE' | 'FUT' | 'EQ';
  strike?: number;
  expiry?: string;
  action: 'BUY' | 'SELL';
  qty: number;
  price: number;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  pnl?: number;
}

export interface Portfolio {
  totalCapital: number;
  usedMargin: number;
  availableMargin: number;
  totalPnL: number;
  todayPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
}

interface TradingContextType {
  // Market Data
  quotes: Map<string, YahooQuote>;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  selectedOption: { type: 'CE' | 'PE'; strike: number; expiry: string } | null;
  setSelectedOption: (option: { type: 'CE' | 'PE'; strike: number; expiry: string } | null) => void;
  
  // Positions & Trades
  positions: Position[];
  trades: Trade[];
  portfolio: Portfolio;
  
  // Actions
  executeTrade: (params: {
    symbol: string;
    type: 'CE' | 'PE' | 'FUT' | 'EQ';
    action: 'BUY' | 'SELL';
    qty: number;
    price: number;
    strike?: number;
    expiry?: string;
    orderType: 'MARKET' | 'LIMIT';
  }) => Promise<Trade>;
  closePosition: (positionId: string) => Promise<void>;
  closeAllPositions: () => Promise<void>;
  
  // ML Integration
  onTradeExecuted: ((trade: Trade) => void)[];
  addTradeListener: (listener: (trade: Trade) => void) => () => void;
}

const TradingContext = createContext<TradingContextType | null>(null);

const INITIAL_CAPITAL = 1000000;

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Map<string, YahooQuote>>(new Map());
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedOption, setSelectedOption] = useState<{ type: 'CE' | 'PE'; strike: number; expiry: string } | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalCapital: INITIAL_CAPITAL,
    usedMargin: 0,
    availableMargin: INITIAL_CAPITAL,
    totalPnL: 0,
    todayPnL: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgReturn: 0,
  });
  const [tradeListeners, setTradeListeners] = useState<((trade: Trade) => void)[]>([]);

  // Subscribe to market data
  useEffect(() => {
    const symbols = yahooFinance.getAvailableSymbols();
    const unsubscribers: (() => void)[] = [];

    symbols.forEach(symbol => {
      const unsub = yahooFinance.subscribe(symbol, (quote) => {
        setQuotes(prev => {
          const newMap = new Map(prev);
          newMap.set(symbol, quote);
          return newMap;
        });
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Update positions with live prices
  useEffect(() => {
    setPositions(prevPositions => 
      prevPositions.map(pos => {
        const quote = quotes.get(pos.symbol);
        if (!quote) return pos;
        
        const ltp = quote.regularMarketPrice;
        const pnl = pos.qty > 0 
          ? (ltp - pos.avgPrice) * pos.qty 
          : (pos.avgPrice - ltp) * Math.abs(pos.qty);
        const pnlPercent = (pnl / (pos.avgPrice * Math.abs(pos.qty))) * 100;
        
        return { ...pos, ltp, pnl, pnlPercent };
      })
    );
  }, [quotes]);

  // Update portfolio calculations
  useEffect(() => {
    const unrealizedPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);
    const usedMargin = positions.reduce((acc, pos) => acc + Math.abs(pos.qty) * pos.avgPrice * 0.15, 0);
    
    const profitableTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const totalCompletedTrades = trades.filter(t => t.status === 'EXECUTED' && t.pnl !== undefined).length;
    const winRate = totalCompletedTrades > 0 ? profitableTrades / totalCompletedTrades : 0;
    const totalReturn = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const avgReturn = totalCompletedTrades > 0 ? totalReturn / totalCompletedTrades : 0;

    setPortfolio(prev => ({
      ...prev,
      usedMargin,
      availableMargin: INITIAL_CAPITAL - usedMargin + prev.realizedPnL,
      unrealizedPnL,
      totalPnL: prev.realizedPnL + unrealizedPnL,
      todayPnL: unrealizedPnL, // Simplified for demo
      winRate,
      totalTrades: trades.length,
      avgReturn,
    }));
  }, [positions, trades]);

  const executeTrade = useCallback(async (params: {
    symbol: string;
    type: 'CE' | 'PE' | 'FUT' | 'EQ';
    action: 'BUY' | 'SELL';
    qty: number;
    price: number;
    strike?: number;
    expiry?: string;
    orderType: 'MARKET' | 'LIMIT';
  }): Promise<Trade> => {
    const { symbol, type, action, qty, price, strike, expiry, orderType } = params;
    
    // Get market price for MARKET orders
    const quote = quotes.get(symbol);
    const executionPrice = orderType === 'MARKET' && quote 
      ? quote.regularMarketPrice 
      : price;

    // Check margin
    const requiredMargin = qty * executionPrice * 0.15;
    if (requiredMargin > portfolio.availableMargin && action === 'BUY') {
      toast.error('Insufficient margin', {
        description: `Required: ₹${requiredMargin.toFixed(0)}, Available: ₹${portfolio.availableMargin.toFixed(0)}`,
      });
      throw new Error('Insufficient margin');
    }

    const trade: Trade = {
      id: `TRD-${Date.now()}`,
      timestamp: new Date(),
      symbol,
      type,
      strike,
      expiry,
      action,
      qty,
      price: executionPrice,
      status: 'EXECUTED',
    };

    // Update trades
    setTrades(prev => [trade, ...prev]);

    // Update positions
    setPositions(prev => {
      const existingPos = prev.find(p => 
        p.symbol === symbol && 
        p.type === type && 
        p.strike === strike && 
        p.expiry === expiry
      );

      if (existingPos) {
        // Modify existing position
        const newQty = action === 'BUY' 
          ? existingPos.qty + qty 
          : existingPos.qty - qty;

        if (newQty === 0) {
          // Position closed
          const closingPnl = action === 'SELL'
            ? (executionPrice - existingPos.avgPrice) * qty
            : (existingPos.avgPrice - executionPrice) * qty;
          
          // Update realized PnL
          setPortfolio(p => ({
            ...p,
            realizedPnL: p.realizedPnL + closingPnl,
          }));

          // Update trade with PnL
          setTrades(t => t.map(tr => 
            tr.id === trade.id ? { ...tr, pnl: closingPnl } : tr
          ));

          return prev.filter(p => p.id !== existingPos.id);
        }

        // Calculate new average price for additions
        const newAvgPrice = action === 'BUY'
          ? (existingPos.avgPrice * existingPos.qty + executionPrice * qty) / (existingPos.qty + qty)
          : existingPos.avgPrice;

        return prev.map(p => 
          p.id === existingPos.id 
            ? { ...p, qty: newQty, avgPrice: newAvgPrice }
            : p
        );
      } else {
        // New position
        const newPosition: Position = {
          id: `POS-${Date.now()}`,
          symbol,
          type,
          strike,
          expiry,
          qty: action === 'BUY' ? qty : -qty,
          avgPrice: executionPrice,
          ltp: executionPrice,
          pnl: 0,
          pnlPercent: 0,
          openedAt: new Date(),
        };
        return [...prev, newPosition];
      }
    });

    // Notify listeners (for ML training)
    tradeListeners.forEach(listener => listener(trade));

    // Show success toast
    const actionText = action === 'BUY' ? 'Bought' : 'Sold';
    const typeText = type === 'EQ' ? '' : ` ${type}`;
    const strikeText = strike ? ` ${strike}` : '';
    
    toast.success(`Order Executed`, {
      description: `${actionText} ${qty} ${symbol}${typeText}${strikeText} @ ₹${executionPrice.toFixed(2)}`,
    });

    return trade;
  }, [quotes, portfolio.availableMargin, tradeListeners]);

  const closePosition = useCallback(async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const quote = quotes.get(position.symbol);
    const closePrice = quote?.regularMarketPrice || position.ltp;
    const closeAction = position.qty > 0 ? 'SELL' : 'BUY';

    await executeTrade({
      symbol: position.symbol,
      type: position.type,
      action: closeAction,
      qty: Math.abs(position.qty),
      price: closePrice,
      strike: position.strike,
      expiry: position.expiry,
      orderType: 'MARKET',
    });
  }, [positions, quotes, executeTrade]);

  const closeAllPositions = useCallback(async () => {
    for (const position of positions) {
      await closePosition(position.id);
    }
    toast.success('All positions closed');
  }, [positions, closePosition]);

  const addTradeListener = useCallback((listener: (trade: Trade) => void) => {
    setTradeListeners(prev => [...prev, listener]);
    return () => {
      setTradeListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  return (
    <TradingContext.Provider value={{
      quotes,
      selectedSymbol,
      setSelectedSymbol,
      selectedOption,
      setSelectedOption,
      positions,
      trades,
      portfolio,
      executeTrade,
      closePosition,
      closeAllPositions,
      onTradeExecuted: tradeListeners,
      addTradeListener,
    }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within TradingProvider');
  }
  return context;
};
