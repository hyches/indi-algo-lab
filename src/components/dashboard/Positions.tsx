import React from 'react';
import { TiltCard } from '@/components/ui/TiltCard';
import { positionsData, Position } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

interface PositionRowProps {
  position: Position;
  onClose?: () => void;
}

const PositionRow: React.FC<PositionRowProps> = ({ position, onClose }) => {
  const isProfit = position.pnl >= 0;
  const isShort = position.qty < 0;

  return (
    <TiltCard className="p-4" intensity={4}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{position.symbol}</span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              position.type === 'CE' && 'bg-emerald-500/20 text-emerald-400',
              position.type === 'PE' && 'bg-rose-500/20 text-rose-400',
              position.type === 'FUT' && 'bg-primary/20 text-primary'
            )}>
              {position.type}
              {position.strike && ` ${position.strike}`}
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isShort ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            )}>
              {isShort ? 'SHORT' : 'LONG'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Expiry: {position.expiry} | Qty: <span className="text-foreground">{Math.abs(position.qty)}</span>
          </p>
        </div>

        <div className="flex items-start gap-4">
          <div className="text-right space-y-1">
            <p className={cn(
              'text-lg font-semibold font-mono flex items-center gap-1',
              isProfit ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatCurrency(position.pnl)}
            </p>
            <p className={cn(
              'text-sm font-mono',
              isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'
            )}>
              {isProfit ? '+' : ''}{position.pnlPercent.toFixed(2)}%
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground">Avg Price</p>
          <p className="font-mono text-foreground">₹{position.avgPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">LTP</p>
          <p className="font-mono text-foreground">₹{position.ltp.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Value</p>
          <p className="font-mono text-foreground">{formatCurrency(Math.abs(position.qty) * position.ltp)}</p>
        </div>
      </div>
    </TiltCard>
  );
};

interface PositionsProps {
  onClosePosition?: (id: string) => void;
}

export const Positions: React.FC<PositionsProps> = ({ onClosePosition }) => {
  const totalPnL = positionsData.reduce((acc, pos) => acc + pos.pnl, 0);
  const isOverallProfit = totalPnL >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Open Positions</h2>
          <p className="text-sm text-muted-foreground">{positionsData.length} active positions</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total P&L</p>
          <p className={cn(
            'text-lg font-semibold font-mono',
            isOverallProfit ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {formatCurrency(totalPnL)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {positionsData.map(position => (
          <PositionRow 
            key={position.id} 
            position={position}
            onClose={() => onClosePosition?.(position.id)}
          />
        ))}
      </div>

      <GlassButton variant="destructive" className="w-full">
        Close All Positions
      </GlassButton>
    </div>
  );
};
