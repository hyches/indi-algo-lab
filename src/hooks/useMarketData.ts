// Hook for real-time market data using Angel One WebSocket
import { useState, useEffect, useCallback } from 'react';
import { angelOneWS, MarketQuote } from '@/lib/marketData/angelOne';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export function useMarketData(symbols: string[]) {
  const [quotes, setQuotes] = useState<Map<string, MarketQuote>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Connect to WebSocket
    setStatus('connecting');
    angelOneWS.connect().then(() => {
      setStatus('connected');
    }).catch((err) => {
      setStatus('error');
      setError(err.message);
    });
    
    // Subscribe to status changes
    const unsubStatus = angelOneWS.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    
    // Subscribe to each symbol
    const unsubscribers = symbols.map(symbol => 
      angelOneWS.subscribe(symbol, (quote) => {
        setQuotes(prev => {
          const newMap = new Map(prev);
          newMap.set(symbol, quote);
          return newMap;
        });
      })
    );
    
    return () => {
      unsubStatus();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [symbols.join(',')]);
  
  const getQuote = useCallback((symbol: string): MarketQuote | undefined => {
    return quotes.get(symbol);
  }, [quotes]);
  
  const getAllQuotes = useCallback((): MarketQuote[] => {
    return Array.from(quotes.values());
  }, [quotes]);
  
  return {
    quotes,
    status,
    error,
    getQuote,
    getAllQuotes,
    isConnected: status === 'connected',
  };
}

// Hook for single symbol
export function useSymbolQuote(symbol: string) {
  const { getQuote, status, isConnected } = useMarketData([symbol]);
  const [quote, setQuote] = useState<MarketQuote | undefined>(undefined);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(getQuote(symbol));
    }, 100);
    
    return () => clearInterval(interval);
  }, [symbol, getQuote]);
  
  return { quote, status, isConnected };
}
