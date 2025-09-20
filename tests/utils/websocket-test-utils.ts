import { Server } from "mock-socket";
import { waitFor } from "./test-utils";

export class MockWebSocketServer {
  private server: Server;
  private connectedClients: Set<WebSocket>;

  constructor(url: string) {
    this.server = new Server(url);
    this.connectedClients = new Set();

    this.server.on("connection", (socket) => {
      this.connectedClients.add(socket as unknown as WebSocket);

      socket.on("message", (data: string | ArrayBuffer | ArrayBufferView | Blob) => {
        const stringData = typeof data === 'string' ? data : data.toString();
        this.handleMessage(stringData);
      });

      socket.on("close", () => {
        this.connectedClients.delete(socket as unknown as WebSocket);
      });
    });
  }

  public close() {
    this.server.close();
    this.connectedClients.clear();
  }

  public broadcast(data: any) {
    const message = typeof data === "string" ? data : JSON.stringify(data);
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      // Handle different message types
      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(message);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(message);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  private handleSubscribe(message: { channels?: string[] }) {
    if (message.channels) {
      // Simulate subscription confirmation
      this.broadcast({
        type: "subscription",
        channels: message.channels,
        status: "subscribed",
      });
    }
  }

  private handleUnsubscribe(message: { channels?: string[] }) {
    if (message.channels) {
      // Simulate unsubscription confirmation
      this.broadcast({
        type: "subscription",
        channels: message.channels,
        status: "unsubscribed",
      });
    }
  }

  // Helper method to simulate market data updates
  public sendMarketData(symbol: string, price: number) {
    this.broadcast({
      type: "market_data",
      symbol,
      price,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method to simulate trade updates
  public sendTradeUpdate(trade: any) {
    this.broadcast({
      type: "trade_update",
      ...trade,
    });
  }

  // Helper method to simulate connection issues
  public simulateDisconnect() {
    this.server.close();
  }

  // Helper method to simulate reconnection
  public simulateReconnect() {
    // Note: mock-socket doesn't have restart method
    // For testing purposes, we'll just note that reconnection would happen
    console.log("Simulating WebSocket reconnection");
  }
}

// Helper function to create a mock WebSocket connection
export const createMockWebSocketConnection = async (url: string) => {
  const mockServer = new MockWebSocketServer(url);
  await waitFor(100); // Give time for server to start
  return mockServer;
};
