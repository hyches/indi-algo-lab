// Ensemble Model Manager - Combines multiple models for robust predictions
import * as tf from '@tensorflow/tfjs';
import { 
  ModelType, 
  ModelConfig, 
  ModelPerformance, 
  EnsembleWeight, 
  PredictionSignal,
  SignalType,
  RISK_DEFAULTS,
  DEFAULT_CONFIGS,
} from './modelTypes';
import { ModelFactory } from './modelFactory';
import { extractAdvancedFeatures, ADVANCED_FEATURE_NAMES } from './advancedFeatures';
import { OHLCV } from '@/lib/backtesting/engine';

export interface TrainingProgress {
  modelId: string;
  modelType: ModelType;
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
  status: 'training' | 'completed' | 'failed';
}

export interface ModelSummary {
  id: string;
  type: ModelType;
  name: string;
  isTrained: boolean;
  performance: ModelPerformance | null;
  lastTrainedAt: Date | null;
}

class ModelManager {
  private models: Map<string, tf.LayersModel> = new Map();
  private configs: Map<string, ModelConfig> = new Map();
  private performances: Map<string, ModelPerformance> = new Map();
  private ensembleWeights: EnsembleWeight[] = [];
  private featureMeans: number[] = [];
  private featureStds: number[] = [];
  private isTraining: boolean = false;
  private sequenceData: Map<string, number[][]> = new Map();

  async initialize(): Promise<void> {
    // Try to load saved models and configurations
    try {
      const savedConfig = localStorage.getItem('ml-model-manager-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.featureMeans = config.means || [];
        this.featureStds = config.stds || [];
        this.ensembleWeights = config.weights || [];
        
        // Load each saved model
        for (const modelId of config.modelIds || []) {
          try {
            const model = await tf.loadLayersModel(`localstorage://ml-model-${modelId}`);
            this.models.set(modelId, model);
            
            const perfData = localStorage.getItem(`ml-performance-${modelId}`);
            if (perfData) {
              this.performances.set(modelId, JSON.parse(perfData));
            }
            
            const configData = localStorage.getItem(`ml-config-${modelId}`);
            if (configData) {
              this.configs.set(modelId, JSON.parse(configData));
            }
          } catch (e) {
            console.log(`Could not load model ${modelId}`);
          }
        }
        console.log(`Loaded ${this.models.size} saved models`);
      }
    } catch (e) {
      console.log('No saved model configuration found');
    }
  }

  async trainModel(
    type: ModelType,
    data: OHLCV[],
    options: {
      epochs?: number;
      batchSize?: number;
      validationSplit?: number;
      onProgress?: (progress: TrainingProgress) => void;
    } = {}
  ): Promise<ModelPerformance> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    const modelId = `${type}_${Date.now()}`;
    const inputShape = ADVANCED_FEATURE_NAMES.length;

    try {
      // Get default config and merge with options
      const config: ModelConfig = {
        ...DEFAULT_CONFIGS[type],
        inputShape,
        epochs: options.epochs || DEFAULT_CONFIGS[type].epochs,
        batchSize: options.batchSize || DEFAULT_CONFIGS[type].batchSize,
        validationSplit: options.validationSplit || DEFAULT_CONFIGS[type].validationSplit,
      };

      // Extract features and labels
      const { features, labels, sequences } = this.prepareTrainingData(data, config);
      
      if (features.length < 100) {
        throw new Error('Insufficient training data. Need at least 100 samples.');
      }

      // Normalize features
      const { normalized, means, stds } = this.normalizeFeatures(features);
      this.featureMeans = means;
      this.featureStds = stds;

      // Create model
      const model = ModelFactory.createModel(config);
      this.models.set(modelId, model);
      this.configs.set(modelId, config);

      // Prepare tensors based on model type
      let xs: tf.Tensor;
      if (config.sequenceLength && sequences) {
        // For sequence models (LSTM, GRU, Transformer, CNN1D)
        const normalizedSeq = sequences.map(seq => 
          seq.map(step => 
            step.map((val, i) => (val - means[i]) / (stds[i] || 1))
          )
        );
        xs = tf.tensor3d(normalizedSeq);
      } else {
        xs = tf.tensor2d(normalized);
      }
      const ys = tf.tensor1d(labels, 'int32');

      // Train with callbacks
      await model.fit(xs, ys, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (options.onProgress) {
              options.onProgress({
                modelId,
                modelType: type,
                epoch,
                totalEpochs: config.epochs,
                loss: logs?.loss || 0,
                accuracy: logs?.acc || 0,
                valLoss: logs?.val_loss,
                valAccuracy: logs?.val_acc,
                status: 'training',
              });
            }
          },
        },
      });

      // Calculate performance metrics
      const predictions = model.predict(xs) as tf.Tensor;
      const performance = await this.calculatePerformance(modelId, type, predictions, ys, labels);
      this.performances.set(modelId, performance);

      // Update ensemble weights
      this.updateEnsembleWeights();

      // Save model and config
      await this.saveModel(modelId);

      // Cleanup
      xs.dispose();
      ys.dispose();
      predictions.dispose();

      if (options.onProgress) {
        options.onProgress({
          modelId,
          modelType: type,
          epoch: config.epochs,
          totalEpochs: config.epochs,
          loss: 0,
          accuracy: performance.accuracy,
          status: 'completed',
        });
      }

      return performance;
    } finally {
      this.isTraining = false;
    }
  }

  private prepareTrainingData(
    data: OHLCV[],
    config: ModelConfig,
    forwardPeriod: number = 15
  ): { features: number[][]; labels: number[]; sequences?: number[][][] } {
    const features: number[][] = [];
    const labels: number[] = [];
    const sequences: number[][][] = [];
    const seqLen = config.sequenceLength || 30;

    for (let i = 200; i < data.length - forwardPeriod; i++) {
      const feature = extractAdvancedFeatures(data, i, 200);
      if (!feature) continue;

      // Calculate forward return for 5-class label
      const currentPrice = data[i].close;
      const futurePrice = data[i + forwardPeriod].close;
      const forwardReturn = ((futurePrice - currentPrice) / currentPrice) * 100;

      // 5-class labels: 0=strong_sell, 1=sell, 2=hold, 3=buy, 4=strong_buy
      let label = 2; // hold
      if (forwardReturn > 2) label = 4;      // strong_buy
      else if (forwardReturn > 0.5) label = 3; // buy
      else if (forwardReturn < -2) label = 0;  // strong_sell
      else if (forwardReturn < -0.5) label = 1; // sell

      features.push(feature);
      labels.push(label);

      // Build sequences for recurrent models
      if (config.sequenceLength) {
        const sequence: number[][] = [];
        for (let j = seqLen - 1; j >= 0; j--) {
          const seqFeature = extractAdvancedFeatures(data, i - j, 200);
          if (seqFeature) {
            sequence.push(seqFeature);
          }
        }
        if (sequence.length === seqLen) {
          sequences.push(sequence);
        }
      }
    }

    return { features, labels, sequences: sequences.length > 0 ? sequences : undefined };
  }

  private normalizeFeatures(features: number[][]): { normalized: number[][]; means: number[]; stds: number[] } {
    const numFeatures = features[0].length;
    const means: number[] = [];
    const stds: number[] = [];

    for (let j = 0; j < numFeatures; j++) {
      const values = features.map(f => f[j]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance) || 1;
      means.push(mean);
      stds.push(std);
    }

    const normalized = features.map(f =>
      f.map((val, j) => (val - means[j]) / stds[j])
    );

    return { normalized, means, stds };
  }

  private async calculatePerformance(
    modelId: string,
    modelType: ModelType,
    predictions: tf.Tensor,
    labels: tf.Tensor,
    rawLabels: number[]
  ): Promise<ModelPerformance> {
    const predData = await predictions.argMax(-1).data();
    const labelData = await labels.data();

    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let wins = 0;
    let totalTrades = 0;

    for (let i = 0; i < predData.length; i++) {
      if (predData[i] === labelData[i]) correct++;
      
      // For precision/recall, consider buy signals (3, 4) as positive
      const isPredPositive = predData[i] >= 3;
      const isActualPositive = labelData[i] >= 3;
      
      if (isPredPositive && isActualPositive) truePositives++;
      if (isPredPositive && !isActualPositive) falsePositives++;
      if (!isPredPositive && isActualPositive) falseNegatives++;

      // Count trade outcomes
      if (predData[i] >= 3 || predData[i] <= 1) {
        totalTrades++;
        if (predData[i] === labelData[i]) wins++;
      }
    }

    const accuracy = correct / predData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;

    return {
      modelId,
      modelType,
      accuracy,
      precision,
      recall,
      f1Score,
      sharpeRatio: this.calculateSharpeRatio(predData, rawLabels),
      maxDrawdown: this.calculateMaxDrawdown(predData, rawLabels),
      winRate,
      profitFactor: winRate > 0 ? winRate / (1 - winRate) : 0,
      totalTrades,
      avgHoldingPeriod: 15,
      lastUpdated: new Date(),
    };
  }

  private calculateSharpeRatio(predictions: Float32Array | Int32Array | Uint8Array, labels: number[]): number {
    const returns: number[] = [];
    for (let i = 0; i < predictions.length; i++) {
      const signal = predictions[i];
      const actual = labels[i];
      
      // Simulate returns based on prediction accuracy
      if (signal >= 3) { // Buy signal
        returns.push(actual >= 3 ? 0.02 : -0.01);
      } else if (signal <= 1) { // Sell signal
        returns.push(actual <= 1 ? 0.02 : -0.01);
      } else {
        returns.push(0);
      }
    }

    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance) || 1;
    
    return (avgReturn / stdDev) * Math.sqrt(252); // Annualized
  }

  private calculateMaxDrawdown(predictions: Float32Array | Int32Array | Uint8Array, labels: number[]): number {
    let cumReturn = 1;
    let peak = 1;
    let maxDrawdown = 0;

    for (let i = 0; i < predictions.length; i++) {
      const signal = predictions[i];
      const actual = labels[i];
      
      if (signal >= 3) {
        cumReturn *= actual >= 3 ? 1.02 : 0.99;
      } else if (signal <= 1) {
        cumReturn *= actual <= 1 ? 1.02 : 0.99;
      }

      peak = Math.max(peak, cumReturn);
      const drawdown = (peak - cumReturn) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  private updateEnsembleWeights(): void {
    const weights: EnsembleWeight[] = [];
    let totalPerformance = 0;

    this.performances.forEach((perf, modelId) => {
      const score = perf.f1Score * 0.4 + perf.sharpeRatio * 0.3 + perf.winRate * 0.3;
      totalPerformance += score;
      weights.push({ modelId, weight: score, performance: score });
    });

    // Normalize weights
    if (totalPerformance > 0) {
      weights.forEach(w => w.weight /= totalPerformance);
    }

    this.ensembleWeights = weights.sort((a, b) => b.performance - a.performance);
  }

  async predict(
    data: OHLCV[],
    modelIds?: string[]
  ): Promise<PredictionSignal> {
    const modelsToUse = modelIds || Array.from(this.models.keys());
    
    if (modelsToUse.length === 0) {
      throw new Error('No trained models available');
    }

    const currentPrice = data[data.length - 1].close;
    const feature = extractAdvancedFeatures(data, data.length - 1, 200);
    
    if (!feature) {
      throw new Error('Could not extract features');
    }

    // Normalize features
    const normalized = feature.map((val, i) => 
      (val - (this.featureMeans[i] || 0)) / (this.featureStds[i] || 1)
    );

    const modelContributions: PredictionSignal['modelContributions'] = [];
    const aggregatedProbs = { strongSell: 0, sell: 0, hold: 0, buy: 0, strongBuy: 0 };
    let totalWeight = 0;

    for (const modelId of modelsToUse) {
      const model = this.models.get(modelId);
      const config = this.configs.get(modelId);
      if (!model || !config) continue;

      const weight = this.ensembleWeights.find(w => w.modelId === modelId)?.weight || 1 / modelsToUse.length;
      
      // Prepare input based on model type
      let input: tf.Tensor;
      if (config.sequenceLength) {
        // For sequence models, we need sequence data
        const seqLen = config.sequenceLength;
        const sequence: number[][] = [];
        for (let j = seqLen - 1; j >= 0; j--) {
          const seqFeature = extractAdvancedFeatures(data, data.length - 1 - j, 200);
          if (seqFeature) {
            sequence.push(seqFeature.map((val, i) => 
              (val - (this.featureMeans[i] || 0)) / (this.featureStds[i] || 1)
            ));
          }
        }
        if (sequence.length === seqLen) {
          input = tf.tensor3d([sequence]);
        } else {
          continue; // Skip if sequence is incomplete
        }
      } else {
        input = tf.tensor2d([normalized]);
      }

      const prediction = model.predict(input) as tf.Tensor;
      const probs = await prediction.data();
      
      input.dispose();
      prediction.dispose();

      // Aggregate probabilities with weight
      aggregatedProbs.strongSell += probs[0] * weight;
      aggregatedProbs.sell += probs[1] * weight;
      aggregatedProbs.hold += probs[2] * weight;
      aggregatedProbs.buy += probs[3] * weight;
      aggregatedProbs.strongBuy += probs[4] * weight;
      totalWeight += weight;

      // Determine individual model signal
      const maxProb = Math.max(...probs);
      const signalIndex = Array.from(probs).indexOf(maxProb);
      const signals: SignalType[] = ['STRONG_SELL', 'SELL', 'HOLD', 'BUY', 'STRONG_BUY'];
      
      modelContributions.push({
        modelId,
        signal: signals[signalIndex],
        confidence: maxProb,
        weight,
      });
    }

    // Normalize aggregated probabilities
    if (totalWeight > 0) {
      Object.keys(aggregatedProbs).forEach(key => {
        aggregatedProbs[key as keyof typeof aggregatedProbs] /= totalWeight;
      });
    }

    // Determine final signal
    const probArray = [
      aggregatedProbs.strongSell,
      aggregatedProbs.sell,
      aggregatedProbs.hold,
      aggregatedProbs.buy,
      aggregatedProbs.strongBuy,
    ];
    const maxProb = Math.max(...probArray);
    const signalIndex = probArray.indexOf(maxProb);
    const signals: SignalType[] = ['STRONG_SELL', 'SELL', 'HOLD', 'BUY', 'STRONG_BUY'];

    // Calculate risk management levels
    const atr = this.calculateCurrentATR(data);
    const isBuy = signalIndex >= 3;
    const stopLossMultiplier = isBuy ? -1 : 1;

    return {
      signal: signals[signalIndex],
      confidence: maxProb,
      probabilities: aggregatedProbs,
      entryPrice: currentPrice,
      stopLoss: currentPrice + (atr * RISK_DEFAULTS.stopLossPercent * stopLossMultiplier),
      takeProfit1: currentPrice - (atr * RISK_DEFAULTS.takeProfitPercent1 * stopLossMultiplier),
      takeProfit2: currentPrice - (atr * RISK_DEFAULTS.takeProfitPercent2 * stopLossMultiplier),
      takeProfit3: currentPrice - (atr * RISK_DEFAULTS.takeProfitPercent3 * stopLossMultiplier),
      riskRewardRatio: RISK_DEFAULTS.takeProfitPercent1 / RISK_DEFAULTS.stopLossPercent,
      expectedReturn: (aggregatedProbs.strongBuy * 3 + aggregatedProbs.buy * 1 - 
                       aggregatedProbs.sell * 1 - aggregatedProbs.strongSell * 3),
      timeHorizon: '15 bars',
      modelContributions,
    };
  }

  private calculateCurrentATR(data: OHLCV[], period: number = 14): number {
    const slice = data.slice(-period - 1);
    let atrSum = 0;
    
    for (let i = 1; i < slice.length; i++) {
      const tr = Math.max(
        slice[i].high - slice[i].low,
        Math.abs(slice[i].high - slice[i - 1].close),
        Math.abs(slice[i].low - slice[i - 1].close)
      );
      atrSum += tr;
    }
    
    return atrSum / period;
  }

  private async saveModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    const config = this.configs.get(modelId);
    const performance = this.performances.get(modelId);

    if (model) {
      await model.save(`localstorage://ml-model-${modelId}`);
    }
    if (config) {
      localStorage.setItem(`ml-config-${modelId}`, JSON.stringify(config));
    }
    if (performance) {
      localStorage.setItem(`ml-performance-${modelId}`, JSON.stringify(performance));
    }

    // Save manager configuration
    localStorage.setItem('ml-model-manager-config', JSON.stringify({
      modelIds: Array.from(this.models.keys()),
      means: this.featureMeans,
      stds: this.featureStds,
      weights: this.ensembleWeights,
    }));
  }

  getModelSummaries(): ModelSummary[] {
    const summaries: ModelSummary[] = [];
    
    this.models.forEach((_, modelId) => {
      const config = this.configs.get(modelId);
      const performance = this.performances.get(modelId);
      
      summaries.push({
        id: modelId,
        type: config?.type || 'dense_nn',
        name: config?.name || modelId,
        isTrained: true,
        performance: performance || null,
        lastTrainedAt: performance?.lastUpdated || null,
      });
    });

    return summaries.sort((a, b) => 
      (b.performance?.f1Score || 0) - (a.performance?.f1Score || 0)
    );
  }

  getEnsembleWeights(): EnsembleWeight[] {
    return this.ensembleWeights;
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.dispose();
    }
    
    this.models.delete(modelId);
    this.configs.delete(modelId);
    this.performances.delete(modelId);
    
    // Remove from localStorage
    await tf.io.removeModel(`localstorage://ml-model-${modelId}`);
    localStorage.removeItem(`ml-config-${modelId}`);
    localStorage.removeItem(`ml-performance-${modelId}`);
    
    this.updateEnsembleWeights();
    await this.saveModel('');
  }

  isTrainingInProgress(): boolean {
    return this.isTraining;
  }

  getTrainedModelCount(): number {
    return this.models.size;
  }

  hasTrainedModels(): boolean {
    return this.models.size > 0;
  }

  async dispose(): Promise<void> {
    this.models.forEach(model => model.dispose());
    this.models.clear();
    this.configs.clear();
    this.performances.clear();
  }
}

// Singleton instance
export const modelManager = new ModelManager();
