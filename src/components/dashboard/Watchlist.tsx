import React, { useState, useEffect } from 'react';
import { TiltCard } from '@/components/ui/TiltCard';
import { watchlistData, StockQuote } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatNumber = (value: number, decimals: number = 2) => {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

interface WatchlistItemProps {
  stock: StockQuote;
  onClick?: () => void;
}

const WatchlistItem: React.FC<WatchlistItemProps> = ({ stock, onClick }) => {
  const isPositive = stock.change >= 0;
  
  return (
    <TiltCard 
      className="p-4 cursor-pointer group" 
      intensity={5}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{stock.symbol}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {stock.exchange}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
        </div>
        
        <div className="text-right space-y-1">
          <p className="font-mono font-semibold">₹{formatNumber(stock.ltp)}</p>
          <div className={cn(
            'flex items-center justify-end gap-1 text-sm',
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-mono">
              {isPositive ? '+' : ''}{formatNumber(stock.change)} ({isPositive ? '+' : ''}{formatNumber(stock.changePercent)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Open</p>
          <p className="font-mono">₹{formatNumber(stock.open)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">High</p>
          <p className="font-mono text-emerald-400">₹{formatNumber(stock.high)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Low</p>
          <p className="font-mono text-rose-400">₹{formatNumber(stock.low)}</p>
        </div>
      </div>

      <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
        <Star size={14} />
      </button>
    </TiltCard>
  );
};

interface WatchlistProps {
  onSelectStock?: (stock: StockQuote) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({ onSelectStock }) => {
  const [stocks, setStocks] = useState(watchlistData);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const priceChange = (Math.random() - 0.5) * 10;
          const newLtp = stock.ltp + priceChange;
          const newChange = newLtp - stock.open;
          const newChangePercent = (newChange / stock.open) * 100;
          
          return {
            ...stock,
            ltp: newLtp,
            change: newChange,
            changePercent: newChangePercent,
            high: Math.max(stock.high, newLtp),
            low: Math.min(stock.low, newLtp),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Watchlist</h2>
          <p className="text-sm text-muted-foreground">Live market data</p>
        </div>
        <button className="glass-button p-2 hover:text-primary">
          <Plus size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {stocks.map(stock => (
          <WatchlistItem 
            key={stock.symbol} 
            stock={stock}
            onClick={() => onSelectStock?.(stock)}
          />
        ))}
      </div>
    </div>
  );
};
