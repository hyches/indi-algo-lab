import React, { useState, useMemo } from 'react';
import { useTrading } from '@/contexts/TradingContext';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Activity,
  BarChart3,
  Calculator,
  Target,
  Percent,
  DollarSign,
  RefreshCw,
  Info,
  Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ScatterChart, Scatter, Cell, BarChart, Bar
} from 'recharts';

interface RiskMetrics {
  portfolioVaR95: number;
  portfolioVaR99: number;
  expectedShortfall: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  volatility: number;
  correlationToNifty: number;
}

interface PositionRisk {
  symbol: string;
  weight: number;
  individualVaR: number;
  marginalVaR: number;
  componentVaR: number;
  beta: number;
  contribution: number;
}

interface CorrelationData {
  symbol: string;
  correlations: Record<string, number>;
}

interface DrawdownData {
  date: string;
  value: number;
  drawdown: number;
  peak: number;
}

// Generate mock risk metrics
const generateRiskMetrics = (): RiskMetrics => ({
  portfolioVaR95: -45000 + Math.random() * 10000,
  portfolioVaR99: -65000 + Math.random() * 10000,
  expectedShortfall: -75000 + Math.random() * 10000,
  maxDrawdown: -18.5 + Math.random() * 5,
  currentDrawdown: -3.2 + Math.random() * 3,
  sharpeRatio: 1.2 + Math.random() * 0.8,
  sortinoRatio: 1.5 + Math.random() * 1,
  calmarRatio: 0.8 + Math.random() * 0.6,
  beta: 0.85 + Math.random() * 0.3,
  alpha: 2.5 + Math.random() * 3,
  volatility: 12 + Math.random() * 8,
  correlationToNifty: 0.75 + Math.random() * 0.2,
});

const generatePositionRisks = (): PositionRisk[] => {
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
  return symbols.map(symbol => ({
    symbol,
    weight: 15 + Math.random() * 10,
    individualVaR: -8000 + Math.random() * 4000,
    marginalVaR: -2000 + Math.random() * 1000,
    componentVaR: -5000 + Math.random() * 3000,
    beta: 0.7 + Math.random() * 0.6,
    contribution: 15 + Math.random() * 10,
  }));
};

const generateCorrelationMatrix = (): CorrelationData[] => {
  const symbols = ['NIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
  return symbols.map(symbol => {
    const correlations: Record<string, number> = {};
    symbols.forEach(other => {
      correlations[other] = symbol === other ? 1 : 0.3 + Math.random() * 0.5;
    });
    return { symbol, correlations };
  });
};

const generateDrawdownData = (): DrawdownData[] => {
  const data: DrawdownData[] = [];
  let peak = 1000000;
  let value = 1000000;
  
  for (let i = 0; i < 252; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (252 - i));
    
    value = value * (1 + (Math.random() - 0.48) * 0.02);
    peak = Math.max(peak, value);
    const drawdown = ((value - peak) / peak) * 100;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
      peak,
      drawdown,
    });
  }
  
  return data;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const RiskGauge: React.FC<{ value: number; max: number; label: string; color: string }> = ({ 
  value, max, label, color 
}) => {
  const percentage = Math.min(Math.abs(value) / max * 100, 100);
  
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className={cn("text-sm font-bold font-mono", color)}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", 
            color === 'text-success' ? 'bg-success' : 
            color === 'text-warning' ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const CorrelationCell: React.FC<{ value: number }> = ({ value }) => {
  const intensity = Math.abs(value);
  const hue = value >= 0 ? 152 : 0;
  const backgroundColor = `hsl(${hue}, 70%, ${90 - intensity * 40}%)`;
  
  return (
    <div 
      className="w-12 h-12 flex items-center justify-center text-xs font-mono font-semibold rounded-md"
      style={{ backgroundColor }}
    >
      {value.toFixed(2)}
    </div>
  );
};

export const RiskAnalytics: React.FC = () => {
  const { portfolio } = useTrading();
  const [riskMetrics] = useState<RiskMetrics>(() => generateRiskMetrics());
  const [positionRisks] = useState<PositionRisk[]>(() => generatePositionRisks());
  const [correlationMatrix] = useState<CorrelationData[]>(() => generateCorrelationMatrix());
  const [drawdownData] = useState<DrawdownData[]>(() => generateDrawdownData());
  const [confidenceLevel, setConfidenceLevel] = useState<95 | 99>(95);

  const riskScore = useMemo(() => {
    let score = 100;
    if (Math.abs(riskMetrics.currentDrawdown) > 5) score -= 15;
    if (Math.abs(riskMetrics.currentDrawdown) > 10) score -= 20;
    if (riskMetrics.volatility > 20) score -= 10;
    if (riskMetrics.sharpeRatio < 1) score -= 15;
    if (riskMetrics.beta > 1.2) score -= 10;
    return Math.max(0, Math.min(100, score));
  }, [riskMetrics]);

  const riskLevel = riskScore >= 70 ? 'Low' : riskScore >= 40 ? 'Medium' : 'High';
  const riskColor = riskScore >= 70 ? 'text-success' : riskScore >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Shield className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Risk Analytics</h1>
            <p className="text-sm text-muted-foreground">Portfolio risk management & analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-xl font-semibold flex items-center gap-2",
            riskScore >= 70 ? "bg-success/10 text-success" :
            riskScore >= 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
          )}>
            <Shield size={16} />
            Risk Score: {riskScore}/100
          </div>
          <button className="quick-action">
            <RefreshCw size={16} />
            Recalculate
          </button>
        </div>
      </div>

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card-destructive">
          <p className="metric-label">VaR (95%)</p>
          <p className="metric-value">{formatCurrency(riskMetrics.portfolioVaR95)}</p>
          <p className="text-xs text-muted-foreground">Daily</p>
        </div>
        <div className="stat-card-destructive">
          <p className="metric-label">VaR (99%)</p>
          <p className="metric-value">{formatCurrency(riskMetrics.portfolioVaR99)}</p>
          <p className="text-xs text-muted-foreground">Daily</p>
        </div>
        <div className="stat-card">
          <p className="metric-label">Max Drawdown</p>
          <p className="metric-value text-destructive">{riskMetrics.maxDrawdown.toFixed(1)}%</p>
        </div>
        <div className={riskMetrics.sharpeRatio >= 1 ? "stat-card-success" : "stat-card"}>
          <p className="metric-label">Sharpe Ratio</p>
          <p className="metric-value">{riskMetrics.sharpeRatio.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="metric-label">Beta</p>
          <p className="metric-value">{riskMetrics.beta.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="metric-label">Volatility</p>
          <p className="metric-value">{riskMetrics.volatility.toFixed(1)}%</p>
        </div>
      </div>

      {/* Risk Ratios Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RiskGauge 
          value={riskMetrics.sharpeRatio} 
          max={3} 
          label="Sharpe Ratio" 
          color={riskMetrics.sharpeRatio >= 1.5 ? 'text-success' : riskMetrics.sharpeRatio >= 1 ? 'text-warning' : 'text-destructive'}
        />
        <RiskGauge 
          value={riskMetrics.sortinoRatio} 
          max={3} 
          label="Sortino Ratio" 
          color={riskMetrics.sortinoRatio >= 2 ? 'text-success' : riskMetrics.sortinoRatio >= 1 ? 'text-warning' : 'text-destructive'}
        />
        <RiskGauge 
          value={riskMetrics.calmarRatio} 
          max={2} 
          label="Calmar Ratio" 
          color={riskMetrics.calmarRatio >= 1 ? 'text-success' : riskMetrics.calmarRatio >= 0.5 ? 'text-warning' : 'text-destructive'}
        />
        <RiskGauge 
          value={riskMetrics.alpha} 
          max={10} 
          label="Alpha (%)" 
          color={riskMetrics.alpha >= 3 ? 'text-success' : riskMetrics.alpha >= 0 ? 'text-warning' : 'text-destructive'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drawdown Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-destructive" size={20} />
            <h3 className="font-semibold">Drawdown Analysis</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData.slice(-60)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            <span>Current: {riskMetrics.currentDrawdown.toFixed(2)}%</span>
            <span>Max: {riskMetrics.maxDrawdown.toFixed(2)}%</span>
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-primary" size={20} />
            <h3 className="font-semibold">Correlation Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="flex flex-col gap-1">
              {/* Header */}
              <div className="flex gap-1 ml-16">
                {correlationMatrix.map(row => (
                  <div key={row.symbol} className="w-12 text-center text-xs font-semibold text-muted-foreground">
                    {row.symbol.slice(0, 4)}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {correlationMatrix.map(row => (
                <div key={row.symbol} className="flex items-center gap-1">
                  <div className="w-16 text-xs font-semibold text-muted-foreground truncate">
                    {row.symbol}
                  </div>
                  {correlationMatrix.map(col => (
                    <CorrelationCell key={col.symbol} value={row.correlations[col.symbol]} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive/50" />
              <span className="text-muted-foreground">-1.0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-muted-foreground">0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success/50" />
              <span className="text-muted-foreground">+1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Risk Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary" size={20} />
            <h3 className="font-semibold">Position Risk Decomposition</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfidenceLevel(95)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                confidenceLevel === 95 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              95% CI
            </button>
            <button
              onClick={() => setConfidenceLevel(99)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                confidenceLevel === 99 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              99% CI
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="rounded-l-lg">Symbol</th>
                <th>Weight</th>
                <th>Beta</th>
                <th>Individual VaR</th>
                <th>Marginal VaR</th>
                <th>Component VaR</th>
                <th className="rounded-r-lg">Risk Contribution</th>
              </tr>
            </thead>
            <tbody>
              {positionRisks.map(risk => (
                <tr key={risk.symbol}>
                  <td className="font-semibold">{risk.symbol}</td>
                  <td>{risk.weight.toFixed(1)}%</td>
                  <td className={cn(
                    "font-mono",
                    risk.beta > 1.1 ? "text-destructive" : risk.beta < 0.9 ? "text-success" : ""
                  )}>
                    {risk.beta.toFixed(2)}
                  </td>
                  <td className="text-destructive font-mono">{formatCurrency(risk.individualVaR)}</td>
                  <td className="text-destructive font-mono">{formatCurrency(risk.marginalVaR)}</td>
                  <td className="text-destructive font-mono">{formatCurrency(risk.componentVaR)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${risk.contribution}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12">{risk.contribution.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Sizing Calculator */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="text-primary" size={20} />
          <h3 className="font-semibold">Position Sizing Calculator</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Account Size</label>
            <input 
              type="text" 
              defaultValue="₹10,00,000"
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Risk Per Trade (%)</label>
            <input 
              type="number" 
              defaultValue="2"
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Stop Loss Distance (%)</label>
            <input 
              type="number" 
              defaultValue="5"
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Recommended Position</label>
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <p className="text-2xl font-bold text-success font-mono">₹40,000</p>
              <p className="text-xs text-muted-foreground">4% of portfolio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
