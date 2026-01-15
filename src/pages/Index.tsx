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
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
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

          {activeTab === 'positions' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Positions />
              <PortfolioOverview />
            </div>
          )}

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
