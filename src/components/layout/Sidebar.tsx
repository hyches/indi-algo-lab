import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  LineChart, 
  Layers, 
  History, 
  Brain, 
  Settings,
  TrendingUp,
  Wallet,
  FlaskConical
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  category?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', category: 'main' },
  { icon: LineChart, label: 'Charts', id: 'charts', category: 'main' },
  { icon: Layers, label: 'Options', id: 'options', category: 'trading' },
  { icon: TrendingUp, label: 'Positions', id: 'positions', category: 'trading' },
  { icon: History, label: 'History', id: 'history', category: 'trading' },
  { icon: FlaskConical, label: 'Backtest', id: 'backtest', category: 'tools' },
  { icon: Brain, label: 'ML Signals', id: 'ml', category: 'tools' },
  { icon: Wallet, label: 'Portfolio', id: 'portfolio', category: 'main' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const mainItems = navItems.filter(i => i.category === 'main');
  const tradingItems = navItems.filter(i => i.category === 'trading');
  const toolsItems = navItems.filter(i => i.category === 'tools');

  const renderNavItem = (item: NavItem) => (
    <button
      key={item.id}
      onClick={() => onTabChange(item.id)}
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative',
        activeTab === item.id
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <item.icon size={20} />
      
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-popover text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border shadow-lg">
        {item.label}
      </span>
    </button>
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-card border-r border-border flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
          <TrendingUp className="text-primary-foreground" size={22} />
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-3">
        {/* Main */}
        <div className="flex flex-col items-center gap-1 w-full">
          {mainItems.map(renderNavItem)}
        </div>
        
        <div className="w-8 h-px bg-border my-2" />
        
        {/* Trading */}
        <div className="flex flex-col items-center gap-1 w-full">
          {tradingItems.map(renderNavItem)}
        </div>
        
        <div className="w-8 h-px bg-border my-2" />
        
        {/* Tools */}
        <div className="flex flex-col items-center gap-1 w-full">
          {toolsItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Settings */}
      <button className="w-12 h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all group relative">
        <Settings size={20} />
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-popover text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border shadow-lg">
          Settings
        </span>
      </button>
    </aside>
  );
};
