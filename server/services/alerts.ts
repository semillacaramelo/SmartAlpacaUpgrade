import { EventEmitter } from "events";
import { metricsCollector } from "./metrics";
import type { Metrics } from "../../shared/metrics";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: Metrics) => boolean;
  severity: "low" | "medium" | "high";
}

interface Alert {
  id: string;
  ruleName: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
  metrics: Partial<Metrics>;
}

class AlertService extends EventEmitter {
  private static instance: AlertService;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();

  private constructor() {
    super();
    this.setupDefaultRules();
    this.startMonitoring();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private setupDefaultRules() {
    this.addRule({
      id: "high-cpu",
      name: "High CPU Usage",
      description: "CPU usage exceeds 80%",
      condition: (metrics) => metrics.system.cpu > 80,
      severity: "high",
    });

    this.addRule({
      id: "high-memory",
      name: "High Memory Usage",
      description: "Memory usage exceeds 90%",
      condition: (metrics) => metrics.system.memory > 90,
      severity: "high",
    });

    this.addRule({
      id: "high-error-rate",
      name: "High Error Rate",
      description: "Error rate exceeds 5%",
      condition: (metrics) => metrics.application.errorRate > 5,
      severity: "high",
    });

    this.addRule({
      id: "high-latency",
      name: "High Latency",
      description: "Response time exceeds 1000ms",
      condition: (metrics) => metrics.application.responseTime > 1000,
      severity: "medium",
    });

    this.addRule({
      id: "trade-failures",
      name: "Trade Success Rate Drop",
      description: "Trade success rate below 95%",
      condition: (metrics) => metrics.trading.successRate < 95,
      severity: "high",
    });

    this.addRule({
      id: "high-slippage",
      name: "High Trade Slippage",
      description: "Average trade slippage exceeds 0.1%",
      condition: (metrics) => metrics.trading.slippage > 0.001,
      severity: "medium",
    });
  }

  public addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string) {
    this.rules.delete(ruleId);
  }

  private startMonitoring() {
    setInterval(() => {
      const metrics = metricsCollector.getMetrics();
      this.evaluateRules(metrics);
    }, 5000); // Check every 5 seconds
  }

  private evaluateRules(metrics: Metrics) {
    for (const rule of Array.from(this.rules.values())) {
      const isTriggered = rule.condition(metrics);

      if (isTriggered && !this.activeAlerts.has(rule.id)) {
        const alert: Alert = {
          id: rule.id,
          ruleName: rule.name,
          message: rule.description,
          severity: rule.severity,
          timestamp: new Date(),
          metrics: {
            system: { ...metrics.system },
            application: { ...metrics.application },
            trading: { ...metrics.trading },
          },
        };

        this.activeAlerts.set(rule.id, alert);
        this.emit("alert", alert);
      } else if (!isTriggered && this.activeAlerts.has(rule.id)) {
        const resolvedAlert = this.activeAlerts.get(rule.id)!;
        this.activeAlerts.delete(rule.id);
        this.emit("alertResolved", resolvedAlert);
      }
    }
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
}

export const alertService = AlertService.getInstance();
export type { Alert, AlertRule };
