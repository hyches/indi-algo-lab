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
import { StockQuote } from '@/lib/mockData';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [selectedOption, setSelectedOption] = useState<{
    type: 'CE' | 'PE';
    strike: number;
  } | null>(null);

  const handleSelectStock = (stock: StockQuote) => {
    setSelectedStock(stock);
  };

  const handleSelectOption = (type: 'CE' | 'PE', strike: number) => {
    setSelectedOption({ type, strike });
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
                  <Watchlist onSelectStock={handleSelectStock} />
                  <OptionChain 
                    symbol={selectedStock?.symbol || 'NIFTY'}
                    onSelectOption={handleSelectOption}
                  />
                </div>
                <div className="space-y-6">
                  <TradePanel 
                    symbol={selectedStock?.symbol || 'NIFTY'}
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
                symbol={`NSE:${selectedStock?.symbol || 'NIFTY'}`}
                height={600}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TradingViewAnalysis symbol={`NSE:${selectedStock?.symbol || 'NIFTY'}`} />
                <Watchlist onSelectStock={handleSelectStock} />
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <OptionChain 
                  symbol={selectedStock?.symbol || 'NIFTY'}
                  onSelectOption={handleSelectOption}
                />
              </div>
              <div>
                <TradePanel 
                  symbol={selectedStock?.symbol || 'NIFTY'}
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

          {activeTab === 'portfolio' && <PortfolioOverview />}

          {activeTab === 'history' && (
            <div className="flex items-center justify-center h-[60vh] glass-card rounded-2xl">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold">Trade History</h3>
                <p className="text-muted-foreground max-w-md">
                  Complete trade history with analytics coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
