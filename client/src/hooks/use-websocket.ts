import { useState, useEffect, useCallback } from "react";

interface WebSocketData {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
  connectionState: "connecting" | "connected" | "disconnected" | "error";
}

export function useWebSocket(): WebSocketData {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [ws, setWs] = useState<WebSocket | null>(null);

  const sendMessage = useCallback((message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, [ws]);

  useEffect(() => {
    let websocket: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        setConnectionState("connecting");
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        websocket = new WebSocket(wsUrl);
        setWs(websocket);

        websocket.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          setConnectionState("connected");
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        websocket.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);
          setConnectionState("disconnected");
          
          // Reconectar después de 5 segundos
          reconnectTimer = setTimeout(() => {
            connect();
          }, 5000);
        };

        websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionState("error");
        };

      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setConnectionState("error");
        
        // Intentar reconectar después de 10 segundos
        reconnectTimer = setTimeout(() => {
          connect();
        }, 10000);
      }
    };

    // Intentar conectar al montar el componente
    connect();

    // Cleanup al desmontar
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connectionState,
  };
}