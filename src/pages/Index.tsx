import React, { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { Watchlist } from '@/components/dashboard/Watchlist';
import { OptionChain } from '@/components/dashboard/OptionChain';
import { Positions } from '@/components/dashboard/Positions';
import { TradePanel } from '@/components/dashboard/TradePanel';
import { MLSignals } from '@/components/dashboard/MLSignals';
import { BacktestingPanel } from '@/components/dashboard/BacktestingPanel';
import { AdvancedMLPanel } from '@/components/dashboard/AdvancedMLPanel';
import { TradingViewChart, TradingViewAnalysis } from '@/components/dashboard/TradingViewChart';
import { TradeHistory } from '@/components/dashboard/TradeHistory';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { MarketScanner } from '@/components/dashboard/MarketScanner';
import { ResearchDashboard } from '@/components/dashboard/ResearchDashboard';
import { TradeJournal } from '@/components/dashboard/TradeJournal';
import { OptionsAnalytics } from '@/components/dashboard/OptionsAnalytics';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { HotkeyHelp } from '@/components/dashboard/HotkeyHelp';
import { ErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import { RiskAnalytics } from '@/components/dashboard/RiskAnalytics';
import { MonteCarloSimulation } from '@/components/dashboard/MonteCarloSimulation';
import { AdvancedWatchlist } from '@/components/dashboard/AdvancedWatchlist';
import { PortfolioHeatmap } from '@/components/dashboard/PortfolioHeatmap';
import { StrategyBuilder } from '@/components/dashboard/StrategyBuilder';
import { TradingProvider, useTrading } from '@/contexts/TradingContext';
import { useHotkeys, defaultTradingHotkeys } from '@/hooks/useHotkeys';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { selectedSymbol, selectedOption, setSelectedOption, setSelectedSymbol, executeTrade, positions, closePosition } = useTrading();
  const { toggleTheme } = useTheme();
  
  // Command palette & hotkey help state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHotkeyHelp, setShowHotkeyHelp] = useState(false);

  const handleSelectOption = (type: 'CE' | 'PE', strike: number) => {
    setSelectedOption({ type, strike, expiry: '26-DEC-24' });
  };

  // Quick trading actions
  const handleQuickBuy = useCallback(() => {
    const quote = positions.length > 0 ? positions[0] : null;
    if (quote) {
      toast.info('Quick Buy: Select a symbol and strike first', {
        description: 'Use the Options Chain to select your trade',
      });
    }
  }, [positions]);

  const handleQuickSell = useCallback(() => {
    toast.info('Quick Sell: Select a position to close', {
      description: 'Use the Positions panel to manage your trades',
    });
  }, []);

  const handleClosePosition = useCallback(() => {
    if (positions.length > 0) {
      closePosition(positions[0].id);
    } else {
      toast.info('No positions to close');
    }
  }, [positions, closePosition]);

  // Define hotkeys
  const hotkeys = defaultTradingHotkeys({
    onNavigate: setActiveTab,
    onQuickBuy: handleQuickBuy,
    onQuickSell: handleQuickSell,
    onClosePosition: handleClosePosition,
    onToggleTheme: toggleTheme,
    onOpenSearch: () => setShowCommandPalette(true),
    onOpenAlerts: () => setActiveTab('alerts'),
  });

  // Add hotkey help toggle
  const allHotkeys = [
    ...hotkeys,
    { 
      key: '?', 
      shift: true, 
      description: 'Show Hotkeys', 
      action: () => setShowHotkeyHelp(prev => !prev), 
      category: 'general' as const 
    },
  ];

  useHotkeys(allHotkeys);

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-success/3 rounded-full blur-3xl" />
      </div>

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="ml-20">
        <Header />
        
        <div className="p-6 space-y-6">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <>
                <PortfolioOverview />
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <Watchlist />
                  </div>
                  <div className="space-y-6">
                    <MLSignals />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-6">
                <TradingViewChart 
                  symbol={`NSE:${selectedSymbol}`}
                  height={600}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TradingViewAnalysis symbol={`NSE:${selectedSymbol}`} />
                  <Watchlist />
                </div>
              </div>
            )}

            {activeTab === 'scanner' && <MarketScanner />}

            {activeTab === 'research' && <ResearchDashboard />}

            {activeTab === 'watchlist' && <AdvancedWatchlist />}

            {activeTab === 'options' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <OptionChain 
                    symbol={selectedSymbol}
                    onSelectOption={handleSelectOption}
                  />
                </div>
                <div>
                  <TradePanel 
                    symbol={selectedSymbol}
                    type={selectedOption?.type || 'CE'}
                    strike={selectedOption?.strike || 24900}
                  />
                </div>
              </div>
            )}

            {activeTab === 'greeks' && <OptionsAnalytics />}

            {activeTab === 'positions' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Positions />
                <PortfolioOverview />
              </div>
            )}

            {activeTab === 'heatmap' && <PortfolioHeatmap />}

            {activeTab === 'journal' && <TradeJournal />}

            {activeTab === 'analytics' && <AnalyticsPanel />}

            {activeTab === 'risk' && <RiskAnalytics />}

            {activeTab === 'montecarlo' && <MonteCarloSimulation />}

            {activeTab === 'strategy' && <StrategyBuilder />}

            {activeTab === 'backtest' && <BacktestingPanel />}

            {activeTab === 'ml' && <AdvancedMLPanel />}

            {activeTab === 'history' && <TradeHistory />}

            {activeTab === 'alerts' && <AlertsPanel />}

            {activeTab === 'settings' && <SettingsPanel />}
          </ErrorBoundary>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setActiveTab}
        onSelectSymbol={setSelectedSymbol}
      />

      {/* Hotkey Help Modal */}
      <HotkeyHelp
        hotkeys={allHotkeys}
        isOpen={showHotkeyHelp}
        onClose={() => setShowHotkeyHelp(false)}
      />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <TradingProvider>
      <DashboardContent />
    </TradingProvider>
  );
};

export default Index;
