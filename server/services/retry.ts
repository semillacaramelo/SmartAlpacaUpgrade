/**
 * Enhanced retry logic with exponential backoff, jitter, and dead letter queue
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterEnabled: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onFailure?: (attempts: number, lastError: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalDelayMs: number;
}

export interface DeadLetterItem {
  id: string;
  operationName: string;
  payload: any;
  originalError: any;
  attempts: number;
  timestamp: Date;
  scheduledRetry?: Date;
}

/**
 * Dead Letter Queue for failed operations
 */
export class DeadLetterQueue {
  private items = new Map<string, DeadLetterItem>();
  private retryScheduler?: NodeJS.Timeout;

  constructor(private config: { 
    maxItems: number; 
    retryIntervalMs: number;
    onRetryFromDLQ?: (item: DeadLetterItem) => Promise<boolean>;
  }) {
    this.setupRetryScheduler();
  }

  /**
   * Add failed operation to dead letter queue
   */
  addItem(item: Omit<DeadLetterItem, 'id' | 'timestamp'>): string {
    const id = `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Remove oldest items if queue is full
    if (this.items.size >= this.config.maxItems) {
      const oldestKey = Array.from(this.items.keys())[0];
      this.items.delete(oldestKey);
    }

    const deadLetterItem: DeadLetterItem = {
      id,
      timestamp: new Date(),
      ...item
    };

    this.items.set(id, deadLetterItem);
    console.warn(`[DeadLetterQueue] Added operation ${item.operationName} to DLQ after ${item.attempts} attempts`);
    
    return id;
  }

  /**
   * Get all items in dead letter queue
   */
  getItems(): DeadLetterItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Remove item from dead letter queue
   */
  removeItem(id: string): boolean {
    return this.items.delete(id);
  }

  /**
   * Clear all items from dead letter queue
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Get queue statistics
   */
  getStats(): { totalItems: number; oldestItem?: Date; newestItem?: Date } {
    const items = Array.from(this.items.values());
    return {
      totalItems: items.length,
      oldestItem: items.length > 0 ? new Date(Math.min(...items.map(i => i.timestamp.getTime()))) : undefined,
      newestItem: items.length > 0 ? new Date(Math.max(...items.map(i => i.timestamp.getTime()))) : undefined
    };
  }

  /**
   * Setup automatic retry scheduler for DLQ items
   */
  private setupRetryScheduler(): void {
    this.retryScheduler = setInterval(async () => {
      const now = new Date();
      const itemsToRetry = Array.from(this.items.values()).filter(item => 
        item.scheduledRetry && item.scheduledRetry <= now
      );

      for (const item of itemsToRetry) {
        if (this.config.onRetryFromDLQ) {
          try {
            const success = await this.config.onRetryFromDLQ(item);
            if (success) {
              this.removeItem(item.id);
              console.log(`[DeadLetterQueue] Successfully retried operation ${item.operationName} from DLQ`);
            } else {
              // Schedule next retry
              item.scheduledRetry = new Date(now.getTime() + this.config.retryIntervalMs);
            }
          } catch (error) {
            console.error(`[DeadLetterQueue] Failed to retry operation ${item.operationName} from DLQ:`, error);
            item.scheduledRetry = new Date(now.getTime() + this.config.retryIntervalMs);
          }
        }
      }
    }, this.config.retryIntervalMs);
  }

  /**
   * Cleanup scheduler on destruction
   */
  destroy(): void {
    if (this.retryScheduler) {
      clearInterval(this.retryScheduler);
    }
  }
}

/**
 * Enhanced retry service with exponential backoff and jitter
 */
export class RetryService {
  private deadLetterQueue: DeadLetterQueue;

  constructor(dlqConfig?: { 
    maxItems?: number; 
    retryIntervalMs?: number;
    onRetryFromDLQ?: (item: DeadLetterItem) => Promise<boolean>;
  }) {
    this.deadLetterQueue = new DeadLetterQueue({
      maxItems: dlqConfig?.maxItems || 1000,
      retryIntervalMs: dlqConfig?.retryIntervalMs || 300000, // 5 minutes
      onRetryFromDLQ: dlqConfig?.onRetryFromDLQ
    });
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationName?: string
  ): Promise<RetryResult<T>> {
    let lastError: any;
    let totalDelayMs = 0;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt,
          totalDelayMs
        };
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (config.retryCondition && !config.retryCondition(error)) {
          console.log(`[RetryService] Non-retryable error for ${operationName}, stopping retries`);
          break;
        }

        // Notify retry callback
        if (config.onRetry) {
          config.onRetry(attempt, error);
        }

        // If this is the last attempt, don't wait
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        totalDelayMs += delay;

        console.log(`[RetryService] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms. Error: ${error instanceof Error ? error.message : String(error)}`);
        await this.sleep(delay);
      }
    }

    // All retries failed - add to dead letter queue if operation name provided
    if (operationName) {
      this.deadLetterQueue.addItem({
        operationName,
        payload: {}, // Could be enhanced to capture operation parameters
        originalError: lastError,
        attempts: config.maxAttempts,
        scheduledRetry: new Date(Date.now() + 3600000) // Retry from DLQ after 1 hour
      });
    }

    // Notify failure callback
    if (config.onFailure) {
      config.onFailure(config.maxAttempts, lastError);
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalDelayMs
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (exponentialBase ^ (attempt - 1))
    let delay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt - 1);

    // Apply maximum delay cap
    delay = Math.min(delay, config.maxDelayMs);

    // Add jitter to prevent thundering herd
    if (config.jitterEnabled) {
      // Add ±25% jitter
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = delay + jitter;
    }

    return Math.round(Math.max(delay, 0));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get dead letter queue instance
   */
  getDeadLetterQueue(): DeadLetterQueue {
    return this.deadLetterQueue;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.deadLetterQueue.destroy();
  }
}

/**
 * Default retry configurations for different operation types
 */
export const defaultRetryConfigs: Record<string, RetryConfig> = {
  // External API calls (aggressive retry)
  externalAPI: {
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    exponentialBase: 2,
    jitterEnabled: true,
    retryCondition: (error: any) => {
      // Don't retry on 4xx errors (client errors), but retry on 5xx (server errors)
      const status = error.status || error.statusCode;
      return !status || status >= 500 || status === 429; // Retry on server errors and rate limits
    }
  },

  // Database operations (moderate retry)
  database: {
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    exponentialBase: 2,
    jitterEnabled: true,
    retryCondition: (error: any) => {
      // Retry on connection errors, timeouts, but not on constraint violations
      const message = error.message?.toLowerCase() || '';
      return message.includes('connection') || 
             message.includes('timeout') || 
             message.includes('network') ||
             error.code === 'ECONNRESET';
    }
  },

  // Critical trading operations (limited retry)
  trading: {
    maxAttempts: 2,
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    exponentialBase: 2,
    jitterEnabled: false, // No jitter for trading to ensure predictable timing
    retryCondition: (error: any) => {
      // Only retry on network/connection errors, not on business logic errors
      const message = error.message?.toLowerCase() || '';
      return message.includes('network') || 
             message.includes('connection') || 
             message.includes('timeout');
    }
  },

  // Background jobs (lenient retry)
  backgroundJob: {
    maxAttempts: 10,
    baseDelayMs: 2000,
    maxDelayMs: 300000, // 5 minutes max
    exponentialBase: 1.5,
    jitterEnabled: true
  }
};

// Singleton instance for global access
export const retryService = new RetryService({
  maxItems: 1000,
  retryIntervalMs: 300000, // 5 minutes
  onRetryFromDLQ: async (item: DeadLetterItem) => {
    console.log(`[RetryService] Attempting to retry ${item.operationName} from DLQ`);
    // This would need to be implemented based on specific operation types
    // For now, just log and return false to keep in DLQ
    return false;
  }
});