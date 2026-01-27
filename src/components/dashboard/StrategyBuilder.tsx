import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Wand2, 
  Plus, 
  Trash2, 
  Play,
  Save,
  Copy,
  ChevronDown,
  ArrowRight,
  Settings2,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface StrategyCondition {
  id: string;
  indicator: string;
  operator: 'above' | 'below' | 'crosses_above' | 'crosses_below' | 'equals';
  value: string | number;
  timeframe: string;
}

interface StrategyAction {
  id: string;
  type: 'buy' | 'sell' | 'alert';
  instrument: 'equity' | 'call' | 'put' | 'futures';
  quantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
  entryActions: StrategyAction[];
  exitActions: StrategyAction[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    trailingStop: boolean;
    maxPositionSize: number;
  };
  status: 'draft' | 'testing' | 'active' | 'paused';
}

const INDICATORS = [
  { id: 'price', label: 'Price' },
  { id: 'rsi', label: 'RSI (14)' },
  { id: 'macd', label: 'MACD' },
  { id: 'macd_signal', label: 'MACD Signal' },
  { id: 'ema_9', label: 'EMA (9)' },
  { id: 'ema_21', label: 'EMA (21)' },
  { id: 'sma_50', label: 'SMA (50)' },
  { id: 'sma_200', label: 'SMA (200)' },
  { id: 'bb_upper', label: 'Bollinger Upper' },
  { id: 'bb_lower', label: 'Bollinger Lower' },
  { id: 'atr', label: 'ATR (14)' },
  { id: 'volume', label: 'Volume' },
  { id: 'volume_avg', label: 'Volume SMA (20)' },
  { id: 'stoch_k', label: 'Stochastic %K' },
  { id: 'stoch_d', label: 'Stochastic %D' },
  { id: 'adx', label: 'ADX' },
  { id: 'cci', label: 'CCI' },
  { id: 'williams_r', label: 'Williams %R' },
  { id: 'obv', label: 'OBV' },
  { id: 'vwap', label: 'VWAP' },
];

const OPERATORS = [
  { id: 'above', label: 'is above' },
  { id: 'below', label: 'is below' },
  { id: 'crosses_above', label: 'crosses above' },
  { id: 'crosses_below', label: 'crosses below' },
  { id: 'equals', label: 'equals' },
];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

const ConditionBuilder: React.FC<{
  condition: StrategyCondition;
  onChange: (condition: StrategyCondition) => void;
  onRemove: () => void;
}> = ({ condition, onChange, onRemove }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 group">
    <select
      value={condition.indicator}
      onChange={(e) => onChange({ ...condition, indicator: e.target.value })}
      className="premium-input flex-1 text-sm"
    >
      {INDICATORS.map(ind => (
        <option key={ind.id} value={ind.id}>{ind.label}</option>
      ))}
    </select>
    
    <select
      value={condition.operator}
      onChange={(e) => onChange({ ...condition, operator: e.target.value as StrategyCondition['operator'] })}
      className="premium-input w-36 text-sm"
    >
      {OPERATORS.map(op => (
        <option key={op.id} value={op.id}>{op.label}</option>
      ))}
    </select>
    
    <input
      type="text"
      value={condition.value}
      onChange={(e) => onChange({ ...condition, value: e.target.value })}
      placeholder="Value or indicator"
      className="premium-input w-32 text-sm font-mono"
    />
    
    <select
      value={condition.timeframe}
      onChange={(e) => onChange({ ...condition, timeframe: e.target.value })}
      className="premium-input w-20 text-sm"
    >
      {TIMEFRAMES.map(tf => (
        <option key={tf} value={tf}>{tf}</option>
      ))}
    </select>
    
    <button 
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

const ActionBuilder: React.FC<{
  action: StrategyAction;
  onChange: (action: StrategyAction) => void;
  onRemove: () => void;
}> = ({ action, onChange, onRemove }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 group">
    <select
      value={action.type}
      onChange={(e) => onChange({ ...action, type: e.target.value as StrategyAction['type'] })}
      className={cn(
        "premium-input w-24 text-sm font-semibold",
        action.type === 'buy' && "text-success",
        action.type === 'sell' && "text-destructive"
      )}
    >
      <option value="buy">BUY</option>
      <option value="sell">SELL</option>
      <option value="alert">ALERT</option>
    </select>
    
    {action.type !== 'alert' && (
      <>
        <select
          value={action.instrument}
          onChange={(e) => onChange({ ...action, instrument: e.target.value as StrategyAction['instrument'] })}
          className="premium-input w-28 text-sm"
        >
          <option value="equity">Equity</option>
          <option value="call">Call Option</option>
          <option value="put">Put Option</option>
          <option value="futures">Futures</option>
        </select>
        
        <input
          type="number"
          value={action.quantity}
          onChange={(e) => onChange({ ...action, quantity: Number(e.target.value) })}
          placeholder="Qty"
          className="premium-input w-20 text-sm font-mono"
        />
        
        <select
          value={action.orderType}
          onChange={(e) => onChange({ ...action, orderType: e.target.value as StrategyAction['orderType'] })}
          className="premium-input w-24 text-sm"
        >
          <option value="market">Market</option>
          <option value="limit">Limit</option>
        </select>
        
        {action.orderType === 'limit' && (
          <input
            type="number"
            value={action.limitPrice || ''}
            onChange={(e) => onChange({ ...action, limitPrice: Number(e.target.value) })}
            placeholder="Limit Price"
            className="premium-input w-28 text-sm font-mono"
          />
        )}
      </>
    )}
    
    <button 
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

export const StrategyBuilder: React.FC = () => {
  const [strategy, setStrategy] = useState<Strategy>({
    id: 'new-1',
    name: 'RSI Momentum Strategy',
    description: 'Buy when RSI crosses above 30 (oversold), sell when RSI crosses below 70',
    entryConditions: [
      { id: 'c1', indicator: 'rsi', operator: 'crosses_above', value: '30', timeframe: '15m' },
      { id: 'c2', indicator: 'volume', operator: 'above', value: 'volume_avg', timeframe: '15m' },
    ],
    exitConditions: [
      { id: 'c3', indicator: 'rsi', operator: 'crosses_below', value: '70', timeframe: '15m' },
    ],
    entryActions: [
      { id: 'a1', type: 'buy', instrument: 'call', quantity: 50, orderType: 'market' },
    ],
    exitActions: [
      { id: 'a2', type: 'sell', instrument: 'call', quantity: 50, orderType: 'market' },
    ],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 4,
      trailingStop: true,
      maxPositionSize: 100000,
    },
    status: 'draft',
  });

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition: StrategyCondition = {
      id: `c${Date.now()}`,
      indicator: 'price',
      operator: 'above',
      value: '',
      timeframe: '15m',
    };
    
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: [...prev.entryConditions, newCondition],
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: [...prev.exitConditions, newCondition],
      }));
    }
  };

  const addAction = (type: 'entry' | 'exit') => {
    const newAction: StrategyAction = {
      id: `a${Date.now()}`,
      type: type === 'entry' ? 'buy' : 'sell',
      instrument: 'equity',
      quantity: 1,
      orderType: 'market',
    };
    
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryActions: [...prev.entryActions, newAction],
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitActions: [...prev.exitActions, newAction],
      }));
    }
  };

  const updateCondition = (type: 'entry' | 'exit', id: string, condition: StrategyCondition) => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: prev.entryConditions.map(c => c.id === id ? condition : c),
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: prev.exitConditions.map(c => c.id === id ? condition : c),
      }));
    }
  };

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: prev.entryConditions.filter(c => c.id !== id),
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: prev.exitConditions.filter(c => c.id !== id),
      }));
    }
  };

  const updateAction = (type: 'entry' | 'exit', id: string, action: StrategyAction) => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryActions: prev.entryActions.map(a => a.id === id ? action : a),
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitActions: prev.exitActions.map(a => a.id === id ? action : a),
      }));
    }
  };

  const removeAction = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryActions: prev.entryActions.filter(a => a.id !== id),
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitActions: prev.exitActions.filter(a => a.id !== id),
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Wand2 className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Strategy Builder</h1>
            <p className="text-sm text-muted-foreground">Create and backtest trading strategies</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold",
            strategy.status === 'draft' && "bg-muted text-muted-foreground",
            strategy.status === 'testing' && "bg-warning/10 text-warning",
            strategy.status === 'active' && "bg-success/10 text-success",
            strategy.status === 'paused' && "bg-destructive/10 text-destructive"
          )}>
            {strategy.status.toUpperCase()}
          </span>
          <button className="quick-action">
            <Copy size={16} />
            Clone
          </button>
          <button className="quick-action">
            <Save size={16} />
            Save
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <Play size={16} />
            Backtest
          </button>
        </div>
      </div>

      {/* Strategy Details */}
      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Strategy Name</label>
            <input
              type="text"
              value={strategy.name}
              onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
              className="premium-input"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <input
              type="text"
              value={strategy.description}
              onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
              className="premium-input"
            />
          </div>
        </div>
      </div>

      {/* Entry Rules */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <h3 className="font-semibold">Entry Conditions</h3>
            <span className="text-xs text-muted-foreground">(ALL must be true)</span>
          </div>
          <button 
            onClick={() => addCondition('entry')}
            className="quick-action"
          >
            <Plus size={16} />
            Add Condition
          </button>
        </div>
        
        <div className="space-y-3">
          {strategy.entryConditions.map((condition, idx) => (
            <React.Fragment key={condition.id}>
              {idx > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-semibold">AND</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <ConditionBuilder
                condition={condition}
                onChange={(c) => updateCondition('entry', condition.id, c)}
                onRemove={() => removeCondition('entry', condition.id)}
              />
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <ArrowRight className="text-success" size={18} />
          <span className="text-sm font-medium text-muted-foreground">Then execute:</span>
        </div>
        
        <div className="space-y-3">
          {strategy.entryActions.map(action => (
            <ActionBuilder
              key={action.id}
              action={action}
              onChange={(a) => updateAction('entry', action.id, a)}
              onRemove={() => removeAction('entry', action.id)}
            />
          ))}
          <button 
            onClick={() => addAction('entry')}
            className="w-full p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Action
          </button>
        </div>
      </div>

      {/* Exit Rules */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <h3 className="font-semibold">Exit Conditions</h3>
            <span className="text-xs text-muted-foreground">(ANY triggers exit)</span>
          </div>
          <button 
            onClick={() => addCondition('exit')}
            className="quick-action"
          >
            <Plus size={16} />
            Add Condition
          </button>
        </div>
        
        <div className="space-y-3">
          {strategy.exitConditions.map((condition, idx) => (
            <React.Fragment key={condition.id}>
              {idx > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-semibold">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <ConditionBuilder
                condition={condition}
                onChange={(c) => updateCondition('exit', condition.id, c)}
                onRemove={() => removeCondition('exit', condition.id)}
              />
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <ArrowRight className="text-destructive" size={18} />
          <span className="text-sm font-medium text-muted-foreground">Then execute:</span>
        </div>
        
        <div className="space-y-3">
          {strategy.exitActions.map(action => (
            <ActionBuilder
              key={action.id}
              action={action}
              onChange={(a) => updateAction('exit', action.id, a)}
              onRemove={() => removeAction('exit', action.id)}
            />
          ))}
          <button 
            onClick={() => addAction('exit')}
            className="w-full p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Action
          </button>
        </div>
      </div>

      {/* Risk Management */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-warning" size={20} />
          <h3 className="font-semibold">Risk Management</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Stop Loss (%)</label>
            <input
              type="number"
              value={strategy.riskManagement.stopLoss}
              onChange={(e) => setStrategy(prev => ({
                ...prev,
                riskManagement: { ...prev.riskManagement, stopLoss: Number(e.target.value) }
              }))}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Take Profit (%)</label>
            <input
              type="number"
              value={strategy.riskManagement.takeProfit}
              onChange={(e) => setStrategy(prev => ({
                ...prev,
                riskManagement: { ...prev.riskManagement, takeProfit: Number(e.target.value) }
              }))}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Max Position Size</label>
            <input
              type="number"
              value={strategy.riskManagement.maxPositionSize}
              onChange={(e) => setStrategy(prev => ({
                ...prev,
                riskManagement: { ...prev.riskManagement, maxPositionSize: Number(e.target.value) }
              }))}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Trailing Stop</label>
            <button
              onClick={() => setStrategy(prev => ({
                ...prev,
                riskManagement: { ...prev.riskManagement, trailingStop: !prev.riskManagement.trailingStop }
              }))}
              className={cn(
                "w-full p-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                strategy.riskManagement.trailingStop
                  ? "bg-success/10 text-success border border-success/30"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {strategy.riskManagement.trailingStop ? <CheckCircle size={16} /> : null}
              {strategy.riskManagement.trailingStop ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
