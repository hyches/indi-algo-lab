import React, { useState, useEffect, useCallback } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Play, 
  RefreshCw,
  Database,
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Newspaper,
  BarChart3,
  Triangle,
  Waves,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import { tradingModel, TrainingProgress, PredictionResult } from '@/lib/ml/model';
import { generateTrainingData, extractFeaturesFromOHLCV, featuresToArray, FEATURE_NAMES } from '@/lib/ml/featureExtractor';
import { generateMockHistoricalData } from '@/lib/backtesting/engine';
import { Progress } from '@/components/ui/progress';
import { useTrading } from '@/contexts/TradingContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Chart pattern types
type ChartPattern = {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
};

// Sentiment data type
type SentimentData = {
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  headline?: string;
};

export const MLTrainingPanel: React.FC = () => {
  const { trades, addTradeListener, selectedSymbol } = useTrading();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<{ epoch: number; loss: number; accuracy: number }[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [storedExamples, setStoredExamples] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [activeTab, setActiveTab] = useState('signals');
  
  // Chart patterns state (simulated)
  const [chartPatterns, setChartPatterns] = useState<ChartPattern[]>([]);
  
  // Sentiment state (simulated)
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [overallSentiment, setOverallSentiment] = useState({ score: 0, label: 'Neutral' });

  // Initialize model
  useEffect(() => {
    const init = async () => {
      await tradingModel.initialize();
      setIsInitialized(true);
      setModelReady(tradingModel.isModelTrained());
      setStoredExamples(tradingModel.getStoredExamplesCount());
    };
    init();
  }, []);

  // Listen for trades to add as training examples
  useEffect(() => {
    const unsubscribe = addTradeListener((trade) => {
      // In real implementation, extract features and add to training data
      console.log('Trade received for ML training:', trade);
      setStoredExamples(prev => prev + 1);
    });
    return unsubscribe;
  }, [addTradeListener]);

  // Simulate chart pattern detection
  useEffect(() => {
    const detectPatterns = () => {
      const patterns: ChartPattern[] = [];
      const possiblePatterns = [
        { name: 'Double Bottom', type: 'bullish' as const, description: 'Reversal pattern indicating potential upward movement' },
        { name: 'Head and Shoulders', type: 'bearish' as const, description: 'Reversal pattern suggesting downward trend' },
        { name: 'Rising Wedge', type: 'bearish' as const, description: 'Bearish pattern with converging trendlines' },
        { name: 'Falling Wedge', type: 'bullish' as const, description: 'Bullish pattern indicating potential breakout' },
        { name: 'Bull Flag', type: 'bullish' as const, description: 'Continuation pattern in uptrend' },
        { name: 'Triangle', type: 'neutral' as const, description: 'Consolidation pattern, breakout direction unclear' },
        { name: 'Cup and Handle', type: 'bullish' as const, description: 'Bullish continuation pattern' },
        { name: 'Descending Channel', type: 'bearish' as const, description: 'Bearish trend channel' },
      ];
      
      // Randomly detect 2-4 patterns
      const numPatterns = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...possiblePatterns].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < numPatterns; i++) {
        patterns.push({
          ...shuffled[i],
          confidence: Math.random() * 0.4 + 0.6, // 60-100%
        });
      }
      
      setChartPatterns(patterns.sort((a, b) => b.confidence - a.confidence));
    };

    detectPatterns();
    const interval = setInterval(detectPatterns, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Simulate sentiment analysis
  useEffect(() => {
    const analyzeSentiment = () => {
      const sources: SentimentData[] = [
        { source: 'Economic Times', sentiment: Math.random() > 0.5 ? 'positive' : 'negative', score: Math.random(), headline: `${selectedSymbol} shows strong momentum in trading session` },
        { source: 'MoneyControl', sentiment: Math.random() > 0.4 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral', score: Math.random(), headline: 'Market analysis suggests cautious optimism' },
        { source: 'Reuters India', sentiment: Math.random() > 0.5 ? 'neutral' : 'positive', score: Math.random(), headline: 'FII flows remain positive amid global uncertainty' },
        { source: 'Twitter/X', sentiment: Math.random() > 0.6 ? 'positive' : 'neutral', score: Math.random() },
        { source: 'Reddit r/IndianStreetBets', sentiment: Math.random() > 0.5 ? 'positive' : 'neutral', score: Math.random() },
      ];
      
      setSentimentData(sources);
      
      // Calculate overall sentiment
      const avgScore = sources.reduce((acc, s) => {
        const multiplier = s.sentiment === 'positive' ? 1 : s.sentiment === 'negative' ? -1 : 0;
        return acc + (s.score * multiplier);
      }, 0) / sources.length;
      
      setOverallSentiment({
        score: avgScore,
        label: avgScore > 0.2 ? 'Bullish' : avgScore < -0.2 ? 'Bearish' : 'Neutral',
      });
    };

    analyzeSentiment();
    const interval = setInterval(analyzeSentiment, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedSymbol]);
  
  const handleTrain = useCallback(async () => {
    setIsTraining(true);
    setTrainingHistory([]);
    
    try {
      const data = generateMockHistoricalData(selectedSymbol, 60);
      const trainingData = generateTrainingData(data, 15, 0.5);
      
      console.log(`Training with ${trainingData.features.length} samples`);
      
      await tradingModel.train(
        trainingData,
        30,
        32,
        0.2,
        (progress) => {
          setTrainingProgress(progress);
          setTrainingHistory(prev => [...prev, {
            epoch: progress.epoch,
            loss: progress.loss,
            accuracy: progress.accuracy,
          }]);
        }
      );
      
      setModelReady(true);
    } catch (error) {
      console.error('Training error:', error);
    } finally {
      setIsTraining(false);
    }
  }, [selectedSymbol]);
  
  const handlePredict = useCallback(async () => {
    if (!modelReady) return;
    
    const data = generateMockHistoricalData(selectedSymbol, 5);
    const features = extractFeaturesFromOHLCV(data, data.length - 1);
    
    if (features) {
      const result = await tradingModel.predict(featuresToArray(features));
      setPrediction(result);
    }
  }, [modelReady, selectedSymbol]);
  
  // Auto-refresh prediction
  useEffect(() => {
    if (!modelReady) return;
    
    handlePredict();
    const interval = setInterval(handlePredict, 5000);
    return () => clearInterval(interval);
  }, [modelReady, handlePredict]);
  
  const featureImportanceData = prediction?.featureImportance.slice(0, 8).map(f => ({
    name: f.name.replace(/([A-Z])/g, ' $1').trim(),
    importance: f.importance * 100,
    fullMark: 100,
  })) || [];

  // Combine all signals for composite score
  const compositeSignal = {
    technical: prediction?.confidence || 0,
    patterns: chartPatterns.filter(p => p.type === 'bullish').length - chartPatterns.filter(p => p.type === 'bearish').length,
    sentiment: overallSentiment.score,
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ML Intelligence Hub</h2>
            <p className="text-sm text-muted-foreground">Multi-factor prediction engine for {selectedSymbol}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border',
            modelReady 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-muted/50 border-border text-muted-foreground'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              modelReady ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
            )} />
            <span className="text-xs font-medium">
              {modelReady ? 'Model Ready' : 'Not Trained'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Database size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{storedExamples + trades.length}</p>
              <p className="text-sm text-muted-foreground">Training Samples</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Cpu size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{FEATURE_NAMES.length}</p>
              <p className="text-sm text-muted-foreground">Input Features</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Triangle size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{chartPatterns.length}</p>
              <p className="text-sm text-muted-foreground">Chart Patterns</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Activity size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">
                {trainingProgress ? `${(trainingProgress.accuracy * 100).toFixed(1)}%` : '--'}
              </p>
              <p className="text-sm text-muted-foreground">Model Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different analysis types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="signals" className="gap-2">
            <Zap size={14} />
            Signals
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Waves size={14} />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="gap-2">
            <Newspaper size={14} />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <Brain size={14} />
            Training
          </TabsTrigger>
        </TabsList>

        {/* ML Signals Tab */}
        <TabsContent value="signals" className="mt-6">
          {modelReady && prediction ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prediction Result */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Live ML Prediction</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap size={12} className="text-primary" />
                    Real-time
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={cn(
                      'inline-flex items-center gap-3 px-6 py-3 rounded-2xl border',
                      prediction.signal === 'BULLISH' && 'bg-emerald-500/10 border-emerald-500/30',
                      prediction.signal === 'BEARISH' && 'bg-rose-500/10 border-rose-500/30',
                      prediction.signal === 'NEUTRAL' && 'bg-muted/50 border-border',
                    )}>
                      {prediction.signal === 'BULLISH' && <TrendingUp size={24} className="text-emerald-400" />}
                      {prediction.signal === 'BEARISH' && <TrendingDown size={24} className="text-rose-400" />}
                      {prediction.signal === 'NEUTRAL' && <Minus size={24} className="text-muted-foreground" />}
                      <div className="text-left">
                        <p className={cn(
                          'text-2xl font-bold',
                          prediction.signal === 'BULLISH' && 'text-emerald-400',
                          prediction.signal === 'BEARISH' && 'text-rose-400',
                          prediction.signal === 'NEUTRAL' && 'text-muted-foreground',
                        )}>
                          {prediction.signal}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(prediction.confidence * 100).toFixed(1)}% confidence
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bearish</span>
                      <span className="font-mono text-rose-400">
                        {(prediction.probabilities.bearish * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={prediction.probabilities.bearish * 100} 
                      className="h-2 bg-rose-500/20"
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Neutral</span>
                      <span className="font-mono">
                        {(prediction.probabilities.neutral * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={prediction.probabilities.neutral * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bullish</span>
                      <span className="font-mono text-emerald-400">
                        {(prediction.probabilities.bullish * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={prediction.probabilities.bullish * 100} 
                      className="h-2 bg-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
              
              {/* Feature Importance */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Feature Importance</h3>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Info size={14} />
                  </button>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={featureImportanceData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Radar
                        name="Importance"
                        dataKey="importance"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm text-muted-foreground">Top Features</h4>
                  {prediction.featureImportance.slice(0, 5).map((f, i) => (
                    <div key={f.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{f.name}</span>
                      </div>
                      <span className="font-mono">{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Model Not Trained</h3>
              <p className="text-muted-foreground mb-4">Train the model first to see live predictions</p>
              <GlassButton onClick={handleTrain} disabled={isTraining}>
                {isTraining ? 'Training...' : 'Train Model'}
              </GlassButton>
            </div>
          )}
        </TabsContent>

        {/* Chart Patterns Tab */}
        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Waves size={18} />
                Detected Chart Patterns
              </h3>
              <div className="space-y-3">
                {chartPatterns.map((pattern, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pattern.type === 'bullish' && <TrendingUp size={16} className="text-emerald-400" />}
                        {pattern.type === 'bearish' && <TrendingDown size={16} className="text-rose-400" />}
                        {pattern.type === 'neutral' && <Minus size={16} className="text-muted-foreground" />}
                        <span className="font-medium">{pattern.name}</span>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        pattern.type === 'bullish' && 'bg-emerald-500/20 text-emerald-400',
                        pattern.type === 'bearish' && 'bg-rose-500/20 text-rose-400',
                        pattern.type === 'neutral' && 'bg-muted text-muted-foreground',
                      )}>
                        {(pattern.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <BarChart3 size={18} />
                Pattern Summary
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-400 font-medium">Bullish Patterns</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {chartPatterns.filter(p => p.type === 'bullish').length}
                    </span>
                  </div>
                  <Progress 
                    value={(chartPatterns.filter(p => p.type === 'bullish').length / chartPatterns.length) * 100} 
                    className="h-2 bg-emerald-500/20"
                  />
                </div>
                
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-rose-400 font-medium">Bearish Patterns</span>
                    <span className="text-2xl font-bold text-rose-400">
                      {chartPatterns.filter(p => p.type === 'bearish').length}
                    </span>
                  </div>
                  <Progress 
                    value={(chartPatterns.filter(p => p.type === 'bearish').length / chartPatterns.length) * 100} 
                    className="h-2 bg-rose-500/20"
                  />
                </div>
                
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground font-medium">Neutral Patterns</span>
                    <span className="text-2xl font-bold">
                      {chartPatterns.filter(p => p.type === 'neutral').length}
                    </span>
                  </div>
                  <Progress 
                    value={(chartPatterns.filter(p => p.type === 'neutral').length / chartPatterns.length) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Newspaper size={18} />
                News & Social Sentiment
              </h3>
              <div className="space-y-3">
                {sentimentData.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.source}</span>
                      <div className="flex items-center gap-2">
                        {item.sentiment === 'positive' && <ThumbsUp size={14} className="text-emerald-400" />}
                        {item.sentiment === 'negative' && <ThumbsDown size={14} className="text-rose-400" />}
                        {item.sentiment === 'neutral' && <Minus size={14} className="text-muted-foreground" />}
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          item.sentiment === 'positive' && 'bg-emerald-500/20 text-emerald-400',
                          item.sentiment === 'negative' && 'bg-rose-500/20 text-rose-400',
                          item.sentiment === 'neutral' && 'bg-muted text-muted-foreground',
                        )}>
                          {item.sentiment}
                        </span>
                      </div>
                    </div>
                    {item.headline && (
                      <p className="text-sm text-muted-foreground italic">"{item.headline}"</p>
                    )}
                    <Progress value={item.score * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h3 className="font-medium mb-4">Overall Market Sentiment</h3>
              <div className="flex flex-col items-center justify-center py-8">
                <div className={cn(
                  'w-32 h-32 rounded-full flex items-center justify-center border-4',
                  overallSentiment.label === 'Bullish' && 'border-emerald-500 bg-emerald-500/10',
                  overallSentiment.label === 'Bearish' && 'border-rose-500 bg-rose-500/10',
                  overallSentiment.label === 'Neutral' && 'border-border bg-muted/50',
                )}>
                  {overallSentiment.label === 'Bullish' && <TrendingUp size={48} className="text-emerald-400" />}
                  {overallSentiment.label === 'Bearish' && <TrendingDown size={48} className="text-rose-400" />}
                  {overallSentiment.label === 'Neutral' && <Minus size={48} className="text-muted-foreground" />}
                </div>
                <p className={cn(
                  'text-2xl font-bold mt-4',
                  overallSentiment.label === 'Bullish' && 'text-emerald-400',
                  overallSentiment.label === 'Bearish' && 'text-rose-400',
                  overallSentiment.label === 'Neutral' && 'text-muted-foreground',
                )}>
                  {overallSentiment.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {(overallSentiment.score * 100).toFixed(1)}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/30 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <AlertTriangle size={14} />
                  Disclaimer
                </div>
                <p className="text-xs text-muted-foreground">
                  Sentiment analysis is simulated for demo purposes. In production, this would aggregate 
                  real news feeds, social media, and market sentiment indicators.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="mt-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Model Training</h3>
              <GlassButton 
                onClick={handleTrain}
                disabled={isTraining}
                size="sm"
                className="gap-2"
              >
                {isTraining ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Train Model
                  </>
                )}
              </GlassButton>
            </div>
            
            {isTraining && trainingProgress && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Epoch {trainingProgress.epoch + 1} / {trainingProgress.totalEpochs}
                  </span>
                  <span className="font-mono">
                    Loss: {trainingProgress.loss.toFixed(4)} | Acc: {(trainingProgress.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={((trainingProgress.epoch + 1) / trainingProgress.totalEpochs) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            {trainingHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-muted-foreground mb-3">Training History</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingHistory}>
                      <XAxis 
                        dataKey="epoch" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 1]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="loss" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={false}
                        name="Loss"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                        dot={false}
                        name="Accuracy"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
          
          {/* Feature List */}
          <div className="glass-card p-6 mt-6">
            <h3 className="font-medium mb-4">Extracted Features ({FEATURE_NAMES.length} total)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {FEATURE_NAMES.map((name) => (
                <div 
                  key={name}
                  className="px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground truncate"
                  title={name}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};