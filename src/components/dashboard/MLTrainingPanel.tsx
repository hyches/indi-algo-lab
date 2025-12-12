import React, { useState, useEffect, useCallback } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Play, 
  Pause,
  RefreshCw,
  Database,
  Cpu,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Target,
  Info,
} from 'lucide-react';
import { tradingModel, TrainingProgress, PredictionResult } from '@/lib/ml/model';
import { generateTrainingData, extractFeaturesFromOHLCV, featuresToArray, FEATURE_NAMES } from '@/lib/ml/featureExtractor';
import { generateMockHistoricalData } from '@/lib/backtesting/engine';
import { Progress } from '@/components/ui/progress';
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

export const MLTrainingPanel: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<{ epoch: number; loss: number; accuracy: number }[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [storedExamples, setStoredExamples] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      await tradingModel.initialize();
      setIsInitialized(true);
      setModelReady(tradingModel.isModelTrained());
      setStoredExamples(tradingModel.getStoredExamplesCount());
    };
    init();
  }, []);
  
  const handleTrain = useCallback(async () => {
    setIsTraining(true);
    setTrainingHistory([]);
    
    try {
      // Generate training data
      const data = generateMockHistoricalData('NIFTY', 60);
      const trainingData = generateTrainingData(data, 15, 0.5);
      
      console.log(`Training with ${trainingData.features.length} samples`);
      
      // Train model
      await tradingModel.train(
        trainingData,
        30, // epochs
        32, // batch size
        0.2, // validation split
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
  }, []);
  
  const handlePredict = useCallback(async () => {
    if (!modelReady) return;
    
    // Generate current features from latest data
    const data = generateMockHistoricalData('NIFTY', 5);
    const features = extractFeaturesFromOHLCV(data, data.length - 1);
    
    if (features) {
      const result = await tradingModel.predict(featuresToArray(features));
      setPrediction(result);
    }
  }, [modelReady]);
  
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ML Training Pipeline</h2>
            <p className="text-sm text-muted-foreground">TensorFlow.js powered predictions</p>
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
      
      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Database size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{storedExamples}</p>
              <p className="text-sm text-muted-foreground">Stored Examples</p>
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
      
      {/* Training Section */}
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
      
      {/* Live Prediction */}
      {modelReady && prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prediction Result */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Live Prediction</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap size={12} className="text-primary" />
                Real-time
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Signal */}
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
              
              {/* Probability Distribution */}
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
      )}
      
      {/* Feature List */}
      <div className="glass-card p-6">
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
    </div>
  );
};
