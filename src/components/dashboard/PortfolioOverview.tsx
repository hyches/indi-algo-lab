import React from 'react';
import { TiltCard } from '@/components/ui/TiltCard';
import { portfolioSummary } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Wallet, Target, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon, trend }) => (
  <TiltCard className="p-5" intensity={6}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn(
          'text-2xl font-semibold font-mono',
          trend === 'up' && 'text-emerald-400',
          trend === 'down' && 'text-rose-400',
          trend === 'neutral' && 'text-foreground'
        )}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
      <div className={cn(
        'p-2.5 rounded-xl',
        trend === 'up' && 'bg-emerald-500/10 text-emerald-400',
        trend === 'down' && 'bg-rose-500/10 text-rose-400',
        trend === 'neutral' && 'bg-primary/10 text-primary'
      )}>
        {icon}
      </div>
    </div>
  </TiltCard>
);

export const PortfolioOverview: React.FC = () => {
  const pnlPercent = (portfolioSummary.totalPnL / portfolioSummary.totalCapital) * 100;
  const todayPercent = (portfolioSummary.todayPnL / portfolioSummary.totalCapital) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Portfolio Overview</h2>
          <p className="text-sm text-muted-foreground">Paper Trading Account</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-live" />
          <span className="text-xs text-emerald-400 font-medium">Market Open</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total P&L"
          value={formatCurrency(portfolioSummary.totalPnL)}
          subValue={formatPercent(pnlPercent)}
          icon={portfolioSummary.totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          trend={portfolioSummary.totalPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Today's P&L"
          value={formatCurrency(portfolioSummary.todayPnL)}
          subValue={formatPercent(todayPercent)}
          icon={portfolioSummary.todayPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          trend={portfolioSummary.todayPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Available Margin"
          value={formatCurrency(portfolioSummary.availableMargin)}
          subValue={`Used: ${formatCurrency(portfolioSummary.usedMargin)}`}
          icon={<Wallet size={20} />}
          trend="neutral"
        />
        <StatCard
          title="Win Rate"
          value={`${(portfolioSummary.winRate * 100).toFixed(1)}%`}
          subValue={`${portfolioSummary.totalTrades} total trades`}
          icon={<Target size={20} />}
          trend="neutral"
        />
        <StatCard
          title="Realized P&L"
          value={formatCurrency(portfolioSummary.realizedPnL)}
          icon={<Activity size={20} />}
          trend={portfolioSummary.realizedPnL >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Avg. Return"
          value={`${portfolioSummary.avgReturn}%`}
          subValue="Per trade"
          icon={<Zap size={20} />}
          trend={portfolioSummary.avgReturn >= 0 ? 'up' : 'down'}
        />
      </div>
    </div>
  );
};
