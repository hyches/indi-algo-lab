import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, LineChart, Layers, Brain, Settings, Bell, BookOpen, BarChart3, Activity, Globe, History, FlaskConical, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: 'navigation' | 'symbols' | 'actions';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectSymbol: (symbol: string) => void;
}

const SYMBOLS = [
  'NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 
  'SBIN', 'TATAMOTORS', 'ITC', 'WIPRO', 'BHARTIARTL', 'HINDUNILVR', 'MARUTI',
  'AXISBANK', 'KOTAKBANK', 'LT', 'ASIANPAINT', 'SUNPHARMA', 'TITAN'
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'navigation', action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'charts', label: 'Charts', icon: LineChart, category: 'navigation', action: () => { onNavigate('charts'); onClose(); } },
    { id: 'scanner', label: 'Market Scanner', icon: Search, category: 'navigation', action: () => { onNavigate('scanner'); onClose(); } },
    { id: 'research', label: 'Research Dashboard', icon: Globe, category: 'navigation', action: () => { onNavigate('research'); onClose(); } },
    { id: 'options', label: 'Options Chain', icon: Layers, category: 'navigation', action: () => { onNavigate('options'); onClose(); } },
    { id: 'greeks', label: 'Options Analytics', icon: Activity, category: 'navigation', action: () => { onNavigate('greeks'); onClose(); } },
    { id: 'positions', label: 'Positions', icon: TrendingUp, category: 'navigation', action: () => { onNavigate('positions'); onClose(); } },
    { id: 'history', label: 'Trade History', icon: History, category: 'navigation', action: () => { onNavigate('history'); onClose(); } },
    { id: 'journal', label: 'Trade Journal', icon: BookOpen, category: 'navigation', action: () => { onNavigate('journal'); onClose(); } },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'navigation', action: () => { onNavigate('analytics'); onClose(); } },
    { id: 'backtest', label: 'Backtesting', icon: FlaskConical, category: 'navigation', action: () => { onNavigate('backtest'); onClose(); } },
    { id: 'ml', label: 'ML Signals', icon: Brain, category: 'navigation', action: () => { onNavigate('ml'); onClose(); } },
    { id: 'alerts', label: 'Alerts', icon: Bell, category: 'navigation', action: () => { onNavigate('alerts'); onClose(); } },
    { id: 'settings', label: 'Settings', icon: Settings, category: 'navigation', action: () => { onNavigate('settings'); onClose(); } },
    
    // Symbols
    ...SYMBOLS.map(symbol => ({
      id: `symbol-${symbol}`,
      label: symbol,
      icon: TrendingUp,
      category: 'symbols' as const,
      action: () => { onSelectSymbol(symbol); onClose(); },
      keywords: [symbol.toLowerCase()],
    })),
  ], [onNavigate, onSelectSymbol, onClose]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands.slice(0, 10);
    
    const lowerQuery = query.toLowerCase();
    return commands
      .filter(cmd => 
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some(k => k.includes(lowerQuery))
      )
      .slice(0, 10);
  }, [commands, query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    symbols: filteredCommands.filter(c => c.category === 'symbols'),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative glass-card w-full max-w-xl overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, symbols..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No results found
            </div>
          ) : (
            <>
              {groupedCommands.navigation.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Navigation</div>
                  {groupedCommands.navigation.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                          globalIdx === selectedIndex
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <cmd.icon size={16} />
                        <span>{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {groupedCommands.symbols.length > 0 && (
                <div className="mt-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Symbols</div>
                  <div className="grid grid-cols-4 gap-1">
                    {groupedCommands.symbols.map((cmd, idx) => {
                      const globalIdx = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={cn(
                            "flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors",
                            globalIdx === selectedIndex
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          )}
                        >
                          <span className="font-mono">{cmd.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
