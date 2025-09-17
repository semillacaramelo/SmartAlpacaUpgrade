import { Queue, Job } from 'bullmq';
import IORedis from 'ioredis';

// Import the actual services and utilities
import { QueueManager, QUEUE_NAMES } from '../../server/lib/queue.js';
import { storage } from '../../server/storage.js';
import { testUtils } from '../setup.js';

// Test Redis instance
let testRedis: IORedis;
let testQueue: Queue;

describe('BullMQ AI Discovery Workflow Integration Test', () => {
  const correlationId = `test-cycle-${Date.now()}`;

  beforeAll(async () => {
    // Set up test Redis instance
    testRedis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '1'),
      lazyConnect: true,
    });

    // Clear test database
    await testRedis.flushdb();

    console.log('Test environment initialized');
  }, 30000);

  afterAll(async () => {
    // Clean up
    if (testRedis) {
      await testRedis.quit();
    }
  }, 30000);

  beforeEach(async () => {
    // Clear Redis before each test
    await testRedis.flushdb();
  });

  afterEach(async () => {
    // Clean up after each test
    await testRedis.flushdb();
  });

  it('should verify the AI discovery workflow can be initiated', async () => {
    console.log(`Starting integration test with correlationId: ${correlationId}`);

    // Test that we can add a market scan job to the queue
    const marketScanJob = await QueueManager.addMarketScanJob({
      correlationId,
      symbols: ['AAPL', 'GOOGL', 'MSFT'],
    });

    expect(marketScanJob).toBeDefined();
    expect(marketScanJob.id).toBeDefined();

    console.log(`Market scan job added: ${marketScanJob.id}`);

    // Verify job exists in Redis
    const jobKey = `bull:smart-alpaca-trading:${marketScanJob.id}`;
    const jobExists = await testRedis.exists(jobKey);
    expect(jobExists).toBe(1);

    console.log('Job exists in Redis');

    // Verify job data is correct
    const jobData = marketScanJob.data;
    expect(jobData.correlationId).toBe(correlationId);
    expect(jobData.symbols).toEqual(['AAPL', 'GOOGL', 'MSFT']);

    console.log('Job data verified');

    console.log(`✅ Basic workflow initiation test completed successfully for correlationId: ${correlationId}`);
  }, 30000);

  it('should verify queue statistics and job management', async () => {
    const testCorrelationId = `test-stats-${Date.now()}`;

    // Add multiple jobs
    const job1 = await QueueManager.addMarketScanJob({
      correlationId: testCorrelationId,
      symbols: ['AAPL'],
    });

    const job2 = await QueueManager.addMarketScanJob({
      correlationId: `${testCorrelationId}-2`,
      symbols: ['GOOGL'],
    });

    // Get queue statistics
    const queueStats = await QueueManager.getQueueStats();
    expect(queueStats.total).toBeGreaterThanOrEqual(2);

    console.log(`Queue stats: ${JSON.stringify(queueStats)}`);

    // Verify jobs are in waiting state
    const waitingJobs = await QueueManager.getWaitingJobs();
    expect(waitingJobs.length).toBeGreaterThanOrEqual(2);

    console.log(`Waiting jobs: ${waitingJobs.length}`);

    // Clean up
    await job1.remove();
    await job2.remove();

    console.log('Queue management verified');
  }, 30000);

  it('should verify Redis state management for strategies', async () => {
    const testStrategyId = `test-strategy-${Date.now()}`;

    // Simulate storing a strategy in Redis
    const strategyKey = `strategy:staged:${testStrategyId}`;
    const strategyData = {
      id: testStrategyId,
      name: 'Test Strategy',
      symbol: 'AAPL',
      status: 'staged',
      correlationId,
    };

    await testRedis.set(strategyKey, JSON.stringify(strategyData));

    // Verify strategy exists
    const strategyExists = await testRedis.exists(strategyKey);
    expect(strategyExists).toBe(1);

    // Verify strategy data
    const storedData = await testRedis.get(strategyKey);
    expect(storedData).toBeDefined();

    const parsedData = JSON.parse(storedData!);
    expect(parsedData.id).toBe(testStrategyId);
    expect(parsedData.symbol).toBe('AAPL');
    expect(parsedData.status).toBe('staged');

    console.log('Redis state management verified');
  }, 30000);

  it('should verify AI decision storage and retrieval', async () => {
    const testDecisionId = `test-decision-${Date.now()}`;

    // Create a test AI decision
    await storage.createAiDecision({
      correlationId,
      stage: 'market_scan',
      input: { symbols: ['AAPL', 'GOOGL'] },
      output: { trend: 'bullish', confidence: 0.85 },
      confidence: '0.85',
      status: 'success'
    });

    // Retrieve AI decisions
    const decisions = await storage.getAiDecisions(correlationId);
    expect(decisions.length).toBeGreaterThan(0);

    const marketScanDecision = decisions.find(d => d.stage === 'market_scan');
    expect(marketScanDecision).toBeDefined();
    expect(marketScanDecision?.status).toBe('success');
    expect(marketScanDecision?.correlationId).toBe(correlationId);

    console.log('AI decision storage and retrieval verified');
  }, 30000);

  it('should verify strategy storage and retrieval', async () => {
    const testStrategyId = `test-strategy-${Date.now()}`;

    // Create a test strategy
    const strategy = await storage.createStrategy({
      name: 'Test Momentum Strategy',
      symbol: 'AAPL',
      entryRules: 'RSI(14) < 30',
      exitRules: 'RSI(14) > 70',
      riskParameters: { maxPositionSize: 10000 },
      backtestResults: { totalReturn: 0.15, winRate: 0.65 },
      confidence: '0.8',
      status: 'staged',
      correlationId,
      aiMetadata: { source: 'test' }
    });

    expect(strategy).toBeDefined();
    expect(strategy.id).toBeDefined();
    expect(strategy.symbol).toBe('AAPL');
    expect(strategy.status).toBe('staged');

    // Retrieve strategies
    const stagedStrategies = await storage.getStrategies('staged');
    expect(stagedStrategies.length).toBeGreaterThan(0);

    const foundStrategy = stagedStrategies.find(s => s.id === strategy.id);
    expect(foundStrategy).toBeDefined();
    expect(foundStrategy?.name).toBe('Test Momentum Strategy');

    console.log('Strategy storage and retrieval verified');
  }, 30000);
});
