import React, { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Settings, Moon, Sun, Keyboard, Bell, Database, Download, Trash2, RefreshCw, Shield, Monitor, Smartphone } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useTheme } from '@/components/ThemeProvider';
import { formatHotkeyDisplay, defaultTradingHotkeys, Hotkey } from '@/hooks/useHotkeys';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SettingsState {
  appearance: {
    theme: 'light' | 'dark';
    compactMode: boolean;
    animations: boolean;
  };
  trading: {
    defaultOrderType: 'MARKET' | 'LIMIT';
    defaultQty: number;
    confirmOrders: boolean;
    soundEnabled: boolean;
  };
  notifications: {
    priceAlerts: boolean;
    orderExecutions: boolean;
    newsAlerts: boolean;
    mlSignals: boolean;
  };
  data: {
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  appearance: {
    theme: 'dark',
    compactMode: false,
    animations: true,
  },
  trading: {
    defaultOrderType: 'MARKET',
    defaultQty: 50,
    confirmOrders: true,
    soundEnabled: true,
  },
  notifications: {
    priceAlerts: true,
    orderExecutions: true,
    newsAlerts: false,
    mlSignals: true,
  },
  data: {
    autoRefresh: true,
    refreshInterval: 5,
  },
};

const SETTINGS_KEY = 'trading-settings';

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('appearance');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [showHotkeys, setShowHotkeys] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(
    section: K,
    key: keyof SettingsState[K],
    value: SettingsState[K][keyof SettingsState[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const exportData = () => {
    const data = {
      settings,
      alerts: localStorage.getItem('trading-alerts'),
      journal: localStorage.getItem('trade-journal'),
      models: localStorage.getItem('ml-models'),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      setSettings(DEFAULT_SETTINGS);
      toast.success('All data cleared');
      window.location.reload();
    }
  };

  const hotkeys = defaultTradingHotkeys({
    onNavigate: () => {},
  });

  const sections = [
    { id: 'appearance', icon: Monitor, label: 'Appearance' },
    { id: 'trading', icon: RefreshCw, label: 'Trading' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'hotkeys', icon: Keyboard, label: 'Hotkeys' },
    { id: 'data', icon: Database, label: 'Data & Storage' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Settings className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Customize your trading experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <section.icon size={18} />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 glass-card p-6">
          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">Theme</label>
                  <div className="flex gap-3">
                    {(['light', 'dark'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t);
                          updateSetting('appearance', 'theme', t);
                        }}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all",
                          theme === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {t === 'light' && <Sun size={18} />}
                        {t === 'dark' && <Moon size={18} />}
                        <span className="capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-medium">Compact Mode</label>
                    <p className="text-xs text-muted-foreground">Reduce spacing and padding</p>
                  </div>
                  <button
                    onClick={() => updateSetting('appearance', 'compactMode', !settings.appearance.compactMode)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.appearance.compactMode ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      settings.appearance.compactMode ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-medium">Animations</label>
                    <p className="text-xs text-muted-foreground">Enable UI animations</p>
                  </div>
                  <button
                    onClick={() => updateSetting('appearance', 'animations', !settings.appearance.animations)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.appearance.animations ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      settings.appearance.animations ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trading */}
          {activeSection === 'trading' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Trading Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Order Type</label>
                  <div className="flex gap-3">
                    {(['MARKET', 'LIMIT'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => updateSetting('trading', 'defaultOrderType', type)}
                        className={cn(
                          "flex-1 px-4 py-2 rounded-lg border transition-all",
                          settings.trading.defaultOrderType === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Default Quantity</label>
                  <input
                    type="number"
                    value={settings.trading.defaultQty}
                    onChange={(e) => updateSetting('trading', 'defaultQty', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border"
                  />
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-medium">Confirm Orders</label>
                    <p className="text-xs text-muted-foreground">Show confirmation before executing</p>
                  </div>
                  <button
                    onClick={() => updateSetting('trading', 'confirmOrders', !settings.trading.confirmOrders)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.trading.confirmOrders ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      settings.trading.confirmOrders ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-medium">Sound Effects</label>
                    <p className="text-xs text-muted-foreground">Play sounds for trades and alerts</p>
                  </div>
                  <button
                    onClick={() => updateSetting('trading', 'soundEnabled', !settings.trading.soundEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.trading.soundEnabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      settings.trading.soundEnabled ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Notifications</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'priceAlerts', label: 'Price Alerts', desc: 'Get notified when price targets are hit' },
                  { key: 'orderExecutions', label: 'Order Executions', desc: 'Notifications for trade executions' },
                  { key: 'newsAlerts', label: 'News Alerts', desc: 'Breaking news for watchlist stocks' },
                  { key: 'mlSignals', label: 'ML Signals', desc: 'Strong buy/sell signals from ML models' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3">
                    <div>
                      <label className="text-sm font-medium">{item.label}</label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => updateSetting('notifications', item.key as keyof SettingsState['notifications'], !settings.notifications[item.key as keyof SettingsState['notifications']])}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.notifications[item.key as keyof SettingsState['notifications']] ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                        settings.notifications[item.key as keyof SettingsState['notifications']] ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotkeys */}
          {activeSection === 'hotkeys' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
              
              <div className="space-y-6">
                {['navigation', 'trading', 'general'].map(category => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {hotkeys.filter(h => h.category === category).map(hotkey => (
                        <div key={hotkey.key + hotkey.description} className="flex items-center justify-between py-2">
                          <span className="text-sm">{hotkey.description}</span>
                          <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">
                            {formatHotkeyDisplay(hotkey)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data & Storage */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Data & Storage</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <label className="text-sm font-medium">Auto Refresh</label>
                    <p className="text-xs text-muted-foreground">Automatically refresh market data</p>
                  </div>
                  <button
                    onClick={() => updateSetting('data', 'autoRefresh', !settings.data.autoRefresh)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.data.autoRefresh ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      settings.data.autoRefresh ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Refresh Interval (seconds)</label>
                  <select
                    value={settings.data.refreshInterval}
                    onChange={(e) => updateSetting('data', 'refreshInterval', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border"
                  >
                    <option value={1}>1 second</option>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                  </select>
                </div>
                
                <div className="pt-4 border-t border-border space-y-3">
                  <GlassButton variant="primary" onClick={exportData} className="w-full justify-center">
                    <Download size={16} />
                    Export All Data
                  </GlassButton>
                  
                  <GlassButton variant="destructive" onClick={clearAllData} className="w-full justify-center">
                    <Trash2 size={16} />
                    Clear All Data
                  </GlassButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
