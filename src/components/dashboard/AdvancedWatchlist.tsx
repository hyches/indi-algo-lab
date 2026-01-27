import React, { useState, useMemo } from 'react';
import { useTrading } from '@/contexts/TradingContext';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Settings2,
  Trash2,
  Bell,
  Eye,
  ChevronDown,
  Folder,
  FolderPlus,
  Edit2,
  GripVertical
} from 'lucide-react';

interface WatchlistItem {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  weekHigh52: number;
  weekLow52: number;
  avgVolume: number;
  marketCap: number;
  pe: number;
  sector: string;
  isFavorite: boolean;
}

interface WatchlistFolder {
  id: string;
  name: string;
  symbols: string[];
  color: string;
}

const COLUMN_OPTIONS = [
  { id: 'ltp', label: 'LTP', defaultVisible: true },
  { id: 'change', label: 'Change', defaultVisible: true },
  { id: 'changePercent', label: 'Change %', defaultVisible: true },
  { id: 'volume', label: 'Volume', defaultVisible: true },
  { id: 'high', label: 'High', defaultVisible: false },
  { id: 'low', label: 'Low', defaultVisible: false },
  { id: 'open', label: 'Open', defaultVisible: false },
  { id: 'prevClose', label: 'Prev Close', defaultVisible: false },
  { id: 'bid', label: 'Bid', defaultVisible: false },
  { id: 'ask', label: 'Ask', defaultVisible: false },
  { id: 'bidQty', label: 'Bid Qty', defaultVisible: false },
  { id: 'askQty', label: 'Ask Qty', defaultVisible: false },
  { id: 'weekHigh52', label: '52W High', defaultVisible: false },
  { id: 'weekLow52', label: '52W Low', defaultVisible: false },
  { id: 'avgVolume', label: 'Avg Vol', defaultVisible: false },
  { id: 'marketCap', label: 'Mkt Cap', defaultVisible: false },
  { id: 'pe', label: 'P/E', defaultVisible: false },
  { id: 'sector', label: 'Sector', defaultVisible: false },
];

// Generate mock watchlist data
const generateWatchlistData = (): WatchlistItem[] => {
  const symbols = [
    { symbol: 'NIFTY', name: 'Nifty 50 Index', sector: 'Index' },
    { symbol: 'BANKNIFTY', name: 'Bank Nifty Index', sector: 'Index' },
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'INFY', name: 'Infosys', sector: 'IT' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'SBIN', name: 'State Bank', sector: 'Banking' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
    { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
  ];

  return symbols.map((s, idx) => {
    const prevClose = 1000 + Math.random() * 4000;
    const change = (Math.random() - 0.48) * 100;
    const ltp = prevClose + change;
    const high = ltp + Math.random() * 50;
    const low = ltp - Math.random() * 50;
    
    return {
      ...s,
      ltp,
      change,
      changePercent: (change / prevClose) * 100,
      volume: Math.floor(Math.random() * 10000000),
      high,
      low,
      open: prevClose + (Math.random() - 0.5) * 20,
      prevClose,
      bid: ltp - Math.random() * 2,
      ask: ltp + Math.random() * 2,
      bidQty: Math.floor(Math.random() * 10000),
      askQty: Math.floor(Math.random() * 10000),
      weekHigh52: high * (1 + Math.random() * 0.3),
      weekLow52: low * (1 - Math.random() * 0.3),
      avgVolume: Math.floor(Math.random() * 5000000),
      marketCap: Math.floor(Math.random() * 1000000) * 10000000,
      pe: 15 + Math.random() * 30,
      isFavorite: idx < 3,
    };
  });
};

const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

const formatLargeNumber = (value: number): string => {
  if (value >= 10000000000000) return `₹${(value / 10000000000000).toFixed(1)}T`;
  if (value >= 1000000000000) return `₹${(value / 1000000000000).toFixed(1)}T`;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(0)}Cr`;
  return `₹${formatNumber(value)}`;
};

export const AdvancedWatchlist: React.FC = () => {
  const { setSelectedSymbol } = useTrading();
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>(() => generateWatchlistData());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('symbol');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_OPTIONS.filter(c => c.defaultVisible).map(c => c.id)
  );
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [folders, setFolders] = useState<WatchlistFolder[]>([
    { id: 'f1', name: 'Favorites', symbols: ['NIFTY', 'BANKNIFTY', 'RELIANCE'], color: 'hsl(var(--warning))' },
    { id: 'f2', name: 'Banking', symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN'], color: 'hsl(var(--primary))' },
    { id: 'f3', name: 'IT Sector', symbols: ['TCS', 'INFY'], color: 'hsl(var(--success))' },
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['f1']));

  const filteredData = useMemo(() => {
    let data = [...watchlistData];
    
    // Filter by search
    if (searchQuery) {
      data = data.filter(item => 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by folder
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      if (folder) {
        data = data.filter(item => folder.symbols.includes(item.symbol));
      }
    }
    
    // Sort
    data.sort((a, b) => {
      const aVal = a[sortColumn as keyof WatchlistItem];
      const bVal = b[sortColumn as keyof WatchlistItem];
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return data;
  }, [watchlistData, searchQuery, sortColumn, sortDirection, selectedFolder, folders]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleFavorite = (symbol: string) => {
    setWatchlistData(prev => prev.map(item => 
      item.symbol === symbol ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderCellValue = (item: WatchlistItem, columnId: string) => {
    switch (columnId) {
      case 'ltp':
        return <span className="font-semibold font-mono">₹{item.ltp.toFixed(2)}</span>;
      case 'change':
        return (
          <span className={cn("font-mono", item.change >= 0 ? "text-success" : "text-destructive")}>
            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
          </span>
        );
      case 'changePercent':
        return (
          <span className={cn(
            "flex items-center gap-1 font-mono font-semibold",
            item.changePercent >= 0 ? "text-success" : "text-destructive"
          )}>
            {item.changePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(item.changePercent).toFixed(2)}%
          </span>
        );
      case 'volume':
        return <span className="text-muted-foreground font-mono">{formatNumber(item.volume)}</span>;
      case 'high':
        return <span className="font-mono">₹{item.high.toFixed(2)}</span>;
      case 'low':
        return <span className="font-mono">₹{item.low.toFixed(2)}</span>;
      case 'open':
        return <span className="font-mono">₹{item.open.toFixed(2)}</span>;
      case 'prevClose':
        return <span className="font-mono">₹{item.prevClose.toFixed(2)}</span>;
      case 'bid':
        return <span className="font-mono text-success">₹{item.bid.toFixed(2)}</span>;
      case 'ask':
        return <span className="font-mono text-destructive">₹{item.ask.toFixed(2)}</span>;
      case 'bidQty':
        return <span className="text-muted-foreground">{formatNumber(item.bidQty)}</span>;
      case 'askQty':
        return <span className="text-muted-foreground">{formatNumber(item.askQty)}</span>;
      case 'weekHigh52':
        return <span className="font-mono">₹{item.weekHigh52.toFixed(2)}</span>;
      case 'weekLow52':
        return <span className="font-mono">₹{item.weekLow52.toFixed(2)}</span>;
      case 'avgVolume':
        return <span className="text-muted-foreground">{formatNumber(item.avgVolume)}</span>;
      case 'marketCap':
        return <span className="text-muted-foreground">{formatLargeNumber(item.marketCap)}</span>;
      case 'pe':
        return <span className="font-mono">{item.pe.toFixed(1)}</span>;
      case 'sector':
        return <span className="text-xs px-2 py-0.5 rounded bg-accent">{item.sector}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Star className="text-warning" size={20} />
            <h2 className="section-title">Watchlist</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {filteredData.length} symbols
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className={cn(
                "quick-action",
                showColumnSettings && "bg-primary/10 text-primary"
              )}
            >
              <Settings2 size={16} />
            </button>
            <button className="quick-action">
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="premium-input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Column Settings Dropdown */}
      {showColumnSettings && (
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visible Columns</h4>
          <div className="flex flex-wrap gap-2">
            {COLUMN_OPTIONS.map(col => (
              <button
                key={col.id}
                onClick={() => toggleColumn(col.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  visibleColumns.includes(col.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Folders */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              !selectedFolder
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <Folder size={12} style={{ color: folder.color }} />
              {folder.name}
              <span className="text-[10px] opacity-70">({folder.symbols.length})</span>
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <FolderPlus size={12} />
            New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border/50">
              <th className="text-left p-3 w-8"></th>
              <th 
                className="text-left p-3 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-1">
                  Symbol
                  {sortColumn === 'symbol' && (
                    <ChevronDown size={14} className={cn(sortDirection === 'desc' && 'rotate-180')} />
                  )}
                </div>
              </th>
              {visibleColumns.map(colId => {
                const col = COLUMN_OPTIONS.find(c => c.id === colId);
                return (
                  <th 
                    key={colId}
                    className="text-right p-3 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort(colId)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {col?.label}
                      {sortColumn === colId && (
                        <ChevronDown size={14} className={cn(sortDirection === 'desc' && 'rotate-180')} />
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr 
                key={item.symbol}
                onClick={() => setSelectedSymbol(item.symbol)}
                className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td className="p-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.symbol); }}
                    className="text-muted-foreground hover:text-warning transition-colors"
                  >
                    <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} className={item.isFavorite ? 'text-warning' : ''} />
                  </button>
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{item.name}</p>
                  </div>
                </td>
                {visibleColumns.map(colId => (
                  <td key={colId} className="p-3 text-right">
                    {renderCellValue(item, colId)}
                  </td>
                ))}
                <td className="p-3">
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all">
                    <MoreVertical size={14} className="text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Search className="mx-auto text-muted-foreground mb-3" size={32} />
            <p className="text-muted-foreground">No symbols found</p>
          </div>
        </div>
      )}
    </div>
  );
};
