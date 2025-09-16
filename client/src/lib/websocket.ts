export interface WebSocketClientOptions {
  url?: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols?: string | string[];
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectCount = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(options: WebSocketClientOptions = {}) {
    this.url = options.url || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
    this.protocols = options.protocols;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.protocols);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectCount = 0;
          this.emit('open', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit('message', message);
            this.emit(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.emit('error', { error: 'Message parse error', raw: event.data });
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.emit('close', { code: event.code, reason: event.reason });
          
          if (event.code !== 1000 && this.reconnectCount < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', { error: 'Connection error', event: error });
          reject(error);
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.emit('error', { error: 'Creation error', details: error });
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectCount++;
    console.log(`Attempting to reconnect... (${this.reconnectCount}/${this.maxReconnectAttempts})`);
    
    this.emit('reconnecting', { attempt: this.reconnectCount, maxAttempts: this.maxReconnectAttempts });

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch(() => {
        if (this.reconnectCount >= this.maxReconnectAttempts) {
          this.emit('max_reconnect_attempts', { attempts: this.reconnectCount });
        }
      });
    }, this.reconnectInterval);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send data:', data);
      this.emit('send_error', { error: 'Not connected', data });
    }
  }

  close(code?: number, reason?: string) {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close(code || 1000, reason || 'Client initiated close');
      this.ws = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.eventListeners.has(event)) return;

    if (callback) {
      const callbacks = this.eventListeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.eventListeners.set(event, []);
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for '${event}':`, error);
        }
      });
    }
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
