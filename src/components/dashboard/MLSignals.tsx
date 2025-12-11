import React from 'react';
import { TiltCard } from '@/components/ui/TiltCard';
import { mlSignals, MLSignal } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Brain, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface SignalCardProps {
  signal: MLSignal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const signalConfig = {
    BULLISH: {
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    },
    BEARISH: {
      icon: TrendingDown,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
    },
    NEUTRAL: {
      icon: Minus,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      border: 'border-border',
      glow: '',
    },
  };

  const config = signalConfig[signal.signal];
  const SignalIcon = config.icon;

  return (
    <TiltCard className={cn('p-4 border', config.border)} intensity={5}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{signal.symbol}</span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1',
              config.bg, config.color
            )}>
              <SignalIcon size={12} />
              {signal.signal}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Predicted Move: <span className={config.color}>
              {signal.predictedMove >= 0 ? '+' : ''}{signal.predictedMove}%
            </span>
          </p>
        </div>

        <div className="text-right">
          <div className={cn(
            'text-2xl font-bold font-mono',
            signal.confidence >= 0.7 ? config.color : 'text-muted-foreground'
          )}>
            {(signal.confidence * 100).toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">Confidence</p>
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
        <p className="text-xs text-muted-foreground mb-2">Feature Weights</p>
        {signal.features.map(feature => (
          <div key={feature.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{feature.name}</span>
              <span className="font-mono">{feature.value.toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  feature.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                )}
                style={{ width: `${Math.abs(feature.weight) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last Updated</span>
        <span>{signal.timestamp.toLocaleTimeString()}</span>
      </div>
    </TiltCard>
  );
};

export const MLSignals: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ML Signals</h2>
            <p className="text-sm text-muted-foreground">AI-powered predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Zap size={14} className="text-primary" />
          <span className="text-xs text-primary font-medium">Live Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mlSignals.map(signal => (
          <SignalCard key={signal.symbol} signal={signal} />
        ))}
      </div>

      <TiltCard className="p-4" intensity={3}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Brain size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">ML Model Training</p>
            <p className="text-xs text-muted-foreground">
              All trades are recorded and fed into the ML pipeline for continuous learning
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Recording</span>
          </div>
        </div>
      </TiltCard>
    </div>
  );
};
