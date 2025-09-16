import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tradingService } from "./services/trading";
import { taskManager } from "./services/celery-tasks";
import { initializeWebSocketManager } from "./services/websocket";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wsManager = initializeWebSocketManager(httpServer);

  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const systemHealth = await storage.getSystemHealth();
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        services: systemHealth 
      });
    } catch (error) {
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
      
      const activeCycles = strategies.filter(s => s.status === 'active').length;
      const stagedStrategies = strategies.filter(s => s.status === 'staged').length;
      
      res.json({
        active_cycles: activeCycles,
        staged_strategies: stagedStrategies,
        bot_status: taskManager.getBotStatus(),
        last_activity: auditLogs[0]?.timestamp || null,
        system_health: systemHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bot control
  app.post("/api/bot/start", async (req, res) => {
    try {
      const result = await taskManager.startBotCycle();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bot/stop", async (req, res) => {
    try {
      const result = await taskManager.stopBot();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = taskManager.getBotStatus();
      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolio/status", async (req, res) => {
    try {
      // Get or create demo user and portfolio
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
          totalValue: "100000.00",
          cashBalance: "100000.00"
        });
      }
      
      const metrics = await tradingService.getPortfolioMetrics(portfolio.id);
      const openPositions = await storage.getOpenPositions(portfolio.id);
      
      res.json({
        ...metrics,
        open_positions: openPositions.length,
        positions: openPositions
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Positions endpoints
  app.get("/api/positions/open", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo-user");
      if (!user) {
        return res.json([]);
      }
      
      const portfolio = await storage.getPortfolio(user.id);
      if (!portfolio) {
        return res.json([]);
      }
      
      const positions = await storage.getOpenPositions(portfolio.id);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Strategies endpoints
  app.get("/api/strategies", async (req, res) => {
    try {
      const status = req.query.status as string;
      const strategies = await storage.getStrategies(status);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI decisions endpoint
  app.get("/api/ai-decisions/:correlationId", async (req, res) => {
    try {
      const { correlationId } = req.params;
      const decisions = await storage.getAiDecisions(correlationId);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Audit logs endpoint
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Market data endpoint
  app.get("/api/market-data", async (req, res) => {
    try {
      const symbols = (req.query.symbols as string)?.split(',') || ['AAPL', 'GOOGL', 'MSFT'];
      const marketData = await tradingService.getMarketData(symbols);
      res.json(marketData);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trading endpoint
  app.post("/api/trade/execute", async (req, res) => {
    try {
      const orderRequest = req.body;
      const result = await tradingService.executeOrder(orderRequest);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // User management (basic)
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
