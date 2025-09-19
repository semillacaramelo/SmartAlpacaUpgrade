import { performance } from "perf_hooks";
import os from "os";

import type {
  SystemMetrics,
  ApplicationMetrics,
  TradingMetrics,
} from "../../shared/metrics";

class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: {
    system: SystemMetrics;
    application: ApplicationMetrics;
    trading: TradingMetrics;
  };

  private constructor() {
    this.metrics = {
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
    };
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public collectSystemMetrics(): void {
    const cpus = os.cpus();
    const totalCPU =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + (total - idle) / total;
      }, 0) / cpus.length;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = (totalMemory - freeMemory) / totalMemory;

    this.metrics.system = {
      cpu: totalCPU * 100,
      memory: memoryUsage * 100,
      latency: performance.now(),
    };
  }

  public updateApplicationMetrics(metrics: Partial<ApplicationMetrics>): void {
    this.metrics.application = {
      ...this.metrics.application,
      ...metrics,
    };
  }

  public updateTradingMetrics(metrics: Partial<TradingMetrics>): void {
    this.metrics.trading = {
      ...this.metrics.trading,
      ...metrics,
    };
  }

  public getMetrics() {
    return this.metrics;
  }

  public startPerformanceTimer(operation: string): () => number {
    const startTime = performance.now();
    return () => performance.now() - startTime;
  }
}

export const metricsCollector = MetricsCollector.getInstance();
export type { SystemMetrics, ApplicationMetrics, TradingMetrics };
