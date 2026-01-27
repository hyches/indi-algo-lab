import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Shuffle, 
  Play, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  RefreshCw,
  Settings2,
  Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

interface SimulationParams {
  initialCapital: number;
  numSimulations: number;
  tradingDays: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  tradesPerDay: number;
}

interface SimulationResult {
  paths: number[][];
  finalValues: number[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    percentile5: number;
    percentile25: number;
    percentile75: number;
    percentile95: number;
    maxDrawdown: number;
    probabilityOfProfit: number;
    probabilityOfRuin: number;
    expectedCAGR: number;
    riskOfRuin: number;
  };
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const runMonteCarloSimulation = (params: SimulationParams): SimulationResult => {
  const { initialCapital, numSimulations, tradingDays, winRate, avgWin, avgLoss, tradesPerDay } = params;
  const paths: number[][] = [];
  const finalValues: number[] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [initialCapital];
    let capital = initialCapital;
    
    for (let day = 0; day < tradingDays; day++) {
      for (let trade = 0; trade < tradesPerDay; trade++) {
        const isWin = Math.random() < winRate;
        const pnl = isWin 
          ? capital * (avgWin / 100) * (0.8 + Math.random() * 0.4)
          : capital * (avgLoss / 100) * (0.8 + Math.random() * 0.4);
        capital += pnl;
        capital = Math.max(0, capital);
      }
      path.push(capital);
    }
    
    paths.push(path);
    finalValues.push(capital);
  }
  
  // Calculate statistics
  const sortedFinals = [...finalValues].sort((a, b) => a - b);
  const mean = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
  
  const squaredDiffs = finalValues.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / finalValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate max drawdown across all paths
  let maxDrawdown = 0;
  paths.forEach(path => {
    let peak = path[0];
    path.forEach(value => {
      peak = Math.max(peak, value);
      const dd = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, dd);
    });
  });
  
  const probabilityOfProfit = finalValues.filter(v => v > initialCapital).length / finalValues.length;
  const probabilityOfRuin = finalValues.filter(v => v < initialCapital * 0.5).length / finalValues.length;
  
  const years = tradingDays / 252;
  const expectedCAGR = (Math.pow(mean / initialCapital, 1 / years) - 1) * 100;
  
  return {
    paths,
    finalValues,
    statistics: {
      mean,
      median: sortedFinals[Math.floor(sortedFinals.length / 2)],
      stdDev,
      percentile5: sortedFinals[Math.floor(sortedFinals.length * 0.05)],
      percentile25: sortedFinals[Math.floor(sortedFinals.length * 0.25)],
      percentile75: sortedFinals[Math.floor(sortedFinals.length * 0.75)],
      percentile95: sortedFinals[Math.floor(sortedFinals.length * 0.95)],
      maxDrawdown: maxDrawdown * 100,
      probabilityOfProfit,
      probabilityOfRuin,
      expectedCAGR,
      riskOfRuin: probabilityOfRuin,
    },
  };
};

export const MonteCarloSimulation: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    initialCapital: 1000000,
    numSimulations: 500,
    tradingDays: 252,
    winRate: 0.55,
    avgWin: 2,
    avgLoss: -1.5,
    tradesPerDay: 3,
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  const runSimulation = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = runMonteCarloSimulation(params);
      setResult(simResult);
      setIsRunning(false);
    }, 100);
  }, [params]);
  
  // Prepare chart data
  const pathsData = useMemo(() => {
    if (!result) return [];
    
    const samplePaths = result.paths.slice(0, 50);
    const days = samplePaths[0].length;
    
    return Array.from({ length: days }, (_, dayIndex) => {
      const values = samplePaths.map(path => path[dayIndex]);
      values.sort((a, b) => a - b);
      
      return {
        day: dayIndex,
        p5: values[Math.floor(values.length * 0.05)],
        p25: values[Math.floor(values.length * 0.25)],
        median: values[Math.floor(values.length * 0.5)],
        p75: values[Math.floor(values.length * 0.75)],
        p95: values[Math.floor(values.length * 0.95)],
      };
    });
  }, [result]);
  
  const distributionData = useMemo(() => {
    if (!result) return [];
    
    const min = Math.min(...result.finalValues);
    const max = Math.max(...result.finalValues);
    const range = max - min;
    const bucketCount = 30;
    const bucketSize = range / bucketCount;
    
    const buckets: { range: string; count: number; value: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const bucketMin = min + i * bucketSize;
      const bucketMax = min + (i + 1) * bucketSize;
      const count = result.finalValues.filter(v => v >= bucketMin && v < bucketMax).length;
      buckets.push({
        range: formatCurrency(bucketMin),
        count,
        value: (bucketMin + bucketMax) / 2,
      });
    }
    
    return buckets;
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Shuffle className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Monte Carlo Simulation</h1>
            <p className="text-sm text-muted-foreground">Statistical analysis of trading outcomes</p>
          </div>
        </div>
        <button 
          onClick={runSimulation}
          disabled={isRunning}
          className={cn(
            "px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all",
            isRunning 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          )}
        >
          {isRunning ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Simulation
            </>
          )}
        </button>
      </div>

      {/* Parameters */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="text-primary" size={20} />
          <h3 className="font-semibold">Simulation Parameters</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Initial Capital</label>
            <input
              type="number"
              value={params.initialCapital}
              onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Simulations</label>
            <input
              type="number"
              value={params.numSimulations}
              onChange={(e) => setParams({ ...params, numSimulations: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Trading Days</label>
            <input
              type="number"
              value={params.tradingDays}
              onChange={(e) => setParams({ ...params, tradingDays: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Win Rate (%)</label>
            <input
              type="number"
              value={params.winRate * 100}
              onChange={(e) => setParams({ ...params, winRate: Number(e.target.value) / 100 })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Avg Win (%)</label>
            <input
              type="number"
              value={params.avgWin}
              onChange={(e) => setParams({ ...params, avgWin: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Avg Loss (%)</label>
            <input
              type="number"
              value={params.avgLoss}
              onChange={(e) => setParams({ ...params, avgLoss: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Trades/Day</label>
            <input
              type="number"
              value={params.tradesPerDay}
              onChange={(e) => setParams({ ...params, tradesPerDay: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>
        </div>
      </div>

      {result && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="stat-card-primary">
              <p className="metric-label">Expected Value</p>
              <p className="metric-value">{formatCurrency(result.statistics.mean)}</p>
            </div>
            <div className="stat-card">
              <p className="metric-label">Median</p>
              <p className="metric-value">{formatCurrency(result.statistics.median)}</p>
            </div>
            <div className={result.statistics.probabilityOfProfit >= 0.6 ? "stat-card-success" : "stat-card"}>
              <p className="metric-label">P(Profit)</p>
              <p className="metric-value">{(result.statistics.probabilityOfProfit * 100).toFixed(1)}%</p>
            </div>
            <div className={result.statistics.probabilityOfRuin < 0.05 ? "stat-card-success" : "stat-card-destructive"}>
              <p className="metric-label">P(Ruin)</p>
              <p className="metric-value">{(result.statistics.probabilityOfRuin * 100).toFixed(1)}%</p>
            </div>
            <div className="stat-card-destructive">
              <p className="metric-label">Max Drawdown</p>
              <p className="metric-value">{result.statistics.maxDrawdown.toFixed(1)}%</p>
            </div>
            <div className={result.statistics.expectedCAGR >= 15 ? "stat-card-success" : "stat-card"}>
              <p className="metric-label">Expected CAGR</p>
              <p className="metric-value">{result.statistics.expectedCAGR.toFixed(1)}%</p>
            </div>
          </div>

          {/* Percentile Ranges */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Outcome Distribution</h3>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-muted-foreground mb-1">5th Percentile</p>
                <p className="text-lg font-bold text-destructive font-mono">{formatCurrency(result.statistics.percentile5)}</p>
                <p className="text-xs text-muted-foreground">Worst 5%</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-xs text-muted-foreground mb-1">25th Percentile</p>
                <p className="text-lg font-bold text-warning font-mono">{formatCurrency(result.statistics.percentile25)}</p>
                <p className="text-xs text-muted-foreground">Below Average</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Median</p>
                <p className="text-lg font-bold text-primary font-mono">{formatCurrency(result.statistics.median)}</p>
                <p className="text-xs text-muted-foreground">50th Percentile</p>
              </div>
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">75th Percentile</p>
                <p className="text-lg font-bold text-success font-mono">{formatCurrency(result.statistics.percentile75)}</p>
                <p className="text-xs text-muted-foreground">Above Average</p>
              </div>
              <div className="p-4 rounded-xl bg-success/20 border border-success/30">
                <p className="text-xs text-muted-foreground mb-1">95th Percentile</p>
                <p className="text-lg font-bold text-success font-mono">{formatCurrency(result.statistics.percentile95)}</p>
                <p className="text-xs text-muted-foreground">Best 5%</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equity Curves with Confidence Bands */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-primary" size={20} />
                <h3 className="font-semibold">Equity Curves (Confidence Bands)</h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pathsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p95" 
                      stroke="transparent"
                      fill="hsl(var(--success))"
                      fillOpacity={0.1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p75" 
                      stroke="transparent"
                      fill="hsl(var(--success))"
                      fillOpacity={0.15}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p25" 
                      stroke="transparent"
                      fill="hsl(var(--background))"
                      fillOpacity={1}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="p5" 
                      stroke="transparent"
                      fill="hsl(var(--background))"
                      fillOpacity={1}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="median" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceLine 
                      y={params.initialCapital} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 rounded bg-success/10 border border-success/30" />
                  <span className="text-muted-foreground">5-95% Range</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-primary rounded" />
                  <span className="text-muted-foreground">Median Path</span>
                </div>
              </div>
            </div>

            {/* Final Value Distribution */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-primary" size={20} />
                <h3 className="font-semibold">Final Value Distribution</h3>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [value, 'Count']}
                      labelFormatter={(label) => `Value: ${label}`}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value >= params.initialCapital 
                            ? 'hsl(var(--success))' 
                            : 'hsl(var(--destructive))'
                          }
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                    <ReferenceLine 
                      x={formatCurrency(params.initialCapital)} 
                      stroke="hsl(var(--foreground))" 
                      strokeDasharray="5 5" 
                      label={{ 
                        value: 'Initial', 
                        position: 'top',
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 10
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-warning" size={20} />
              <h3 className="font-semibold">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <h4 className="font-medium mb-2">Edge Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  With a {(params.winRate * 100).toFixed(0)}% win rate and {params.avgWin}:1 R:R ratio, 
                  your expected value per trade is{' '}
                  <span className={cn(
                    "font-semibold",
                    (params.winRate * params.avgWin + (1 - params.winRate) * params.avgLoss) > 0 
                      ? "text-success" : "text-destructive"
                  )}>
                    {((params.winRate * params.avgWin + (1 - params.winRate) * params.avgLoss)).toFixed(2)}%
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <h4 className="font-medium mb-2">Risk Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  There's a{' '}
                  <span className={cn(
                    "font-semibold",
                    result.statistics.probabilityOfRuin < 0.05 ? "text-success" : "text-destructive"
                  )}>
                    {(result.statistics.probabilityOfRuin * 100).toFixed(1)}%
                  </span>
                  {' '}chance of losing 50%+ of capital. 
                  Max drawdown observed was {result.statistics.maxDrawdown.toFixed(1)}%.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <h4 className="font-medium mb-2">Growth Potential</h4>
                <p className="text-sm text-muted-foreground">
                  Expected annual return is{' '}
                  <span className={cn(
                    "font-semibold",
                    result.statistics.expectedCAGR > 0 ? "text-success" : "text-destructive"
                  )}>
                    {result.statistics.expectedCAGR.toFixed(1)}%
                  </span>
                  {' '}CAGR. In the best 5% of scenarios, you could reach {formatCurrency(result.statistics.percentile95)}.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!result && (
        <div className="glass-card p-12 text-center">
          <Shuffle className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">Ready to Simulate</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configure your trading parameters above and click "Run Simulation" to generate 
            {params.numSimulations.toLocaleString()} potential trading outcomes.
          </p>
        </div>
      )}
    </div>
  );
};
