import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview';
import { Watchlist } from '@/components/dashboard/Watchlist';
import { OptionChain } from '@/components/dashboard/OptionChain';
import { Positions } from '@/components/dashboard/Positions';
import { TradePanel } from '@/components/dashboard/TradePanel';
import { MLSignals } from '@/components/dashboard/MLSignals';
import { BacktestingPanel } from '@/components/dashboard/BacktestingPanel';
import { MLTrainingPanel } from '@/components/dashboard/MLTrainingPanel';
import { TradingViewChart, TradingViewAnalysis } from '@/components/dashboard/TradingViewChart';
import { TradeHistory } from '@/components/dashboard/TradeHistory';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { MarketScanner } from '@/components/dashboard/MarketScanner';
import { ResearchDashboard } from '@/components/dashboard/ResearchDashboard';
import { TradeJournal } from '@/components/dashboard/TradeJournal';
import { OptionsAnalytics } from '@/components/dashboard/OptionsAnalytics';
import { TradingProvider, useTrading } from '@/contexts/TradingContext';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { selectedSymbol, selectedOption, setSelectedOption } = useTrading();

  const handleSelectOption = (type: 'CE' | 'PE', strike: number) => {
    setSelectedOption({ type, strike, expiry: '26-DEC-24' });
  };

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
          {activeTab === 'dashboard' && (
            <>
              <PortfolioOverview />
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <Watchlist />
                  <OptionChain 
                    symbol={selectedSymbol}
                    onSelectOption={handleSelectOption}
                  />
                </div>
                <div className="space-y-6">
                  <TradePanel 
                    symbol={selectedSymbol}
                    type={selectedOption?.type || 'CE'}
                    strike={selectedOption?.strike || 24900}
                  />
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

          {activeTab === 'journal' && <TradeJournal />}

          {activeTab === 'backtest' && <BacktestingPanel />}

          {activeTab === 'ml' && <MLTrainingPanel />}

          {activeTab === 'analytics' && <AnalyticsPanel />}

          {activeTab === 'history' && <TradeHistory />}
        </div>
      </main>
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