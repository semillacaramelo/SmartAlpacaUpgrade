interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

export class RetryStrategy {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 10000,
      backoffFactor: config.backoffFactor ?? 2,
      retryableStatuses: config.retryableStatuses ?? [
        408, 429, 500, 502, 503, 504,
      ],
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.initialDelay;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt === this.config.maxRetries) {
          throw new Error(
            `Operation failed after ${this.config.maxRetries} retries: ${lastError.message}`
          );
        }

        await this.delay(delay);
        delay = Math.min(
          delay * this.config.backoffFactor,
          this.config.maxDelay
        );
      }
    }

    throw lastError;
  }

  private isRetryable(error: unknown): boolean {
    if (error && typeof error === "object" && "status" in error) {
      return this.config.retryableStatuses.includes(error.status as number);
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
