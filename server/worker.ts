import { Worker, Job } from 'bullmq';
import { tradingQueue, QUEUE_NAMES, QueueManager, redisClient } from './lib/queue';
import { storage } from './storage';
import { tradingService } from './services/trading';
import { analyzeMarket, selectAssets, generateTradingStrategy } from './services/gemini';
import { wsManager } from './services/websocket';
import { v4 as uuidv4 } from 'uuid';

// Redis Pub/Sub channel for system events
const SYSTEM_EVENTS_CHANNEL = 'system-events';

// Helper function to publish events to Redis
async function publishSystemEvent(eventType: string, correlationId: string, data: any) {
  try {
    const eventMessage = JSON.stringify({
      correlationId,
      event_type: eventType,
      data,
      timestamp: new Date().toISOString()
    });

    await redisClient.publish(SYSTEM_EVENTS_CHANNEL, eventMessage);
    console.log(`[${correlationId}] Published ${eventType} to Redis`);
  } catch (error) {
    console.error(`[${correlationId}] Failed to publish ${eventType} to Redis:`, error);
  }
}

// Worker instance
let worker: Worker;

// Job processors for each stage of the AI pipeline
const jobProcessors = {
  [QUEUE_NAMES.MARKET_SCAN]: async (job: Job) => {
    const { correlationId, symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'] } = job.data;

    try {
      console.log(`[${correlationId}] Starting market scan for symbols:`, symbols);

      // Broadcast pipeline start
      wsManager?.broadcastAIPipelineUpdate('market_scan', 'started', {}, correlationId);

      // Get market data
      const marketData = await tradingService.getMarketData(symbols);

      // Analyze market with AI
      const marketAnalysis = await analyzeMarket(marketData);

      // Store decision in database
      await storage.createAiDecision({
        correlationId,
        stage: 'market_scan',
        input: { symbols, marketData },
        output: marketAnalysis,
        confidence: marketAnalysis.confidence?.toString() || '0.8',
        status: 'success'
      });

      // Broadcast completion
      wsManager?.broadcastAIPipelineUpdate('market_scan', 'completed', marketAnalysis, correlationId);

      // Publish to Redis
      await publishSystemEvent('MARKET_SCAN_COMPLETE', correlationId, marketAnalysis);

      console.log(`[${correlationId}] Market scan completed`);

      // Chain to next job
      await QueueManager.addAssetSelectionJob({
        correlationId,
        marketAnalysis
      });

      return marketAnalysis;
    } catch (error: any) {
      console.error(`[${correlationId}] Market scan failed:`, error);

      await storage.createAiDecision({
        correlationId,
        stage: 'market_scan',
        status: 'failed',
        errorMessage: error.message
      });

      wsManager?.broadcastAIPipelineUpdate('market_scan', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  },

  [QUEUE_NAMES.ASSET_SELECTION]: async (job: Job) => {
    const { correlationId, marketAnalysis } = job.data;

    try {
      console.log(`[${correlationId}] Starting asset selection`);

      wsManager?.broadcastAIPipelineUpdate('asset_selection', 'started', {}, correlationId);

      const availableAssets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'];
      const assetSelections = await selectAssets(marketAnalysis, availableAssets);

      // Select top 3 assets
      const selectedAssets = assetSelections
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3);

      await storage.createAiDecision({
        correlationId,
        stage: 'asset_selection',
        input: { marketAnalysis, availableAssets },
        output: selectedAssets,
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('asset_selection', 'completed', { selectedAssets }, correlationId);

      // Publish to Redis
      await publishSystemEvent('ASSET_SELECTION_COMPLETE', correlationId, { selectedAssets });

      console.log(`[${correlationId}] Asset selection completed:`, selectedAssets.map((a: any) => a.symbol));

      // Chain to next job
      await QueueManager.addStrategyGenerationJob({
        correlationId,
        selectedAssets
      });

      return selectedAssets;
    } catch (error: any) {
      console.error(`[${correlationId}] Asset selection failed:`, error);

      await storage.createAiDecision({
        correlationId,
        stage: 'asset_selection',
        status: 'failed',
        errorMessage: error.message
      });

      wsManager?.broadcastAIPipelineUpdate('asset_selection', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  },

  [QUEUE_NAMES.STRATEGY_GENERATION]: async (job: Job) => {
    const { correlationId, selectedAssets } = job.data;

    try {
      console.log(`[${correlationId}] Starting strategy generation`);

      wsManager?.broadcastAIPipelineUpdate('strategy_generation', 'started', {}, correlationId);

      const strategies = [];

      for (const asset of selectedAssets.slice(0, 1)) { // Generate strategy for top asset
        const marketData = await tradingService.getMarketData([asset.symbol]);
        const strategy = await generateTradingStrategy(asset.symbol, marketData[0]);
        strategies.push(strategy);
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'strategy_generation',
        input: { selectedAssets },
        output: strategies,
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('strategy_generation', 'completed', { strategies }, correlationId);

      // Publish to Redis
      await publishSystemEvent('STRATEGY_GENERATION_COMPLETE', correlationId, { strategies });

      console.log(`[${correlationId}] Strategy generation completed:`, strategies.length, 'strategies');

      // Chain to next job
      await QueueManager.addValidationJob({
        correlationId,
        strategies
      });

      return strategies;
    } catch (error: any) {
      console.error(`[${correlationId}] Strategy generation failed:`, error);

      await storage.createAiDecision({
        correlationId,
        stage: 'strategy_generation',
        status: 'failed',
        errorMessage: error.message
      });

      wsManager?.broadcastAIPipelineUpdate('strategy_generation', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  },

  [QUEUE_NAMES.VALIDATION]: async (job: Job) => {
    const { correlationId, strategies } = job.data;

    try {
      console.log(`[${correlationId}] Starting strategy validation`);

      wsManager?.broadcastAIPipelineUpdate('validation', 'started', {}, correlationId);

      const validatedStrategies = [];

      for (const strategy of strategies) {
        // Run backtest
        const backtestResult = await tradingService.backtestStrategy(
          strategy.symbol,
          strategy.entryRules,
          strategy.exitRules,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          new Date()
        );

        // Validate performance (simplified criteria)
        if (backtestResult.totalReturn > 0.02 && backtestResult.winRate > 0.6) {
          validatedStrategies.push({
            ...strategy,
            backtestResult,
            validated: true
          });
        }
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'validation',
        input: { strategies },
        output: { validatedStrategies },
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('validation', 'completed', { validatedStrategies }, correlationId);

      // Publish to Redis
      await publishSystemEvent('STRATEGY_VALIDATION_COMPLETE', correlationId, { validatedStrategies });

      console.log(`[${correlationId}] Strategy validation completed:`, validatedStrategies.length, 'validated strategies');

      // Chain to next job
      await QueueManager.addStagingJob({
        correlationId,
        validatedStrategies
      });

      return validatedStrategies;
    } catch (error: any) {
      console.error(`[${correlationId}] Strategy validation failed:`, error);

      await storage.createAiDecision({
        correlationId,
        stage: 'validation',
        status: 'failed',
        errorMessage: error.message
      });

      wsManager?.broadcastAIPipelineUpdate('validation', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  },

  [QUEUE_NAMES.STAGING]: async (job: Job) => {
    const { correlationId, validatedStrategies } = job.data;

    try {
      console.log(`[${correlationId}] Starting strategy staging`);

      wsManager?.broadcastAIPipelineUpdate('staging', 'started', {}, correlationId);

      const stagedStrategies = [];

      for (const strategy of validatedStrategies) {
        // Store strategy in database
        const dbStrategy = await storage.createStrategy({
          name: strategy.name,
          symbol: strategy.symbol,
          entryRules: strategy.entryRules,
          exitRules: strategy.exitRules,
          riskParameters: strategy.riskParameters,
          backtestResults: strategy.backtestResult,
          confidence: strategy.confidence?.toString() || '0.8',
          status: 'staged',
          correlationId,
          aiMetadata: strategy
        });

        stagedStrategies.push(dbStrategy);
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'staging',
        input: { validatedStrategies },
        output: { stagedStrategies: stagedStrategies.map(s => s.id) },
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('staging', 'completed', { stagedCount: stagedStrategies.length }, correlationId);

      // Publish to Redis
      await publishSystemEvent('STRATEGY_STAGING_COMPLETE', correlationId, { stagedStrategies: stagedStrategies.map(s => s.id) });

      console.log(`[${correlationId}] Strategy staging completed:`, stagedStrategies.length, 'strategies staged');

      // Chain to execution job
      await QueueManager.addExecutionJob({
        correlationId,
        stagedStrategies
      });

      return stagedStrategies;
    } catch (error: any) {
      console.error(`[${correlationId}] Strategy staging failed:`, error);

      await storage.createAiDecision({
        correlationId,
        stage: 'staging',
        status: 'failed',
        errorMessage: error.message
      });

      wsManager?.broadcastAIPipelineUpdate('staging', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  },

  [QUEUE_NAMES.EXECUTION]: async (job: Job) => {
    const { correlationId, stagedStrategies } = job.data;

    try {
      console.log(`[${correlationId}] Starting trade execution monitoring`);

      // This job sets up monitoring for staged strategies
      // In a real implementation, this would run continuously or schedule monitoring

      // For now, we'll simulate immediate execution check
      await executeStagedTrades(correlationId);

      wsManager?.broadcastAIPipelineUpdate('execution', 'completed', {
        message: 'Trade execution monitoring started'
      }, correlationId);

      // Publish to Redis
      await publishSystemEvent('TRADE_EXECUTION_STARTED', correlationId, {
        message: 'Trade execution monitoring started',
        stagedStrategies: stagedStrategies?.length || 0
      });

      console.log(`[${correlationId}] Trade execution monitoring started`);

      return { message: 'Execution monitoring started' };
    } catch (error: any) {
      console.error(`[${correlationId}] Trade execution failed:`, error);
      wsManager?.broadcastAIPipelineUpdate('execution', 'failed', { error: error.message }, correlationId);
      throw error;
    }
  }
};

// Execute staged trades
async function executeStagedTrades(correlationId: string) {
  try {
    const stagedStrategies = await storage.getStrategies('staged');

    for (const strategy of stagedStrategies) {
      const marketData = await tradingService.getMarketData([strategy.symbol]);
      const evaluation = await tradingService.evaluateStrategy(
        strategy.symbol,
        strategy.entryRules,
        strategy.exitRules,
        marketData[0]
      );

      if (evaluation.shouldEnter && evaluation.confidence > 0.7) {
        // Execute trade
        const orderRequest = {
          symbol: strategy.symbol,
          quantity: 100, // This should come from risk parameters
          side: 'buy' as const,
          type: 'market' as const,
          correlationId: strategy.correlationId || undefined,
          strategyName: strategy.name,
          aiReasoning: `AI confidence: ${evaluation.confidence}`
        };

        const orderResult = await tradingService.executeOrder(orderRequest);

        // Update strategy status
        await storage.updateStrategy(strategy.id, { status: 'active' });

        wsManager?.broadcastTradeExecution({
          strategy: strategy.name,
          symbol: strategy.symbol,
          side: 'buy',
          quantity: 100,
          price: orderResult.executedPrice,
          correlationId: strategy.correlationId
        });

        console.log(`[${correlationId}] Executed trade for ${strategy.symbol}`);
      }
    }
  } catch (error) {
    console.error(`[${correlationId}] Error executing staged trades:`, error);
  }
}

// Initialize worker
export async function initializeWorker() {
  console.log('Initializing BullMQ worker...');

  worker = new Worker('smart-alpaca-trading', async (job) => {
    const processor = jobProcessors[job.name as keyof typeof jobProcessors];
    if (processor) {
      return await processor(job);
    } else {
      throw new Error(`No processor found for job type: ${job.name}`);
    }
  }, {
    connection: redisClient,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10,
      duration: 1000 // Max 10 jobs per second
    }
  });

  // Event listeners
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed: ${job.name}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: ${job?.name}`, err);
  });

  worker.on('active', (job) => {
    console.log(`Job ${job.id} started: ${job.name}`);
  });

  console.log('BullMQ worker initialized and ready to process jobs');
}

// Graceful shutdown
export async function shutdownWorker() {
  console.log('Shutting down worker...');

  if (worker) {
    await worker.close();
  }

  await QueueManager.close();
  console.log('Worker shutdown complete');
}

// Health check
export async function getWorkerHealth() {
  if (!worker) {
    return { status: 'not_initialized' };
  }

  try {
    const isRunning = worker.isRunning();
    const stats = await QueueManager.getQueueStats();

    return {
      status: 'healthy',
      isRunning,
      queueStats: stats
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Main entry point when run as worker process
if (require.main === module) {
  console.log('Starting Smart Alpaca Worker Process...');

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await shutdownWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await shutdownWorker();
    process.exit(0);
  });

  // Initialize and start worker
  initializeWorker().catch((error) => {
    console.error('Failed to initialize worker:', error);
    process.exit(1);
  });
}
