import { EventEmitter } from 'events';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
  monitoringPeriodMs: number;
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  totalFailures: number;
  uptime: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalRequests = 0;
  private totalFailures = 0;
  private nextAttemptTime = 0;
  private readonly startTime = Date.now();

  constructor(private config: CircuitBreakerConfig) {
    super();
    this.setupMetricsReset();
  }

  /**
   * Execute a protected function with circuit breaker pattern
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker ${this.config.name} is OPEN. Next attempt allowed at ${new Date(this.nextAttemptTime)}`);
      }
      // Transition to HALF_OPEN for testing
      this.state = CircuitBreakerState.HALF_OPEN;
      this.emit('stateChanged', { 
        name: this.config.name, 
        oldState: CircuitBreakerState.OPEN, 
        newState: CircuitBreakerState.HALF_OPEN 
      });
    }

    this.totalRequests++;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Execute function with configurable timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker timeout: ${this.config.name} exceeded ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        this.emit('stateChanged', { 
          name: this.config.name, 
          oldState: CircuitBreakerState.HALF_OPEN, 
          newState: CircuitBreakerState.CLOSED 
        });
        this.emit('recovered', { name: this.config.name });
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Immediately return to OPEN state on any failure in HALF_OPEN
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
      this.emit('stateChanged', { 
        name: this.config.name, 
        oldState: CircuitBreakerState.HALF_OPEN, 
        newState: CircuitBreakerState.OPEN 
      });
    } else if (
      this.state === CircuitBreakerState.CLOSED && 
      this.failureCount >= this.config.failureThreshold
    ) {
      // Transition from CLOSED to OPEN
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
      this.emit('stateChanged', { 
        name: this.config.name, 
        oldState: CircuitBreakerState.CLOSED, 
        newState: CircuitBreakerState.OPEN 
      });
      this.emit('opened', { name: this.config.name, failureCount: this.failureCount });
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Health check - returns true if circuit breaker is allowing requests
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED || 
           (this.state === CircuitBreakerState.HALF_OPEN && Date.now() >= this.nextAttemptTime);
  }

  /**
   * Force reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = 0;
    this.emit('reset', { name: this.config.name });
  }

  /**
   * Setup periodic metrics reset to prevent memory leaks
   */
  private setupMetricsReset(): void {
    setInterval(() => {
      // Reset metrics periodically to prevent unbounded growth
      if (this.state === CircuitBreakerState.CLOSED && this.failureCount === 0) {
        this.successCount = Math.min(this.successCount, this.config.successThreshold * 2);
      }
    }, this.config.monitoringPeriodMs);
  }
}

/**
 * Circuit Breaker Manager for handling multiple circuit breakers
 */
export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Create or get a circuit breaker for a service
   */
  getCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      if (!config) {
        throw new Error(`Circuit breaker config required for new service: ${name}`);
      }
      
      const circuitBreaker = new CircuitBreaker(config);
      
      // Set up logging for circuit breaker events
      circuitBreaker.on('stateChanged', (event) => {
        console.log(`[CircuitBreaker] ${event.name}: ${event.oldState} → ${event.newState}`);
      });
      
      circuitBreaker.on('opened', (event) => {
        console.warn(`[CircuitBreaker] ${event.name} OPENED after ${event.failureCount} failures`);
      });
      
      circuitBreaker.on('recovered', (event) => {
        console.log(`[CircuitBreaker] ${event.name} RECOVERED`);
      });

      this.circuitBreakers.set(name, circuitBreaker);
    }
    
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    this.circuitBreakers.forEach((circuitBreaker, name) => {
      stats[name] = circuitBreaker.getStats();
    });
    
    return stats;
  }

  /**
   * Check overall system health based on circuit breakers
   */
  getSystemHealth(): { healthy: boolean; services: Record<string, boolean> } {
    const services: Record<string, boolean> = {};
    let overallHealthy = true;

    this.circuitBreakers.forEach((circuitBreaker, name) => {
      const isHealthy = circuitBreaker.isHealthy();
      services[name] = isHealthy;
      if (!isHealthy) {
        overallHealthy = false;
      }
    });

    return { healthy: overallHealthy, services };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.circuitBreakers.forEach(circuitBreaker => {
      circuitBreaker.reset();
    });
  }
}

// Singleton instance for global access
export const circuitBreakerManager = new CircuitBreakerManager();

// Default configurations for different services
export const defaultConfigs: Record<string, CircuitBreakerConfig> = {
  alpaca: {
    name: 'alpaca',
    failureThreshold: 5,
    successThreshold: 3,
    timeoutMs: 30000, // 30 seconds
    resetTimeoutMs: 60000, // 1 minute
    monitoringPeriodMs: 300000 // 5 minutes
  },
  gemini: {
    name: 'gemini',
    failureThreshold: 3,
    successThreshold: 2,
    timeoutMs: 45000, // 45 seconds
    resetTimeoutMs: 90000, // 1.5 minutes
    monitoringPeriodMs: 300000 // 5 minutes
  },
  database: {
    name: 'database',
    failureThreshold: 10,
    successThreshold: 5,
    timeoutMs: 10000, // 10 seconds
    resetTimeoutMs: 30000, // 30 seconds
    monitoringPeriodMs: 60000 // 1 minute
  },
  redis: {
    name: 'redis',
    failureThreshold: 8,
    successThreshold: 3,
    timeoutMs: 5000, // 5 seconds
    resetTimeoutMs: 15000, // 15 seconds
    monitoringPeriodMs: 60000 // 1 minute
  }
};