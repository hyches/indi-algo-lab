// Angel One (SmartAPI) WebSocket Integration
// Note: Full implementation requires API key and secret from Angel One

export interface AngelOneCredentials {
  apiKey: string;
  clientId: string;
  pin: string;
  totpSecret?: string;
}

export interface MarketQuote {
  symbol: string;
  token: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  bid: number;
  ask: number;
  bidQty: number;
  askQty: number;
  oi?: number;
}

export interface WebSocketMessage {
  type: 'QUOTE' | 'DEPTH' | 'INDEX' | 'OI' | 'ERROR';
  data: any;
}

type MessageHandler = (quote: MarketQuote) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'error' | 'reconnecting') => void;

// Angel One WebSocket - Mock functionality removed
class AngelOneWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private statusHandlers: StatusHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribedSymbols: Set<string> = new Set();
  
  // Symbol token mapping for NSE
  private static TOKEN_MAP: Record<string, string> = {
    'NIFTY': '26000',
    'BANKNIFTY': '26009',
    'RELIANCE': '2885',
    'TCS': '11536',
    'HDFCBANK': '1333',
    'INFY': '1594',
    'ICICIBANK': '4963',
    'SBIN': '3045',
    'HDFC': '1330',
    'KOTAKBANK': '1922',
    'LT': '11483',
    'ITC': '1660',
    'AXISBANK': '5900',
    'BAJFINANCE': '317',
    'MARUTI': '10999',
  };
  
  async connect(credentials?: AngelOneCredentials): Promise<void> {
    // Mock mode removed - only real connection supported
    console.log('Mock data removed. Please implement real Angel One WebSocket connection.');
    this.notifyStatus('error');
    return;
    
    // Real Angel One WebSocket connection
    // Would need to authenticate first and get JWT token
    try {
      const wsUrl = 'wss://smartapisocket.angelone.in/smart-stream';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Angel One WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
        
        // Resubscribe to symbols
        this.subscribedSymbols.forEach(symbol => {
          this.sendSubscription(symbol);
        });
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyStatus('error');
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.notifyStatus('disconnected');
        this.attemptReconnect(credentials);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.notifyStatus('error');
    }
  }
  
  private handleMessage(data: any): void {
    try {
      const message: WebSocketMessage = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (message.type === 'QUOTE') {
        const quote = this.parseQuote(message.data);
        if (quote) {
          this.notifyQuote(quote.symbol, quote);
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
  
  private parseQuote(data: any): MarketQuote | null {
    // Parse Angel One quote format
    return {
      symbol: data.tk || data.symbol,
      token: data.tk,
      ltp: parseFloat(data.lp),
      open: parseFloat(data.op),
      high: parseFloat(data.hp),
      low: parseFloat(data.lop),
      close: parseFloat(data.c),
      volume: parseInt(data.v),
      change: parseFloat(data.cng),
      changePercent: parseFloat(data.nc),
      timestamp: new Date(data.ft * 1000),
      bid: parseFloat(data.bp1),
      ask: parseFloat(data.sp1),
      bidQty: parseInt(data.bq1),
      askQty: parseInt(data.sq1),
      oi: data.oi ? parseInt(data.oi) : undefined,
    };
  }
  
  private sendSubscription(symbol: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const token = AngelOneWebSocket.TOKEN_MAP[symbol];
    if (!token) return;
    
    const subscribeMsg = {
      correlationID: `sub_${symbol}_${Date.now()}`,
      action: 1, // Subscribe
      params: {
        mode: 3, // SnapQuote mode
        tokenList: [{ exchangeType: 1, tokens: [token] }], // 1 = NSE
      },
    };
    
    this.ws.send(JSON.stringify(subscribeMsg));
  }
  
  subscribe(symbol: string, handler: MessageHandler): () => void {
    this.subscribedSymbols.add(symbol);
    
    if (!this.messageHandlers.has(symbol)) {
      this.messageHandlers.set(symbol, []);
    }
    this.messageHandlers.get(symbol)!.push(handler);
    
    // If connected, subscribe immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbol);
    }
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(symbol);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.subscribedSymbols.delete(symbol);
        }
      }
    };
  }
  
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }
  
  private notifyQuote(symbol: string, quote: MarketQuote): void {
    const handlers = this.messageHandlers.get(symbol);
    if (handlers) {
      handlers.forEach(handler => handler(quote));
    }
  }
  
  private notifyStatus(status: 'connected' | 'disconnected' | 'error' | 'reconnecting'): void {
    this.statusHandlers.forEach(handler => handler(status));
  }
  
  private attemptReconnect(credentials?: AngelOneCredentials): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    this.notifyStatus('reconnecting');
    
    setTimeout(() => {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.connect(credentials);
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.notifyStatus('disconnected');
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const angelOneWS = new AngelOneWebSocket();
