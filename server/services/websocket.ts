import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SystemEvent {
  event: string;
  data: any;
  correlationId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendToClient(ws, {
            type: 'error',
            data: { message: 'Invalid message format' },
            timestamp: new Date().toISOString()
          });
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connection',
        data: { status: 'connected', clientId: this.generateClientId() },
        timestamp: new Date().toISOString()
      });
    });
  }

  private async handleClientMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
        break;
      
      case 'subscribe':
        // Handle subscription to specific data feeds
        this.sendToClient(ws, {
          type: 'subscribed',
          data: { channels: message.channels || ['all'] },
          timestamp: new Date().toISOString()
        });
        break;
      
      default:
        this.sendToClient(ws, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` },
          timestamp: new Date().toISOString()
        });
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  public broadcastSystemEvent(event: SystemEvent) {
    const message: WebSocketMessage = {
      type: 'system_event',
      data: event,
      timestamp: new Date().toISOString()
    };
    
    this.broadcast(message);
    
    // Log the event
    storage.createAuditLog({
      correlationId: event.correlationId,
      eventType: event.event,
      eventData: event.data,
      source: 'websocket',
      level: 'info'
    });
  }

  public broadcastPortfolioUpdate(portfolioData: any) {
    this.broadcast({
      type: 'portfolio_update',
      data: portfolioData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastPositionUpdate(positionData: any) {
    this.broadcast({
      type: 'position_update',
      data: positionData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastTradeExecution(tradeData: any) {
    this.broadcast({
      type: 'trade_executed',
      data: tradeData,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastAIPipelineUpdate(stage: string, status: string, data: any, correlationId?: string) {
    this.broadcastSystemEvent({
      event: `AI_PIPELINE_${stage.toUpperCase()}_${status.toUpperCase()}`,
      data: { stage, status, ...data },
      correlationId
    });
  }

  public broadcastSystemHealth(healthData: any) {
    this.broadcast({
      type: 'system_health',
      data: healthData,
      timestamp: new Date().toISOString()
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocketManager(server: Server) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}
