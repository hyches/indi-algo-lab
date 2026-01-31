import React, { useState, useMemo } from 'react';
import { useTrading } from '@/contexts/TradingContext';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Maximize2
} from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface HeatmapData {
  name: string;
  size: number;
  value: number;
  change: number;
  color: string;
  sector: string;
  children?: HeatmapData[];
}

const MOCK_PORTFOLIO_DATA: HeatmapData[] = [];

const getColorByChange = (change: number): string => {
  if (change >= 3) return 'hsl(152, 70%, 35%)';
  if (change >= 2) return 'hsl(152, 70%, 40%)';
  if (change >= 1) return 'hsl(152, 70%, 45%)';
  if (change >= 0) return 'hsl(152, 70%, 55%)';
  if (change >= -1) return 'hsl(0, 72%, 55%)';
  if (change >= -2) return 'hsl(0, 72%, 48%)';
  if (change >= -3) return 'hsl(0, 72%, 42%)';
  return 'hsl(0, 72%, 35%)';
};

const formatCurrency = (value: number): string => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
};

interface CustomTreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  change: number;
  value: number;
  depth: number;
}

const CustomTreemapContent: React.FC<CustomTreemapContentProps> = ({
  x, y, width, height, name, change, value, depth
}) => {
  if (width < 50 || height < 40) return null;
  
  const bgColor = getColorByChange(change);
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        rx={6}
        className="transition-all hover:opacity-90 cursor-pointer"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - (height > 60 ? 8 : 2)}
        textAnchor="middle"
        fill="white"
        fontSize={Math.min(width / 6, 14)}
        fontWeight="600"
        fontFamily="Space Grotesk"
      >
        {name}
      </text>
      {height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="white"
          fontSize={Math.min(width / 8, 11)}
          fontFamily="JetBrains Mono"
          opacity={0.9}
        >
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </text>
      )}
      {height > 70 && width > 80 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 26}
          textAnchor="middle"
          fill="white"
          fontSize={9}
          fontFamily="JetBrains Mono"
          opacity={0.7}
        >
          {formatCurrency(value)}
        </text>
      )}
    </g>
  );
};

type ViewMode = 'flat' | 'sector';
type SizeMode = 'value' | 'equal';

export const PortfolioHeatmap: React.FC = () => {
  const { positions, quotes } = useTrading();
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [sizeMode, setSizeMode] = useState<SizeMode>('value');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  
  // Generate real data from positions
  const portfolioData = useMemo(() => {
    const sectors: { [key: string]: HeatmapData[] } = {};
    
    positions.forEach(position => {
      const value = Math.abs(position.qty * position.ltp);
      const change = position.pnlPercent || 0;
      
      const sector = 'Holdings';
      if (!sectors[sector]) {
        sectors[sector] = [];
      }
      
      sectors[sector].push({
        name: position.symbol,
        size: value,
        value: value,
        change: change,
        color: getColorByChange(change),
        sector: sector
      });
    });

    return Object.entries(sectors).map(([sectorName, items]) => ({
      name: sectorName,
      size: 0,
      value: 0,
      change: 0,
      color: '',
      sector: sectorName,
      children: items
    }));
  }, [positions]);
  
  const flatData = useMemo(() => {
    const allItems: HeatmapData[] = [];
    portfolioData.forEach(sector => {
      sector.children?.forEach(item => {
        allItems.push({
          ...item,
          size: sizeMode === 'equal' ? 100 : item.value,
        });
      });
    });
    return allItems
      .filter(item => !selectedSector || item.sector === selectedSector)
      .sort((a, b) => b.value - a.value);
  }, [selectedSector, sizeMode, portfolioData]);

  const sectorData = useMemo(() => {
    return portfolioData.map(sector => ({
      ...sector,
      size: sector.children?.reduce((sum, child) => sum + (sizeMode === 'equal' ? 100 : child.value), 0) || 0,
      change: (sector.children?.reduce((sum, child) => sum + child.change, 0) || 0) / (sector.children?.length || 1),
    })).filter(sector => !selectedSector || sector.name === selectedSector);
  }, [selectedSector, sizeMode, portfolioData]);

  const sectors = [...new Set(portfolioData.map(s => s.name))];

  const totalValue = flatData.reduce((sum, item) => sum + item.value, 0);
  const totalChange = totalValue > 0 ? flatData.reduce((sum, item) => sum + item.change * item.value, 0) / totalValue : 0;
  const gainers = flatData.filter(item => item.change > 0).length;
  const losers = flatData.filter(item => item.change < 0).length;

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <LayoutGrid className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="section-title">Portfolio Heatmap</h2>
            <p className="text-sm text-muted-foreground">Visual breakdown of your holdings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('flat')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'flat' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Stocks
            </button>
            <button
              onClick={() => setViewMode('sector')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'sector' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Sectors
            </button>
          </div>
          <button className="quick-action">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 rounded-xl bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-lg font-bold font-mono">{formatCurrency(totalValue)}</p>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          totalChange >= 0 ? "bg-success/10" : "bg-destructive/10"
        )}>
          <p className="text-xs text-muted-foreground">Day Change</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            totalChange >= 0 ? "text-success" : "text-destructive"
          )}>
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
          </p>
        </div>
        <div className="p-3 rounded-xl bg-success/10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp size={12} /> Gainers
          </p>
          <p className="text-lg font-bold text-success">{gainers}</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown size={12} /> Losers
          </p>
          <p className="text-lg font-bold text-destructive">{losers}</p>
        </div>
      </div>

      {/* Sector Filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Filter size={14} className="text-muted-foreground flex-shrink-0" />
        <button
          onClick={() => setSelectedSector(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
            !selectedSector
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
        >
          All Sectors
        </button>
        {sectors.map(sector => (
          <button
            key={sector}
            onClick={() => setSelectedSector(sector === selectedSector ? null : sector)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              selectedSector === sector
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <div className="h-80 rounded-xl overflow-hidden border border-border/30">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={viewMode === 'flat' ? flatData : sectorData}
            dataKey="size"
            aspectRatio={4/3}
            stroke="hsl(var(--background))"
            content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" change={0} value={0} depth={0} />}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const data = payload[0].payload as HeatmapData;
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-sm text-muted-foreground">{data.sector}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="font-mono font-semibold">{formatCurrency(data.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Change</p>
                        <p className={cn(
                          "font-mono font-semibold",
                          data.change >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 72%, 35%)' }} />
            <span className="text-muted-foreground">-3%+</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 72%, 48%)' }} />
            <span className="text-muted-foreground">-2%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0, 72%, 55%)' }} />
            <span className="text-muted-foreground">-1%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-muted-foreground">0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(152, 70%, 55%)' }} />
            <span className="text-muted-foreground">+1%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(152, 70%, 45%)' }} />
            <span className="text-muted-foreground">+2%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(152, 70%, 35%)' }} />
            <span className="text-muted-foreground">+3%+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
