export interface SystemMetrics {
  cpu: number;
  memory: number;
  latency: number;
}

export interface ApplicationMetrics {
  requestRate: number;
  errorRate: number;
  responseTime: number;
}

export interface TradingMetrics {
  executionTime: number;
  slippage: number;
  successRate: number;
}

export interface Metrics {
  system: SystemMetrics;
  application: ApplicationMetrics;
  trading: TradingMetrics;
}

export interface HistoricalMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
}
