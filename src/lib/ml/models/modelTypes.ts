// Advanced ML Model Types and Interfaces for Professional Trading
import * as tf from '@tensorflow/tfjs';

export type ModelType = 
  | 'dense_nn'        // Dense Neural Network
  | 'lstm'            // Long Short-Term Memory
  | 'gru'             // Gated Recurrent Unit
  | 'transformer'     // Transformer with Attention
  | 'cnn_1d'          // 1D Convolutional Network
  | 'ensemble';       // Ensemble of multiple models

export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface ModelConfig {
  type: ModelType;
  name: string;
  description: string;
  inputShape: number;
  sequenceLength?: number;
  hiddenLayers: number[];
  dropout: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
}

export interface ModelPerformance {
  modelId: string;
  modelType: ModelType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgHoldingPeriod: number;
  lastUpdated: Date;
}

export interface EnsembleWeight {
  modelId: string;
  weight: number;
  performance: number;
}

export interface PredictionSignal {
  signal: SignalType;
  confidence: number;
  probabilities: {
    strongSell: number;
    sell: number;
    hold: number;
    buy: number;
    strongBuy: number;
  };
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  expectedReturn: number;
  timeHorizon: string;
  modelContributions: { modelId: string; signal: SignalType; confidence: number; weight: number }[];
}

export interface MarketRegime {
  type: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'low_volatility';
  confidence: number;
  description: string;
  recommendedStrategy: string;
}

export interface TechnicalPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
  priceTarget?: number;
  stopLoss?: number;
  expectedMove?: number;
  timeframe: string;
}

export interface CandlestickPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  significance: 'high' | 'medium' | 'low';
}

export interface SupportResistance {
  type: 'support' | 'resistance';
  price: number;
  strength: number;
  touches: number;
  isActive: boolean;
}

export interface MLModelState {
  isInitialized: boolean;
  isTraining: boolean;
  activeModels: Map<string, tf.LayersModel>;
  modelConfigs: Map<string, ModelConfig>;
  modelPerformance: Map<string, ModelPerformance>;
  ensembleWeights: EnsembleWeight[];
  lastPrediction: PredictionSignal | null;
  marketRegime: MarketRegime | null;
}

// Default model configurations for different architectures
export const DEFAULT_CONFIGS: Record<ModelType, Omit<ModelConfig, 'inputShape'>> = {
  dense_nn: {
    type: 'dense_nn',
    name: 'Dense Neural Network',
    description: 'Fast, accurate predictions using fully connected layers',
    hiddenLayers: [256, 128, 64, 32],
    dropout: 0.3,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
  },
  lstm: {
    type: 'lstm',
    name: 'LSTM Network',
    description: 'Captures long-term dependencies in time series data',
    sequenceLength: 30,
    hiddenLayers: [128, 64],
    dropout: 0.2,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
  },
  gru: {
    type: 'gru',
    name: 'GRU Network',
    description: 'Efficient variant of LSTM with fewer parameters',
    sequenceLength: 30,
    hiddenLayers: [128, 64],
    dropout: 0.2,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
  },
  transformer: {
    type: 'transformer',
    name: 'Transformer Attention',
    description: 'State-of-the-art attention mechanism for pattern recognition',
    sequenceLength: 30,
    hiddenLayers: [128, 64],
    dropout: 0.1,
    learningRate: 0.0005,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
  },
  cnn_1d: {
    type: 'cnn_1d',
    name: '1D CNN',
    description: 'Detects local patterns and technical formations',
    sequenceLength: 30,
    hiddenLayers: [64, 32],
    dropout: 0.25,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    validationSplit: 0.2,
  },
  ensemble: {
    type: 'ensemble',
    name: 'Ensemble Model',
    description: 'Combines multiple models for robust predictions',
    hiddenLayers: [],
    dropout: 0,
    learningRate: 0,
    batchSize: 32,
    epochs: 0,
    validationSplit: 0.2,
  },
};

// Signal thresholds for 5-class classification
export const SIGNAL_THRESHOLDS = {
  strongBuy: 0.7,
  buy: 0.55,
  hold: 0.45,
  sell: 0.3,
  strongSell: 0,
};

// Risk management defaults
export const RISK_DEFAULTS = {
  stopLossPercent: 2,
  takeProfitPercent1: 3,
  takeProfitPercent2: 6,
  takeProfitPercent3: 10,
  maxPositionSize: 0.1,
  maxDailyLoss: 0.05,
};
