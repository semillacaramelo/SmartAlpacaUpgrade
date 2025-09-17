import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
  lazyConnect: true
});

// Queue names
export const QUEUE_NAMES = {
  MARKET_SCAN: 'market-scan',
  ASSET_SELECTION: 'asset-selection',
  STRATEGY_GENERATION: 'strategy-generation',
  VALIDATION: 'validation',
  STAGING: 'staging',
  EXECUTION: 'execution'
} as const;

// Job data interfaces
export interface MarketScanJobData {
  correlationId: string;
  symbols?: string[];
}

export interface AssetSelectionJobData {
  correlationId: string;
  marketAnalysis: any;
}

export interface StrategyGenerationJobData {
  correlationId: string;
  selectedAssets: any[];
}

export interface ValidationJobData {
  correlationId: string;
  strategies: any[];
}

export interface StagingJobData {
  correlationId: string;
  validatedStrategies: any[];
}

export interface ExecutionJobData {
  correlationId: string;
  stagedStrategies: any[];
}

// Main trading queue
export const tradingQueue = new Queue('smart-alpaca-trading', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Helper functions for job management
export class QueueManager {
  static async addMarketScanJob(data: MarketScanJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.MARKET_SCAN, data, {
      priority: 10,
      delay: 0
    });
  }

  static async addAssetSelectionJob(data: AssetSelectionJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.ASSET_SELECTION, data, {
      priority: 9,
      delay: 1000 // Small delay to ensure market scan completes
    });
  }

  static async addStrategyGenerationJob(data: StrategyGenerationJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.STRATEGY_GENERATION, data, {
      priority: 8,
      delay: 2000
    });
  }

  static async addValidationJob(data: ValidationJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.VALIDATION, data, {
      priority: 7,
      delay: 3000
    });
  }

  static async addStagingJob(data: StagingJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.STAGING, data, {
      priority: 6,
      delay: 4000
    });
  }

  static async addExecutionJob(data: ExecutionJobData): Promise<Job> {
    return await tradingQueue.add(QUEUE_NAMES.EXECUTION, data, {
      priority: 5,
      delay: 5000
    });
  }

  static async getJobStatus(jobId: string): Promise<any> {
    const job = await tradingQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      state: await job.getState()
    };
  }

  static async getActiveJobs(): Promise<Job[]> {
    return await tradingQueue.getActive();
  }

  static async getWaitingJobs(): Promise<Job[]> {
    return await tradingQueue.getWaiting();
  }

  static async getCompletedJobs(limit: number = 10): Promise<Job[]> {
    return await tradingQueue.getCompleted(0, limit);
  }

  static async getFailedJobs(limit: number = 10): Promise<Job[]> {
    return await tradingQueue.getFailed(0, limit);
  }

  static async cleanOldJobs(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    // Clean jobs older than grace period (default 24 hours)
    await tradingQueue.clean(grace, 100, 'completed');
    await tradingQueue.clean(grace, 100, 'failed');
  }

  static async pauseQueue(): Promise<void> {
    await tradingQueue.pause();
  }

  static async resumeQueue(): Promise<void> {
    await tradingQueue.resume();
  }

  static async getQueueStats(): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      tradingQueue.getWaiting(),
      tradingQueue.getActive(),
      tradingQueue.getCompleted(),
      tradingQueue.getFailed(),
      tradingQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  static async close(): Promise<void> {
    await tradingQueue.close();
    await redisConnection.quit();
  }
}

// Health check for Redis connection
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redisConnection.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Export Redis client for pub/sub if needed
export { redisConnection as redisClient };
