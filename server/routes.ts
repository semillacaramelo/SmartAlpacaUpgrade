import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tradingService } from "./services/trading";
import { alpacaService } from "./services/alpaca";
import { QueueManager, redisClient } from "./lib/queue";
import { initializeWebSocketManager } from "./services/websocket";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Redis Pub/Sub channel for system events
const SYSTEM_EVENTS_CHANNEL = 'system-events';

// Initialize Redis subscriber for system events
function initializeRedisSubscriber(wsManager: any) {
  console.log('Initializing Redis Pub/Sub subscriber...');

  // Create a separate Redis client for subscribing
  const subscriber = redisClient.duplicate();

  subscriber.subscribe(SYSTEM_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err);
      return;
    }
    console.log(`Subscribed to Redis channel: ${SYSTEM_EVENTS_CHANNEL}`);
  });

  subscriber.on('message', (channel, message) => {
    try {
      if (channel === SYSTEM_EVENTS_CHANNEL) {
        const eventData = JSON.parse(message);
        console.log(`Received Redis event: ${eventData.event_type}`, eventData.correlationId);

        // Forward to WebSocket clients
        wsManager?.broadcastSystemEvent({
          event: eventData.event_type,
          data: eventData.data,
          correlationId: eventData.correlationId
        });
      }
    } catch (error) {
      console.error('Error processing Redis message:', error);
    }
  });

  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Unsubscribing from Redis...');
    subscriber.unsubscribe();
    subscriber.quit();
  });

  process.on('SIGINT', () => {
    console.log('Unsubscribing from Redis...');
    subscriber.unsubscribe();
    subscriber.quit();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wsManager = initializeWebSocketManager(httpServer);

  // Initialize Redis Pub/Sub subscriber for system events
  initializeRedisSubscriber(wsManager);

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const systemHealth = await storage.getSystemHealth();
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        services: systemHealth 
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // System metrics
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      const auditLogs = await storage.getAuditLogs(10);
      const systemHealth = await storage.getSystemHealth();
      const queueStats = await QueueManager.getQueueStats();

      const activeCycles = strategies.filter(s => s.status === 'active').length;
      const stagedStrategies = strategies.filter(s => s.status === 'staged').length;

      res.json({
        active_cycles: activeCycles,
        staged_strategies: stagedStrategies,
        bot_status: queueStats.total > 0 ? 'running' : 'stopped',
        queue_stats: queueStats,
        last_activity: auditLogs[0]?.timestamp || null,
        system_health: systemHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bot control
  app.post("/api/bot/start", async (req, res) => {
    try {
      const correlationId = `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start the AI pipeline by adding the first job
      const job = await QueueManager.addMarketScanJob({
        correlationId,
        symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN']
      });

      // Log the bot cycle start
      await storage.createAuditLog({
        correlationId,
        eventType: 'BOT_CYCLE_STARTED',
        eventData: { jobId: job.id },
        source: 'api_server',
        level: 'info'
      });

      res.json({
        success: true,
        correlationId,
        jobId: job.id,
        message: 'AI trading cycle started'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bot/stop", async (req, res) => {
    try {
      // Pause the queue to stop processing new jobs
      await QueueManager.pauseQueue();

      await storage.createAuditLog({
        eventType: 'BOT_STOPPED',
        eventData: { action: 'paused_queue' },
        source: 'api_server',
        level: 'info'
      });

      // Broadcast to WebSocket clients
      wsManager?.broadcastSystemEvent({
        event: 'BOT_STOPPED',
        data: { status: 'stopped' }
      });

      res.json({
        success: true,
        message: 'AI trading cycle stopped'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bot/status", async (req, res) => {
    try {
      const queueStats = await QueueManager.getQueueStats();
      const status = queueStats.total > 0 ? 'running' : 'stopped';

      res.json({
        status,
        queueStats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolio/status", async (req, res) => {
    try {
      // Get real account data from Alpaca
      const account = await alpacaService.getAccount();
      const positions = await alpacaService.getPositions();

      // Get or create demo user and portfolio for database tracking
      let user = await storage.getUserByUsername("demo-user");
      if (!user) {
        user = await storage.createUser({
          username: "demo-user",
          password: "demo"
        });
      }

      let portfolio = await storage.getPortfolio(user.id);
      if (!portfolio) {
        portfolio = await storage.createPortfolio({
          userId: user.id,
          totalValue: account.portfolio_value.toString(),
          cashBalance: account.cash.toString()
        });
      } else {
        // Update portfolio with real data
        await storage.updatePortfolio(user.id, {
          totalValue: account.portfolio_value.toString(),
          cashBalance: account.cash.toString(),
          dayPnL: "0", // This would need calculation from positions
          totalPnL: "0"  // This would need calculation from positions
        });
      }

      // Calculate day P&L from positions
      const dayPnL = positions.reduce((total, pos) => total + pos.unrealized_pl, 0);
      const dayPnLPercent = account.portfolio_value > 0 ? (dayPnL / account.portfolio_value) * 100 : 0;

      res.json({
        portfolioValue: account.portfolio_value,
        dayPnL,
        dayPnLPercent,
        activePositions: positions.length,
        winRate: 0, // Would need historical trade data
        cashBalance: account.cash,
        totalPnL: 0, // Would need historical calculation
        open_positions: positions.length,
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          quantity: pos.qty,
          entryPrice: pos.avg_entry_price,
          currentPrice: pos.current_price,
          marketValue: pos.market_value,
          unrealizedPnL: pos.unrealized_pl,
          unrealizedPnLPercent: pos.unrealized_plpc
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Positions endpoints
  app.get("/api/positions/open", async (req, res) => {
    try {
      const positions = await alpacaService.getPositions();

      res.json(positions.map(pos => ({
        symbol: pos.symbol,
        quantity: pos.qty,
        entryPrice: pos.avg_entry_price,
        currentPrice: pos.current_price,
        marketValue: pos.market_value,
        unrealizedPnL: pos.unrealized_pl,
        unrealizedPnLPercent: pos.unrealized_plpc
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Strategies endpoints
  app.get("/api/strategies", async (req, res) => {
    try {
      const status = req.query.status as string;
      const strategies = await storage.getStrategies(status);
      res.json(strategies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI decisions endpoint
  app.get("/api/ai-decisions/:correlationId", async (req, res) => {
    try {
      const { correlationId } = req.params;
      const decisions = await storage.getAiDecisions(correlationId);
      res.json(decisions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit logs endpoint
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Market data endpoint
  app.get("/api/market-data", async (req, res) => {
    try {
      const symbols = (req.query.symbols as string)?.split(',') || ['AAPL', 'GOOGL', 'MSFT'];
      const marketData = await tradingService.getMarketData(symbols);
      res.json(marketData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Backtest endpoint
  app.post("/api/backtest/run", async (req, res) => {
    try {
      const { symbol, entryRules, exitRules, startDate, endDate } = req.body;

      if (!symbol || !entryRules || !exitRules) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const result = await tradingService.backtestStrategy(
        symbol,
        entryRules,
        exitRules,
        new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(endDate || Date.now())
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trading endpoint
  app.post("/api/trade/execute", async (req, res) => {
    try {
      const orderRequest = req.body;
      const result = await tradingService.executeOrder(orderRequest);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User management (basic)
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
