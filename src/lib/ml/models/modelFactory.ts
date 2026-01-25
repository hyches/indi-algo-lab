// Model Factory - Creates different ML architectures
import * as tf from '@tensorflow/tfjs';
import { ModelConfig, ModelType, DEFAULT_CONFIGS } from './modelTypes';

export class ModelFactory {
  static createModel(config: ModelConfig): tf.LayersModel {
    switch (config.type) {
      case 'dense_nn':
        return this.createDenseNN(config);
      case 'lstm':
        return this.createLSTM(config);
      case 'gru':
        return this.createGRU(config);
      case 'transformer':
        return this.createTransformer(config);
      case 'cnn_1d':
        return this.createCNN1D(config);
      default:
        return this.createDenseNN(config);
    }
  }

  private static createDenseNN(config: ModelConfig): tf.LayersModel {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: config.hiddenLayers[0],
      activation: 'relu',
      inputShape: [config.inputShape],
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
      kernelInitializer: 'heNormal',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: config.dropout }));

    // Hidden layers
    for (let i = 1; i < config.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: config.hiddenLayers[i],
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        kernelInitializer: 'heNormal',
      }));
      model.add(tf.layers.batchNormalization());
      model.add(tf.layers.dropout({ rate: config.dropout * (1 - i * 0.1) }));
    }

    // Output layer (5 classes: strong_sell, sell, hold, buy, strong_buy)
    model.add(tf.layers.dense({
      units: 5,
      activation: 'softmax',
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private static createLSTM(config: ModelConfig): tf.LayersModel {
    const model = tf.sequential();
    const seqLen = config.sequenceLength || 30;

    // First LSTM layer with return sequences
    model.add(tf.layers.lstm({
      units: config.hiddenLayers[0],
      returnSequences: config.hiddenLayers.length > 1,
      inputShape: [seqLen, config.inputShape],
      kernelInitializer: 'glorotUniform',
      recurrentInitializer: 'orthogonal',
    }));
    model.add(tf.layers.dropout({ rate: config.dropout }));

    // Additional LSTM layers
    for (let i = 1; i < config.hiddenLayers.length; i++) {
      model.add(tf.layers.lstm({
        units: config.hiddenLayers[i],
        returnSequences: i < config.hiddenLayers.length - 1,
      }));
      model.add(tf.layers.dropout({ rate: config.dropout }));
    }

    // Dense layers before output
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));
    model.add(tf.layers.dropout({ rate: config.dropout / 2 }));

    // Output layer
    model.add(tf.layers.dense({
      units: 5,
      activation: 'softmax',
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private static createGRU(config: ModelConfig): tf.LayersModel {
    const model = tf.sequential();
    const seqLen = config.sequenceLength || 30;

    // First GRU layer
    model.add(tf.layers.gru({
      units: config.hiddenLayers[0],
      returnSequences: config.hiddenLayers.length > 1,
      inputShape: [seqLen, config.inputShape],
      kernelInitializer: 'glorotUniform',
      recurrentInitializer: 'orthogonal',
    }));
    model.add(tf.layers.dropout({ rate: config.dropout }));

    // Additional GRU layers
    for (let i = 1; i < config.hiddenLayers.length; i++) {
      model.add(tf.layers.gru({
        units: config.hiddenLayers[i],
        returnSequences: i < config.hiddenLayers.length - 1,
      }));
      model.add(tf.layers.dropout({ rate: config.dropout }));
    }

    // Dense output
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));
    model.add(tf.layers.dense({
      units: 5,
      activation: 'softmax',
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private static createTransformer(config: ModelConfig): tf.LayersModel {
    const seqLen = config.sequenceLength || 30;
    const dModel = 64;
    const numHeads = 4;
    const dff = 128;

    // Input
    const inputs = tf.input({ shape: [seqLen, config.inputShape] });
    
    // Positional encoding (simplified - just learned embeddings)
    const positionEmbedding = tf.layers.dense({
      units: dModel,
      activation: 'linear',
    }).apply(inputs) as tf.SymbolicTensor;

    // Self-attention approximation using dense layers
    // (Full multi-head attention requires custom layer, using simplified version)
    const query = tf.layers.dense({ units: dModel }).apply(positionEmbedding) as tf.SymbolicTensor;
    const key = tf.layers.dense({ units: dModel }).apply(positionEmbedding) as tf.SymbolicTensor;
    const value = tf.layers.dense({ units: dModel }).apply(positionEmbedding) as tf.SymbolicTensor;
    
    // Simplified attention using dense layers (dot-product attention approximation)
    const queryKey = tf.layers.dot({ axes: -1, normalize: true }).apply([query, key]) as tf.SymbolicTensor;
    const attentionWeights = tf.layers.activation({ activation: 'softmax' }).apply(queryKey) as tf.SymbolicTensor;
    const attentionOutput = tf.layers.dot({ axes: [2, 1] }).apply([attentionWeights, value]) as tf.SymbolicTensor;
    
    // Add & Norm
    const addNorm1 = tf.layers.add().apply([positionEmbedding, attentionOutput]) as tf.SymbolicTensor;
    const norm1 = tf.layers.layerNormalization().apply(addNorm1) as tf.SymbolicTensor;
    
    // Feed-forward network
    const ffn1 = tf.layers.dense({ units: dff, activation: 'relu' }).apply(norm1) as tf.SymbolicTensor;
    const ffn2 = tf.layers.dense({ units: dModel }).apply(ffn1) as tf.SymbolicTensor;
    
    // Add & Norm
    const addNorm2 = tf.layers.add().apply([norm1, ffn2]) as tf.SymbolicTensor;
    const norm2 = tf.layers.layerNormalization().apply(addNorm2) as tf.SymbolicTensor;
    
    // Global average pooling
    const pooled = tf.layers.globalAveragePooling1d().apply(norm2) as tf.SymbolicTensor;
    
    // Output layers
    const dense1 = tf.layers.dense({ units: 32, activation: 'relu' }).apply(pooled) as tf.SymbolicTensor;
    const dropout = tf.layers.dropout({ rate: config.dropout }).apply(dense1) as tf.SymbolicTensor;
    const outputs = tf.layers.dense({ units: 5, activation: 'softmax' }).apply(dropout) as tf.SymbolicTensor;

    const model = tf.model({ inputs, outputs });

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  private static createCNN1D(config: ModelConfig): tf.LayersModel {
    const model = tf.sequential();
    const seqLen = config.sequenceLength || 30;

    // First Conv layer
    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      inputShape: [seqLen, config.inputShape],
      padding: 'same',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    // Second Conv layer
    model.add(tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same',
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));

    // Third Conv layer
    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same',
    }));
    model.add(tf.layers.globalAveragePooling1d());

    // Dense layers
    model.add(tf.layers.dense({
      units: config.hiddenLayers[0] || 64,
      activation: 'relu',
    }));
    model.add(tf.layers.dropout({ rate: config.dropout }));

    model.add(tf.layers.dense({
      units: 5,
      activation: 'softmax',
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  static getDefaultConfig(type: ModelType, inputShape: number): ModelConfig {
    return {
      ...DEFAULT_CONFIGS[type],
      inputShape,
    };
  }
}
