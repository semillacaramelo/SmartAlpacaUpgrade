import { useState, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import type { Metrics, HistoricalMetric } from "../../../shared/metrics";

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    system: {
      cpu: 0,
      memory: 0,
      latency: 0,
    },
    application: {
      requestRate: 0,
      errorRate: 0,
      responseTime: 0,
    },
    trading: {
      executionTime: 0,
      slippage: 0,
      successRate: 0,
    },
  });

  const [historicalMetrics, setHistoricalMetrics] = useState<
    HistoricalMetric[]
  >([]);
  const { isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !lastMessage) return;

    // Check if the message is metrics data
    if (lastMessage.type === "metrics") {
      const data = lastMessage.data as Metrics;
      setMetrics(data);
      setHistoricalMetrics((prev) =>
        [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            cpu: data.system.cpu,
            memory: data.system.memory,
            responseTime: data.application.responseTime,
          },
        ].slice(-60)
      ); // Keep last 60 data points
    }
  }, [isConnected, lastMessage]);

  return { metrics, historicalMetrics };
}
