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
  Wallet
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: LineChart, label: 'Charts', id: 'charts' },
  { icon: Layers, label: 'Options', id: 'options' },
  { icon: TrendingUp, label: 'Positions', id: 'positions' },
  { icon: History, label: 'History', id: 'history' },
  { icon: Brain, label: 'ML Signals', id: 'ml' },
  { icon: Wallet, label: 'Portfolio', id: 'portfolio' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 glass border-r border-border/50 flex flex-col items-center py-6 z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/30">
          <TrendingUp className="text-primary-foreground" size={24} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <item.icon size={22} />
            
            {/* Tooltip */}
            <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-card text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border/50">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <button className="w-12 h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
        <Settings size={22} />
      </button>
    </aside>
  );
};
