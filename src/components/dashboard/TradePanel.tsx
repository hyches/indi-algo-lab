import React, { useState } from 'react';
import { TiltCard } from '@/components/ui/TiltCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import { ArrowUpCircle, ArrowDownCircle, Calculator } from 'lucide-react';

interface TradePanelProps {
  symbol?: string;
  type?: 'CE' | 'PE' | 'FUT';
  strike?: number;
  expiry?: string;
}

export const TradePanel: React.FC<TradePanelProps> = ({
  symbol = 'NIFTY',
  type = 'CE',
  strike = 24900,
  expiry = '26-DEC-24',
}) => {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState(50);
  const [price, setPrice] = useState(210.25);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');

  const lotSize = symbol === 'NIFTY' ? 50 : symbol === 'BANKNIFTY' ? 15 : 250;
  const margin = action === 'BUY' ? qty * price : qty * price * 0.15;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Place Order</h2>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            type === 'CE' && 'bg-emerald-500/20 text-emerald-400',
            type === 'PE' && 'bg-rose-500/20 text-rose-400',
            type === 'FUT' && 'bg-primary/20 text-primary'
          )}>
            {symbol} {type} {strike}
          </span>
        </div>
      </div>

      <TiltCard className="p-5 space-y-5" intensity={4}>
        {/* Action Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50">
          <button
            onClick={() => setAction('BUY')}
            className={cn(
              'py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
              action === 'BUY' 
                ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/30' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowUpCircle size={18} />
            BUY
          </button>
          <button
            onClick={() => setAction('SELL')}
            className={cn(
              'py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2',
              action === 'SELL' 
                ? 'bg-rose-500 text-rose-950 shadow-lg shadow-rose-500/30' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowDownCircle size={18} />
            SELL
          </button>
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['MARKET', 'LIMIT'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium transition-all border',
                  orderType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Quantity</span>
            <span className="text-xs">Lot Size: {lotSize}</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setQty(Math.max(lotSize, qty - lotSize))}
              className="glass-button px-4 py-2 text-lg font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Math.max(lotSize, parseInt(e.target.value) || lotSize))}
              step={lotSize}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2 text-center font-mono text-lg focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={() => setQty(qty + lotSize)}
              className="glass-button px-4 py-2 text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Price */}
        {orderType === 'LIMIT' && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              step={0.05}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 font-mono text-lg focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* Order Summary */}
        <div className="p-4 rounded-xl bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calculator size={16} />
            Order Summary
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value</span>
              <span className="font-mono">₹{(qty * price).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required Margin</span>
              <span className="font-mono">₹{margin.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lots</span>
              <span className="font-mono">{qty / lotSize}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <GlassButton
          variant={action === 'BUY' ? 'success' : 'destructive'}
          size="lg"
          className="w-full"
          withTilt
        >
          {action} {qty} @ {orderType === 'MARKET' ? 'Market' : `₹${price}`}
        </GlassButton>
      </TiltCard>
    </div>
  );
};
