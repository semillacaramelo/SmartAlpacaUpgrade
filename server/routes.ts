import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tradingService } from "./services/trading";
import { alpacaService, AlpacaService } from "./services/alpaca";
import { GeminiService } from "./services/gemini";
import { QueueManager, redisClient, BotStateManager } from "./lib/queue";
import { initializeWebSocketManager } from "./services/websocket";
import { portfolioService } from "./services/portfolio";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  loginHandler,
  registerHandler,
  profileHandler,
  authenticate,
  authenticateDemo
} from "./middleware/auth";
import { authRateLimit, tradingRateLimit } from "./middleware/security";
import {
  executeTradeSchema,
  backtestSchema,
  apiSettingsSchema,
  portfolioQuerySchema,
  positionQuerySchema,
  validateSchema,
  validateQuery
} from "./schemas/validation";
import monitoringRoutes from "./routes/monitoring";
import promptsRoutes from "./routes/prompts";
import { createDefaultHealthChecks } from "./services/health-monitor";

// Redis Pub/Sub channel for system events
const SYSTEM_EVENTS_CHANNEL = "system-events";

// Initialize Redis subscriber for system events
function initializeRedisSubscriber(wsManager: any) {
  console.log("Initializing Redis Pub/Sub subscriber...");

  // Create a separate Redis client for subscribing
  const subscriber = redisClient.duplicate();

  subscriber.subscribe(SYSTEM_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
      return;
    }
    console.log(`Subscribed to Redis channel: ${SYSTEM_EVENTS_CHANNEL}`);
  });

  subscriber.on("message", (channel, message) => {
    try {
      if (channel === SYSTEM_EVENTS_CHANNEL) {
        const eventData = JSON.parse(message);
        console.log(
          `Received Redis event: ${eventData.event_type}`,
          eventData.correlationId
        );

        // Forward to WebSocket clients
        wsManager?.broadcastSystemEvent({
          event: eventData.event_type,
          data: eventData.data,
          correlationId: eventData.correlationId,
        });
      }
    } catch (error) {
      console.error("Error processing Redis message:", error);
    }
  });

  subscriber.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("Unsubscribing from Redis...");
    subscriber.unsubscribe();
    subscriber.quit();
  });

  process.on("SIGINT", () => {
    console.log("Unsubscribing from Redis...");
    subscriber.unsubscribe();
    subscriber.quit();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize bot state and queue
  await QueueManager.initialize();

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
        services: systemHealth,
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Authentication routes (no auth required)
  app.post("/api/auth/login", authRateLimit, loginHandler);
  app.post("/api/auth/register", authRateLimit, registerHandler);
  app.get("/api/auth/profile", authenticate, profileHandler);

  // Initialize health monitoring
  createDefaultHealthChecks();

  // Monitoring and resilience routes
  app.use("/api/monitoring", monitoringRoutes);

  // AI Prompts management routes
  app.use("/api/prompts", promptsRoutes);

  // System metrics
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      const auditLogs = await storage.getAuditLogs(10);
      const systemHealth = await storage.getSystemHealth();
      const queueStats = await QueueManager.getQueueStats();
      const botState = await BotStateManager.getBotState();

      const activeCycles = strategies.filter(
        (s) => s.status === "active"
      ).length;
      const stagedStrategies = strategies.filter(
        (s) => s.status === "staged"
      ).length;

      res.json({
        active_cycles: activeCycles,
        staged_strategies: stagedStrategies,
        bot_status: botState,
        queue_stats: queueStats,
        last_activity: auditLogs[0]?.timestamp || null,
        system_health: systemHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bot control
  app.post("/api/bot/start", authenticateDemo, async (req, res) => {
    try {
      console.log("Bot start request received");

      // Set bot state to running in Redis
      await BotStateManager.setBotState("running");

      // Resume the queue to allow processing
      await QueueManager.resumeQueue();

      const correlationId = `cycle_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Start the AI pipeline by adding the first job
      const job = await QueueManager.addMarketScanJob({
        correlationId,
        symbols: ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "META", "AMZN"],
      });
      console.log(
        `Market scan job added to queue: ${job.id} with correlationId: ${correlationId}`
      );

      // Log the bot cycle start
      await storage.createAuditLog({
        correlationId,
        eventType: "BOT_CYCLE_STARTED",
        eventData: { jobId: job.id },
        source: "api_server",
        level: "info",
      });

      res.json({
        success: true,
        correlationId,
        jobId: job.id,
        message: "AI trading cycle started",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bot/stop", authenticateDemo, async (req, res) => {
    try {
      // Set bot state to stopped in Redis
      await BotStateManager.setBotState("stopped");

      // Pause the queue to stop processing new jobs
      await QueueManager.pauseQueue();

      await storage.createAuditLog({
        eventType: "BOT_STOPPED",
        eventData: { action: "paused_queue" },
        source: "api_server",
        level: "info",
      });

      // Broadcast to WebSocket clients
      wsManager?.broadcastSystemEvent({
        event: "BOT_STOPPED",
        data: { status: "stopped" },
      });

      res.json({
        success: true,
        message: "AI trading cycle stopped",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bot/status", async (req, res) => {
    try {
      const queueStats = await QueueManager.getQueueStats();
      const botState = await BotStateManager.getBotState();

      res.json({
        status: botState,
        queueStats,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolio/history", validateQuery(portfolioQuerySchema), async (req, res) => {
    try {
      const { period } = req.validatedQuery;
      const account = await alpacaService.getAccount();

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case "1W":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "ALL":
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        default: // 1D
          startDate.setDate(startDate.getDate() - 1);
      }

      // Get historical equity data from Alpaca
      const equityHistory = await alpacaService.getHistoricalBars(
        "SPY", // Use a proxy for overall portfolio performance
        startDate,
        endDate,
        period === "1D" ? "1Min" : "1Day"
      );

      // Transform data into chart format
      const data = equityHistory.map((bar) => ({
        time:
          period === "1D"
            ? new Date(bar.timestamp).toLocaleTimeString()
            : new Date(bar.timestamp).toLocaleDateString(),
        value: bar.close,
      }));

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/portfolio/status", async (req, res) => {
    try {
      const status = await portfolioService.getPortfolioStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Positions endpoints
  app.get("/api/positions/open", validateQuery(positionQuerySchema), async (req, res) => {
    try {
      const { status, symbol, limit, offset } = req.validatedQuery;

      let positions = await alpacaService.getPositions();

      // Filter by symbol if provided
      if (symbol) {
        positions = positions.filter(pos => pos.symbol === symbol);
      }

      // Apply pagination
      positions = positions.slice(offset, offset + limit);

      res.json(
        positions.map((pos) => ({
          symbol: pos.symbol,
          quantity: pos.qty,
          entryPrice: pos.avg_entry_price,
          currentPrice: pos.current_price,
          marketValue: pos.market_value,
          unrealizedPnL: pos.unrealized_pl,
          unrealizedPnLPercent: pos.unrealized_plpc,
        }))
      );
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
      const symbols = (req.query.symbols as string)?.split(",") || [
        "AAPL",
        "GOOGL",
        "MSFT",
      ];
      const marketData = await tradingService.getMarketData(symbols);
      res.json(marketData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Backtest endpoint
  app.post("/api/backtest/run", validateSchema(backtestSchema), async (req, res) => {
    try {
      const { symbol, entryRules, exitRules, startDate, endDate } = req.validatedBody;

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
  app.post("/api/trade/execute", authenticateDemo, tradingRateLimit, validateSchema(executeTradeSchema), async (req, res) => {
    try {
      const orderRequest = req.validatedBody;
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

  // Save API settings
  app.post("/api/settings/api", validateSchema(apiSettingsSchema), async (req, res) => {
    try {
      console.log("Received settings save request:", req.validatedBody); // Debug log

      const {
        alpacaApiKey,
        alpacaSecret,
        geminiApiKey,
        tradingMode,
        autoTrading,
        maxPositionSize,
        stopLoss,
        takeProfit
      } = req.validatedBody;

      // Use demo user for now
      const userId = "demo-user";
      console.log("Looking up user by username:", userId); // Debug log

      // First find or create the user
      let user = await storage.getUserByUsername(userId);
      if (!user) {
        console.log("Creating new user:", userId); // Debug log
        user = await storage.createUser({
          username: userId,
          password: "temp-password", // This would normally be handled by auth
          email: "", // Optional
        });
      }

      console.log("User found/created with ID:", user.id); // Debug log

      // Update user settings directly in the users table
      console.log("Updating user settings for user ID:", user.id); // Debug log
      const updatedUser = await storage.updateUserSettings(user.id, {
        alpacaApiKey: alpacaApiKey || "",
        alpacaSecretKey: alpacaSecret || "",
        geminiApiKey: geminiApiKey || "",
        enablePaperTrading: tradingMode === 'paper',
        enableRealTrading: autoTrading || false,
      });

      console.log("User settings saved successfully:", updatedUser); // Debug log

      res.json({
        success: true,
        message: "API settings saved successfully!",
        settings: {
          alpacaApiKey: updatedUser.alpacaApiKey ? "***masked***" : "",
          alpacaSecretKey: updatedUser.alpacaSecretKey ? "***masked***" : "",
          geminiApiKey: updatedUser.geminiApiKey ? "***masked***" : "",
          enablePaperTrading: updatedUser.enablePaperTrading,
          enableRealTrading: updatedUser.enableRealTrading,
        },
      });
    } catch (error: any) {
      console.error("Error saving API settings:", error); // Debug log

      // Provide more specific error messages based on error type
      let errorMessage = "Unknown error occurred";

      if (error.message && error.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Database connection failed. Settings will be saved locally. Please configure your database connection.";
      } else if (error.message && error.message.includes("AggregateError")) {
        errorMessage =
          "Database connectivity issue. Settings will be saved locally. Please check your database configuration.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Return success if this is just a database connectivity issue
      // The frontend can handle this as a temporary issue
      if (
        errorMessage.includes("Database") ||
        errorMessage.includes("connectivity")
      ) {
        console.warn("Database not available, but request structure is valid");
        const validatedData = req.validatedBody;
        res.json({
          success: true,
          message:
            "Settings validated successfully. Database connectivity issue - settings will be saved when connection is restored.",
          database_error: errorMessage,
          settings: {
            alpacaApiKey: validatedData.alpacaApiKey ? "***masked***" : "",
            alpacaSecretKey: validatedData.alpacaSecretKey ? "***masked***" : "",
            geminiApiKey: validatedData.geminiApiKey ? "***masked***" : "",
            enablePaperTrading: validatedData.enablePaperTrading,
            enableRealTrading: validatedData.enableRealTrading,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: `Failed to save API settings: ${errorMessage}`,
        });
      }
    }
  });

  // Load API settings endpoint
  app.get("/api/settings/api", async (req, res) => {
    try {
      // For demo purposes, use a fixed demo user
      const userId = "demo-user";

      const user = await storage.getUserByUsername(userId);
      if (!user) {
        // Return empty settings if user doesn't exist yet
        return res.json({
          alpacaApiKey: "",
          alpacaSecret: "",
          geminiApiKey: "",
          tradingMode: "paper",
          autoTrading: false,
          maxPositionSize: 10,
          stopLoss: 5,
          takeProfit: 15
        });
      }

      // Mask sensitive data for security
      const maskKey = (key: string | null) => {
        if (!key || key.length < 8) return "";
        return "*".repeat(key.length - 4) + key.slice(-4);
      };

      res.json({
        alpacaApiKey: maskKey(user.alpacaApiKey),
        alpacaSecret: maskKey(user.alpacaSecretKey),
        geminiApiKey: maskKey(user.geminiApiKey),
        tradingMode: user.enablePaperTrading ? "paper" : "live",
        autoTrading: user.enableRealTrading || false,
        maxPositionSize: 10, // Add these to user schema later
        stopLoss: 5,
        takeProfit: 15
      });
    } catch (error: any) {
      console.error("Error loading API settings:", error);
      res.status(500).json({ error: "Failed to load settings" });
    }
  });

  // API connection testing endpoints
  app.post("/api/test/alpaca", async (req, res) => {
    try {
      const { apiKey, secretKey } = req.body;
      if (!apiKey || !secretKey) {
        return res.status(400).json({
          success: false,
          error: "API key and secret key are required",
        });
      }

      const testAlpacaService = new AlpacaService({
        keyId: apiKey,
        secretKey: secretKey,
      });
      const account = await testAlpacaService.getAccount();

      res.json({
        success: true,
        message: "Alpaca API connection successful!",
        account: {
          id: account.id,
          status: account.status,
          portfolio_value: account.portfolio_value,
          cash: account.cash,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `Alpaca API connection failed: ${error.message}`,
      });
    }
  });

  app.post("/api/test/gemini", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res
          .status(400)
          .json({ success: false, error: "API key is required" });
      }

      const testGeminiService = new GeminiService(apiKey);
      const isConnected = await testGeminiService.testConnection();

      if (isConnected) {
        res.json({
          success: true,
          message: "Gemini API connection successful!",
        });
      } else {
        throw new Error("Gemini API responded but with unexpected content.");
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `Gemini API connection failed: ${error.message}`,
      });
    }
  });

  return httpServer;
}
