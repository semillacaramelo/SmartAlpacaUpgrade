/**
 * API Health Monitoring Service
 * Monitors external API health, tracks performance metrics, and provides alerting
 */

import { EventEmitter } from 'events';

export interface HealthCheckConfig {
  name: string;
  url?: string;
  checkIntervalMs: number;
  timeoutMs: number;
  healthCheck: () => Promise<HealthStatus>;
  alertThreshold: {
    errorRate: number; // Percentage (0-100)
    responseTime: number; // Milliseconds
    consecutiveFailures: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  errorRate: number;
  consecutiveFailures: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  uptime: number;
}

export interface AlertEvent {
  serviceName: string;
  alertType: 'high_error_rate' | 'slow_response' | 'consecutive_failures' | 'service_down';
  severity: 'warning' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
  timestamp: Date;
}

/**
 * Health monitor for a single service
 */
export class ServiceHealthMonitor extends EventEmitter {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    errorRate: 0,
    consecutiveFailures: 0,
    uptime: 0
  };

  private checkInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private lastStatus: HealthStatus = { status: 'healthy', responseTime: 0 };

  constructor(private config: HealthCheckConfig) {
    super();
    this.startMonitoring();
  }

  /**
   * Start health monitoring
   */
  private startMonitoring(): void {
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkIntervalMs);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Perform health check with timeout
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Execute health check with timeout
      const status = await Promise.race([
        this.config.healthCheck(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeoutMs)
        )
      ]);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      this.lastStatus = status;

      // Check for alerts
      this.checkAlerts(status);

      this.emit('healthCheck', {
        serviceName: this.config.name,
        status,
        metrics: this.getMetrics()
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateMetrics(false, responseTime);
      this.lastStatus = errorStatus;

      // Check for alerts
      this.checkAlerts(errorStatus);

      this.emit('healthCheck', {
        serviceName: this.config.name,
        status: errorStatus,
        metrics: this.getMetrics()
      });
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;
    this.metrics.uptime = Date.now() - this.startTime;

    if (success) {
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccess = new Date();
    } else {
      this.metrics.errorCount++;
      this.metrics.consecutiveFailures++;
      this.metrics.lastFailure = new Date();
    }

    this.metrics.errorRate = (this.metrics.errorCount / this.metrics.requestCount) * 100;
  }

  /**
   * Check if alerts should be triggered
   */
  private checkAlerts(status: HealthStatus): void {
    const alerts: AlertEvent[] = [];

    // High error rate alert
    if (this.metrics.errorRate > this.config.alertThreshold.errorRate && this.metrics.requestCount >= 10) {
      alerts.push({
        serviceName: this.config.name,
        alertType: 'high_error_rate',
        severity: this.metrics.errorRate > 50 ? 'critical' : 'warning',
        message: `High error rate: ${this.metrics.errorRate.toFixed(2)}% (threshold: ${this.config.alertThreshold.errorRate}%)`,
        metrics: { ...this.metrics },
        timestamp: new Date()
      });
    }

    // Slow response alert
    if (status.responseTime > this.config.alertThreshold.responseTime) {
      alerts.push({
        serviceName: this.config.name,
        alertType: 'slow_response',
        severity: status.responseTime > this.config.alertThreshold.responseTime * 2 ? 'critical' : 'warning',
        message: `Slow response time: ${status.responseTime}ms (threshold: ${this.config.alertThreshold.responseTime}ms)`,
        metrics: { ...this.metrics },
        timestamp: new Date()
      });
    }

    // Consecutive failures alert
    if (this.metrics.consecutiveFailures >= this.config.alertThreshold.consecutiveFailures) {
      alerts.push({
        serviceName: this.config.name,
        alertType: 'consecutive_failures',
        severity: 'critical',
        message: `${this.metrics.consecutiveFailures} consecutive failures`,
        metrics: { ...this.metrics },
        timestamp: new Date()
      });
    }

    // Service down alert
    if (status.status === 'unhealthy') {
      alerts.push({
        serviceName: this.config.name,
        alertType: 'service_down',
        severity: 'critical',
        message: `Service is unhealthy: ${status.error || 'Unknown error'}`,
        metrics: { ...this.metrics },
        timestamp: new Date()
      });
    }

    // Emit alerts
    alerts.forEach(alert => this.emit('alert', alert));
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get last health status
   */
  getLastStatus(): HealthStatus {
    return { ...this.lastStatus };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      errorRate: 0,
      consecutiveFailures: 0,
      uptime: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }
}

/**
 * Central API Health Monitoring Manager
 */
export class APIHealthMonitor extends EventEmitter {
  private monitors = new Map<string, ServiceHealthMonitor>();
  private alertHistory: AlertEvent[] = [];
  private readonly maxAlertHistory = 1000;

  /**
   * Add a service to monitor
   */
  addService(config: HealthCheckConfig): void {
    if (this.monitors.has(config.name)) {
      throw new Error(`Service ${config.name} is already being monitored`);
    }

    const monitor = new ServiceHealthMonitor(config);
    
    // Forward events
    monitor.on('healthCheck', (event) => this.emit('healthCheck', event));
    monitor.on('alert', (alert) => this.handleAlert(alert));

    this.monitors.set(config.name, monitor);
    console.log(`[APIHealthMonitor] Started monitoring service: ${config.name}`);
  }

  /**
   * Remove a service from monitoring
   */
  removeService(serviceName: string): boolean {
    const monitor = this.monitors.get(serviceName);
    if (monitor) {
      monitor.stop();
      this.monitors.delete(serviceName);
      console.log(`[APIHealthMonitor] Stopped monitoring service: ${serviceName}`);
      return true;
    }
    return false;
  }

  /**
   * Get all service statuses
   */
  getAllStatuses(): Record<string, { status: HealthStatus; metrics: PerformanceMetrics }> {
    const statuses: Record<string, { status: HealthStatus; metrics: PerformanceMetrics }> = {};
    
    this.monitors.forEach((monitor, serviceName) => {
      statuses[serviceName] = {
        status: monitor.getLastStatus(),
        metrics: monitor.getMetrics()
      };
    });

    return statuses;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): { 
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    summary: {
      totalServices: number;
      healthyServices: number;
      degradedServices: number;
      unhealthyServices: number;
    }
  } {
    const services: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    this.monitors.forEach((monitor, serviceName) => {
      const status = monitor.getLastStatus().status;
      services[serviceName] = status;
      
      switch (status) {
        case 'healthy': healthyCount++; break;
        case 'degraded': degradedCount++; break;
        case 'unhealthy': unhealthyCount++; break;
      }
    });

    const totalServices = this.monitors.size;
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (unhealthyCount > 0) {
      overall = unhealthyCount > totalServices / 2 ? 'unhealthy' : 'degraded';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      summary: {
        totalServices,
        healthyServices: healthyCount,
        degradedServices: degradedCount,
        unhealthyServices: unhealthyCount
      }
    };
  }

  /**
   * Handle alert events
   */
  private handleAlert(alert: AlertEvent): void {
    // Add to alert history
    this.alertHistory.unshift(alert);
    
    // Trim alert history if too long
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory);
    }

    // Log alert
    console.warn(`[APIHealthMonitor] ALERT [${alert.severity.toUpperCase()}] ${alert.serviceName}: ${alert.message}`);

    // Forward alert event
    this.emit('alert', alert);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 50): AlertEvent[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    this.monitors.forEach(monitor => monitor.stop());
    this.monitors.clear();
  }
}

// Singleton instance
export const apiHealthMonitor = new APIHealthMonitor();

// Default health check configurations
export const createDefaultHealthChecks = () => {
  // Alpaca API health check
  apiHealthMonitor.addService({
    name: 'alpaca',
    checkIntervalMs: 60000, // Check every minute
    timeoutMs: 30000, // 30 second timeout
    healthCheck: async () => {
      try {
        // Simple connectivity check - this would need the actual alpaca service
        const start = Date.now();
        // For now, just simulate a check
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          status: 'healthy',
          responseTime: Date.now() - start,
          metadata: { endpoint: 'account' }
        };
      } catch (error) {
        throw error;
      }
    },
    alertThreshold: {
      errorRate: 10, // 10% error rate
      responseTime: 5000, // 5 seconds
      consecutiveFailures: 3
    }
  });

  // Gemini API health check  
  apiHealthMonitor.addService({
    name: 'gemini',
    checkIntervalMs: 120000, // Check every 2 minutes
    timeoutMs: 45000, // 45 second timeout
    healthCheck: async () => {
      try {
        const start = Date.now();
        // Simulate Gemini API check
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          status: 'healthy',
          responseTime: Date.now() - start,
          metadata: { model: 'gemini-2.0-flash' }
        };
      } catch (error) {
        throw error;
      }
    },
    alertThreshold: {
      errorRate: 15, // 15% error rate (AI services can be less reliable)
      responseTime: 10000, // 10 seconds
      consecutiveFailures: 2
    }
  });

  // Database health check
  apiHealthMonitor.addService({
    name: 'database',
    checkIntervalMs: 30000, // Check every 30 seconds
    timeoutMs: 10000, // 10 second timeout
    healthCheck: async () => {
      try {
        const start = Date.now();
        // Simulate database check
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          status: 'healthy',
          responseTime: Date.now() - start,
          metadata: { connections: 10 }
        };
      } catch (error) {
        throw error;
      }
    },
    alertThreshold: {
      errorRate: 5, // 5% error rate for database
      responseTime: 2000, // 2 seconds
      consecutiveFailures: 2
    }
  });

  console.log('[APIHealthMonitor] Initialized default health checks for all services');
};