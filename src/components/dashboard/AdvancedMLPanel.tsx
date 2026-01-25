// Professional ML Dashboard - World-Class Trading Predictions
import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Brain, Play, RefreshCw, Trash2, TrendingUp, TrendingDown, Minus,
  Activity, Zap, Target, Shield, BarChart3, Layers, Award, Clock,
  ChevronRight, AlertTriangle, CheckCircle2, Cpu, Database,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTrading } from '@/contexts/TradingContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassButton } from '@/components/ui/GlassButton';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from 'recharts';
import { 
  modelManager, 
  TrainingProgress,
  ModelSummary,
} from '@/lib/ml/models/modelManager';
import { 
  ModelType, 
  SignalType,
  PredictionSignal,
  MarketRegime,
  TechnicalPattern,
  CandlestickPattern,
} from '@/lib/ml/models/modelTypes';
import {
  detectMarketRegime,
  detectChartPatterns,
  detectCandlestickPatterns,
  ADVANCED_FEATURE_NAMES,
} from '@/lib/ml/models/advancedFeatures';
import { generateMockHistoricalData } from '@/lib/backtesting/engine';

const MODEL_TYPES: { type: ModelType; icon: React.ReactNode; color: string }[] = [
  { type: 'dense_nn', icon: <Layers size={16} />, color: 'text-blue-400' },
  { type: 'lstm', icon: <Activity size={16} />, color: 'text-purple-400' },
  { type: 'gru', icon: <Zap size={16} />, color: 'text-amber-400' },
  { type: 'transformer', icon: <Brain size={16} />, color: 'text-emerald-400' },
  { type: 'cnn_1d', icon: <BarChart3 size={16} />, color: 'text-rose-400' },
];

const SIGNAL_COLORS: Record<SignalType, string> = {
  'STRONG_BUY': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  'BUY': 'text-green-400 bg-green-500/20 border-green-500/30',
  'HOLD': 'text-muted-foreground bg-muted/50 border-border',
  'SELL': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  'STRONG_SELL': 'text-rose-400 bg-rose-500/20 border-rose-500/30',
};

export const AdvancedMLPanel: React.FC = () => {
  const { selectedSymbol } = useTrading();
  const [activeTab, setActiveTab] = useState('signals');
  const [isInitialized, setIsInitialized] = useState(false);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModelType, setSelectedModelType] = useState<ModelType>('dense_nn');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<{ epoch: number; loss: number; accuracy: number }[]>([]);
  const [prediction, setPrediction] = useState<PredictionSignal | null>(null);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [chartPatterns, setChartPatterns] = useState<TechnicalPattern[]>([]);
  const [candlePatterns, setCandlePatterns] = useState<CandlestickPattern[]>([]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await modelManager.initialize();
      setModels(modelManager.getModelSummaries());
      setIsInitialized(true);
    };
    init();
  }, []);

  // Analyze market
  useEffect(() => {
    const analyze = () => {
      const data = generateMockHistoricalData(selectedSymbol, 100);
      setMarketRegime(detectMarketRegime(data));
      setChartPatterns(detectChartPatterns(data));
      setCandlePatterns(detectCandlestickPatterns(data));
    };
    analyze();
    const interval = setInterval(analyze, 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Auto-predict
  useEffect(() => {
    if (!modelManager.hasTrainedModels()) return;
    
    const predict = async () => {
      try {
        const data = generateMockHistoricalData(selectedSymbol, 250);
        const result = await modelManager.predict(data);
        setPrediction(result);
      } catch (e) {
        console.log('Prediction error:', e);
      }
    };
    
    predict();
    const interval = setInterval(predict, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, models]);

  const handleTrain = useCallback(async () => {
    setIsTraining(true);
    setTrainingHistory([]);
    
    try {
      const data = generateMockHistoricalData(selectedSymbol, 500);
      await modelManager.trainModel(selectedModelType, data, {
        epochs: 50,
        onProgress: (progress) => {
          setTrainingProgress(progress);
          setTrainingHistory(prev => [...prev, {
            epoch: progress.epoch,
            loss: progress.loss,
            accuracy: progress.accuracy,
          }]);
        },
      });
      setModels(modelManager.getModelSummaries());
    } catch (e) {
      console.error('Training error:', e);
    } finally {
      setIsTraining(false);
    }
  }, [selectedModelType, selectedSymbol]);

  const handleDeleteModel = async (modelId: string) => {
    await modelManager.deleteModel(modelId);
    setModels(modelManager.getModelSummaries());
  };

  const ensembleWeights = modelManager.getEnsembleWeights();
  const pieData = ensembleWeights.slice(0, 5).map((w, i) => ({
    name: w.modelId.split('_')[0],
    value: w.weight * 100,
  }));
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
            <Brain className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">ML Intelligence Engine</h2>
            <p className="text-sm text-muted-foreground">
              {models.length} models • {ADVANCED_FEATURE_NAMES.length} features • {selectedSymbol}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {modelManager.hasTrainedModels() && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live Predictions</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Database size={14} /> Models
          </div>
          <p className="text-2xl font-bold font-mono">{models.length}</p>
        </div>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Cpu size={14} /> Features
          </div>
          <p className="text-2xl font-bold font-mono">{ADVANCED_FEATURE_NAMES.length}</p>
        </div>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Award size={14} /> Best Accuracy
          </div>
          <p className="text-2xl font-bold font-mono">
            {models[0]?.performance?.accuracy ? `${(models[0].performance.accuracy * 100).toFixed(1)}%` : '--'}
          </p>
        </div>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Target size={14} /> Win Rate
          </div>
          <p className="text-2xl font-bold font-mono">
            {models[0]?.performance?.winRate ? `${(models[0].performance.winRate * 100).toFixed(1)}%` : '--'}
          </p>
        </div>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Activity size={14} /> Regime
          </div>
          <p className={cn('text-lg font-bold truncate', 
            marketRegime?.type.includes('up') && 'text-emerald-400',
            marketRegime?.type.includes('down') && 'text-rose-400'
          )}>
            {marketRegime?.type.replace('_', ' ').toUpperCase() || '--'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="signals" className="gap-2"><Zap size={14} />Signals</TabsTrigger>
          <TabsTrigger value="models" className="gap-2"><Layers size={14} />Models</TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2"><BarChart3 size={14} />Patterns</TabsTrigger>
          <TabsTrigger value="train" className="gap-2"><Brain size={14} />Train</TabsTrigger>
        </TabsList>

        {/* Signals Tab */}
        <TabsContent value="signals" className="mt-6">
          {prediction ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Signal */}
              <div className="glass-card p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Zap size={16} className="text-primary" /> Ensemble Signal
                </h3>
                <div className="text-center py-4">
                  <div className={cn(
                    'inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2',
                    SIGNAL_COLORS[prediction.signal]
                  )}>
                    {prediction.signal.includes('BUY') && <TrendingUp size={32} />}
                    {prediction.signal.includes('SELL') && <TrendingDown size={32} />}
                    {prediction.signal === 'HOLD' && <Minus size={32} />}
                    <div className="text-left">
                      <p className="text-3xl font-bold">{prediction.signal}</p>
                      <p className="text-sm opacity-70">{(prediction.confidence * 100).toFixed(1)}% confidence</p>
                    </div>
                  </div>
                </div>
                
                {/* Probability Bars */}
                <div className="space-y-2 mt-4">
                  {Object.entries(prediction.probabilities).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24 capitalize">{key}</span>
                      <Progress value={value * 100} className="h-2 flex-1" />
                      <span className="text-xs font-mono w-12 text-right">{(value * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Management */}
              <div className="glass-card p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Risk Levels
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm">Entry Price</span>
                    <span className="font-mono font-bold">₹{prediction.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-sm text-rose-400">Stop Loss</span>
                    <span className="font-mono font-bold text-rose-400">₹{prediction.stopLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm text-emerald-400">Target 1</span>
                    <span className="font-mono font-bold text-emerald-400">₹{prediction.takeProfit1.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-sm text-emerald-400">Target 2</span>
                    <span className="font-mono font-bold text-emerald-400">₹{prediction.takeProfit2.toFixed(2)}</span>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-xs text-muted-foreground">Risk:Reward</span>
                    <p className="text-xl font-bold text-primary">1:{prediction.riskRewardRatio.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Model Contributions */}
              <div className="glass-card p-6 lg:col-span-2">
                <h3 className="font-medium mb-4">Model Contributions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {prediction.modelContributions.map((contrib) => (
                    <div key={contrib.modelId} className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground truncate">{contrib.modelId.split('_')[0]}</p>
                      <p className={cn('font-bold', SIGNAL_COLORS[contrib.signal].split(' ')[0])}>
                        {contrib.signal}
                      </p>
                      <p className="text-xs">{(contrib.confidence * 100).toFixed(0)}% • {(contrib.weight * 100).toFixed(0)}% weight</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Trained Models</h3>
              <p className="text-muted-foreground mb-4">Train at least one model to see predictions</p>
              <GlassButton onClick={() => setActiveTab('train')}>Start Training</GlassButton>
            </div>
          )}
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="mt-6">
          <div className="space-y-4">
            {models.length > 0 ? models.map((model) => (
              <div key={model.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-muted', MODEL_TYPES.find(m => m.type === model.type)?.color)}>
                      {MODEL_TYPES.find(m => m.type === model.type)?.icon}
                    </div>
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {model.performance && (
                      <div className="flex gap-4 text-sm">
                        <div><span className="text-muted-foreground">Acc:</span> <span className="font-mono">{(model.performance.accuracy * 100).toFixed(1)}%</span></div>
                        <div><span className="text-muted-foreground">F1:</span> <span className="font-mono">{(model.performance.f1Score * 100).toFixed(1)}%</span></div>
                        <div><span className="text-muted-foreground">Sharpe:</span> <span className="font-mono">{model.performance.sharpeRatio.toFixed(2)}</span></div>
                      </div>
                    )}
                    <GlassButton size="sm" variant="ghost" onClick={() => handleDeleteModel(model.id)}>
                      <Trash2 size={14} />
                    </GlassButton>
                  </div>
                </div>
              </div>
            )) : (
              <div className="glass-card p-8 text-center text-muted-foreground">
                No models trained yet. Go to the Train tab to get started.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4">Chart Patterns</h3>
              <div className="space-y-3">
                {chartPatterns.length > 0 ? chartPatterns.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.type === 'bullish' && <TrendingUp size={16} className="text-emerald-400" />}
                      {p.type === 'bearish' && <TrendingDown size={16} className="text-rose-400" />}
                      {p.type === 'neutral' && <Minus size={16} className="text-muted-foreground" />}
                      <span>{p.name}</span>
                    </div>
                    <span className="text-xs">{(p.confidence * 100).toFixed(0)}%</span>
                  </div>
                )) : <p className="text-muted-foreground text-sm">No patterns detected</p>}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4">Candlestick Patterns</h3>
              <div className="space-y-3">
                {candlePatterns.length > 0 ? candlePatterns.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.type === 'bullish' && <TrendingUp size={16} className="text-emerald-400" />}
                      {p.type === 'bearish' && <TrendingDown size={16} className="text-rose-400" />}
                      {p.type === 'neutral' && <Minus size={16} className="text-muted-foreground" />}
                      <span>{p.name}</span>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded', 
                      p.significance === 'high' && 'bg-primary/20 text-primary'
                    )}>{p.significance}</span>
                  </div>
                )) : <p className="text-muted-foreground text-sm">No patterns detected</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Train Tab */}
        <TabsContent value="train" className="mt-6">
          <div className="glass-card p-6">
            <h3 className="font-medium mb-4">Train New Model</h3>
            
            {/* Model Type Selection */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {MODEL_TYPES.map(({ type, icon, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedModelType(type)}
                  className={cn(
                    'p-3 rounded-lg border transition-all text-center',
                    selectedModelType === type 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  )}
                >
                  <div className={cn('mx-auto mb-1', color)}>{icon}</div>
                  <span className="text-xs">{type.replace('_', ' ').toUpperCase()}</span>
                </button>
              ))}
            </div>

            <GlassButton onClick={handleTrain} disabled={isTraining} className="w-full gap-2">
              {isTraining ? <><RefreshCw size={16} className="animate-spin" />Training...</> : <><Play size={16} />Train {selectedModelType.toUpperCase()}</>}
            </GlassButton>

            {isTraining && trainingProgress && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Epoch {trainingProgress.epoch + 1}/{trainingProgress.totalEpochs}</span>
                  <span>Acc: {(trainingProgress.accuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(trainingProgress.epoch / trainingProgress.totalEpochs) * 100} />
              </div>
            )}

            {trainingHistory.length > 0 && (
              <div className="mt-6 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingHistory}>
                    <XAxis dataKey="epoch" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line yAxisId="left" dataKey="loss" stroke="hsl(var(--destructive))" dot={false} />
                    <Line yAxisId="right" dataKey="accuracy" stroke="hsl(var(--primary))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
