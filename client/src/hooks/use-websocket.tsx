import { useState, useEffect, useRef, useCallback } from "react";

declare const window: Window & {
  location: {
    protocol: string;
    host: string;
  };
};

type Timeout = ReturnType<typeof setTimeout>;

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  maxQueueSize?: number;
}

interface QueuedMessage {
  message: any;
  timestamp: number;
  attempts: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
          window.location.host
        }/ws`
      : "ws://localhost:5000/ws",
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutId = useRef<Timeout | null>(null);
  const messageQueue = useRef<QueuedMessage[]>([]);
  const maxQueueSize = options.maxQueueSize || 100;

  // Process queued messages
  const processQueue = useCallback(() => {
    if (
      ws.current?.readyState === WebSocket.OPEN &&
      messageQueue.current.length > 0
    ) {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      // Process queue, removing expired messages
      messageQueue.current = messageQueue.current.filter((item) => {
        if (now - item.timestamp > maxAge) {
          return false; // Remove expired messages
        }

        if (item.attempts >= 3) {
          return false; // Remove messages that have been attempted too many times
        }

        try {
          ws.current?.send(JSON.stringify(item.message));
          item.attempts++;
          return false; // Remove successfully sent messages
        } catch (error) {
          console.warn("Failed to send queued message:", error);
          return true; // Keep failed messages in queue
        }
      });
    }
  }, []);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectCount.current = 0;

        // Process any queued messages
        processQueue();

        // Send initial ping
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: "ping" }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle pong responses
          if (message.type === "pong") {
            console.log("WebSocket pong received");
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          reconnectCount.current < maxReconnectAttempts
        ) {
          setConnectionError(
            `Connection lost. Reconnecting... (${
              reconnectCount.current + 1
            }/${maxReconnectAttempts})`
          );
          reconnectCount.current++;

          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectCount.current >= maxReconnectAttempts) {
          setConnectionError("Failed to reconnect. Please refresh the page.");
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection error occurred");
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setConnectionError("Failed to establish connection");
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
      } catch (error) {
        console.warn("Failed to send message, queueing:", message);
        queueMessage(message);
      }
    } else {
      queueMessage(message);
    }
  }, []);

  const queueMessage = useCallback(
    (message: any) => {
      // Add message to queue if not full
      if (messageQueue.current.length < maxQueueSize) {
        messageQueue.current.push({
          message,
          timestamp: Date.now(),
          attempts: 0,
        });
      } else {
        console.warn("Message queue full, dropping oldest message");
        messageQueue.current.shift(); // Remove oldest message
        messageQueue.current.push({
          message,
          timestamp: Date.now(),
          attempts: 0,
        });
      }
    },
    [maxQueueSize]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, "User initiated disconnect");
      ws.current = null;
    }

    // Clear message queue on intentional disconnect
    messageQueue.current = [];
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  useEffect(() => {
    connect();

    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: "ping" });
      }
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval);
      disconnect();
    };
  }, [connect, disconnect, sendMessage]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage,
    disconnect,
  };
}
