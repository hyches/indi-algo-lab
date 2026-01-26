import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, Volume2, VolumeX, TrendingUp, TrendingDown, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { GlassButton } from '@/components/ui/GlassButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface Alert {
  id: string;
  symbol: string;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below' | 'percent_change';
  value: number;
  triggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  sound: boolean;
  repeat: boolean;
  note?: string;
}

const ALERT_STORAGE_KEY = 'trading-alerts';

export const AlertsPanel: React.FC = () => {
  const { quotes } = useTrading();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Form state
  const [newSymbol, setNewSymbol] = useState('NIFTY');
  const [newCondition, setNewCondition] = useState<Alert['condition']>('above');
  const [newValue, setNewValue] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newSound, setNewSound] = useState(true);
  const [newRepeat, setNewRepeat] = useState(false);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ALERT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.map((a: Alert) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          triggeredAt: a.triggeredAt ? new Date(a.triggeredAt) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse alerts:', e);
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts against current prices
  useEffect(() => {
    const previousPrices = new Map<string, number>();
    
    alerts.forEach(alert => {
      if (alert.triggered && !alert.repeat) return;
      
      const quote = quotes.get(alert.symbol);
      if (!quote) return;
      
      const currentPrice = quote.regularMarketPrice;
      const prevPrice = previousPrices.get(alert.symbol) || currentPrice;
      let shouldTrigger = false;
      
      switch (alert.condition) {
        case 'above':
          shouldTrigger = currentPrice >= alert.value;
          break;
        case 'below':
          shouldTrigger = currentPrice <= alert.value;
          break;
        case 'crosses_above':
          shouldTrigger = prevPrice < alert.value && currentPrice >= alert.value;
          break;
        case 'crosses_below':
          shouldTrigger = prevPrice > alert.value && currentPrice <= alert.value;
          break;
        case 'percent_change':
          const change = Math.abs(quote.regularMarketChangePercent);
          shouldTrigger = change >= alert.value;
          break;
      }
      
      if (shouldTrigger && (!alert.triggered || alert.repeat)) {
        triggerAlert(alert, currentPrice);
      }
      
      previousPrices.set(alert.symbol, currentPrice);
    });
  }, [quotes, alerts]);

  const triggerAlert = useCallback((alert: Alert, currentPrice: number) => {
    // Play sound
    if (alert.sound && soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodHfuHxEMT9qp9TkxYlSMTdgj7vN2LOIVjM0V4Gqwdi5l2E0MlN0m63HwKB6TS0xXX+dqLy7pJRwTjAtVnGXorK3qZ6Gg1s8LFJqjZqorq2nmYqAZUI1T2aFkpujpaScjoJ2Wj43SFx4hI6WmpuXkIN4Z1RGRU9ebn2GjZCRjoiCdmhXSUdNWWl2f4WIiYaBeW1fUUpKUFxpcHl+gYGAe3NqXlJNT1VfZ3B2ent7d3JrYllST1NZYGdtcnR0c29qY1xWU1RYX2VqbnBxcG1pY11YVVVYXGFmaWtsbGtoZF9bWFlbXWFkZ2lqa2lnZGBcWVlaXF9iZGZnZ2ZkYV5bWVlbXV9hY2RlZGNhX1xaWVpbXV9hYmNjY2JgXltaWVpbXV9gYWJiYmFfXVtaWVpbXV5fYGFhYWBfXVtaWVpbXF5fYGBgYF9eXFtaWltcXV5fX2BgX15dXFtaW1tcXV5fX19fXl1cW1pbW1xdXl5fX19eXVxbW1tbXF1eXl5eXl5dXFxbW1tcXV1eXl5eXl1cXFtbW1xcXV1eXl5eXVxcW1tbXFxdXV5eXl1dXFxbW1xcXF1dXV5eXV1cXFtbXFxcXV1dXV5dXVxcW1tcXFxdXV1dXV1dXFxcW1xcXFxdXV1dXV1cXFxbXFxcXF1dXV1dXFxcXFtcXFxcXV1dXV1cXFxcXFxcXFxdXV1dXFxcXFxcXFxcXF1dXV1cXFxcXFxcXFxcXV1dXFxcXFxcXFxcXFxdXV1cXFxcXFxcXFxcXFxdXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxc');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
    
    // Show notification
    toast.success(`🔔 Alert Triggered: ${alert.symbol}`, {
      description: `Price ${getConditionText(alert.condition)} ₹${alert.value.toLocaleString()} (Current: ₹${currentPrice.toLocaleString()})`,
      duration: 10000,
    });
    
    // Update alert
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, triggered: true, triggeredAt: new Date() }
        : a
    ));
  }, [soundEnabled]);

  const createAlert = () => {
    if (!newValue) {
      toast.error('Please enter a target value');
      return;
    }
    
    const alert: Alert = {
      id: `ALT-${Date.now()}`,
      symbol: newSymbol,
      condition: newCondition,
      value: parseFloat(newValue),
      triggered: false,
      createdAt: new Date(),
      sound: newSound,
      repeat: newRepeat,
      note: newNote || undefined,
    };
    
    setAlerts(prev => [alert, ...prev]);
    setShowCreateForm(false);
    setNewValue('');
    setNewNote('');
    
    toast.success('Alert created', {
      description: `${newSymbol} ${getConditionText(newCondition)} ₹${newValue}`,
    });
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert deleted');
  };

  const clearTriggered = () => {
    setAlerts(prev => prev.filter(a => !a.triggered));
    toast.success('Triggered alerts cleared');
  };

  const getConditionText = (condition: Alert['condition']) => {
    switch (condition) {
      case 'above': return 'goes above';
      case 'below': return 'goes below';
      case 'crosses_above': return 'crosses above';
      case 'crosses_below': return 'crosses below';
      case 'percent_change': return 'changes by';
    }
  };

  const getConditionIcon = (condition: Alert['condition']) => {
    switch (condition) {
      case 'above':
      case 'crosses_above':
        return <TrendingUp size={14} className="text-success" />;
      case 'below':
      case 'crosses_below':
        return <TrendingDown size={14} className="text-destructive" />;
      case 'percent_change':
        return <Activity size={14} className="text-warning" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'TATAMOTORS', 'ITC'];

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
            <Bell className="text-warning" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Price Alerts</h2>
            <p className="text-sm text-muted-foreground">{activeAlerts.length} active, {triggeredAlerts.length} triggered</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              soundEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          <GlassButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} />
            New Alert
          </GlassButton>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="glass-card p-4 space-y-4 border border-primary/30">
          <h3 className="font-medium">Create New Alert</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Symbol</label>
              <select
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                {symbols.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Condition</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as Alert['condition'])}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <option value="above">Goes Above</option>
                <option value="below">Goes Below</option>
                <option value="crosses_above">Crosses Above</option>
                <option value="crosses_below">Crosses Below</option>
                <option value="percent_change">% Change ≥</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                {newCondition === 'percent_change' ? 'Percentage' : 'Price'}
              </label>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newCondition === 'percent_change' ? '2.5' : '25000'}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Note (optional)</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Breakout level..."
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newSound}
                onChange={(e) => setNewSound(e.target.checked)}
                className="rounded"
              />
              Play sound
            </label>
            
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newRepeat}
                onChange={(e) => setNewRepeat(e.target.checked)}
                className="rounded"
              />
              Repeat alert
            </label>
          </div>
          
          <div className="flex gap-2">
            <GlassButton variant="primary" onClick={createAlert}>
              Create Alert
            </GlassButton>
            <GlassButton onClick={() => setShowCreateForm(false)}>
              Cancel
            </GlassButton>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Active Alerts</h3>
        
        {activeAlerts.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No active alerts. Create one to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map(alert => {
              const quote = quotes.get(alert.symbol);
              const currentPrice = quote?.regularMarketPrice || 0;
              const distance = alert.condition === 'percent_change' 
                ? Math.abs(quote?.regularMarketChangePercent || 0) - alert.value
                : currentPrice - alert.value;
              
              return (
                <div key={alert.id} className="glass-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getConditionIcon(alert.condition)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.symbol}</span>
                        <span className="text-sm text-muted-foreground">
                          {getConditionText(alert.condition)} {alert.condition === 'percent_change' ? `${alert.value}%` : `₹${alert.value.toLocaleString()}`}
                        </span>
                      </div>
                      {alert.note && (
                        <p className="text-xs text-muted-foreground">{alert.note}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="font-mono">₹{currentPrice.toLocaleString()}</div>
                      <div className={cn(
                        "text-xs",
                        distance > 0 ? "text-success" : "text-destructive"
                      )}>
                        {distance > 0 ? '+' : ''}{distance.toFixed(2)} away
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {alert.sound && <Volume2 size={14} className="text-muted-foreground" />}
                      {alert.repeat && <Activity size={14} className="text-muted-foreground" />}
                    </div>
                    
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Triggered Alerts</h3>
            <button
              onClick={clearTriggered}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2">
            {triggeredAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="glass-card p-3 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-success" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {getConditionText(alert.condition)} {alert.condition === 'percent_change' ? `${alert.value}%` : `₹${alert.value.toLocaleString()}`}
                      </span>
                    </div>
                    {alert.triggeredAt && (
                      <p className="text-xs text-muted-foreground">
                        Triggered {alert.triggeredAt.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
