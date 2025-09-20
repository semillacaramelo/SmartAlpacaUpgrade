import { Router } from "express";
import { storage } from "../storage";
import { alpacaService } from "../services/alpaca";
import { metricsCollector } from "../services/metrics";
import { performanceLogger } from "../services/logger";

interface ComponentHealth {
  status: "up" | "down";
  latency: number;
  message?: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    tradingSystem: ComponentHealth;
    webSocket: ComponentHealth;
  };
  timestamp: string;
}

const router = Router();

router.get("/health", async (req, res) => {
  const endTimer = performanceLogger.startOperation("health_check");
  const healthStatus: HealthStatus = {
    status: "healthy",
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      tradingSystem: await checkTradingSystem(),
      webSocket: await checkWebSocket(),
    },
    timestamp: new Date().toISOString(),
  };

  // Determine overall system health
  const componentStatuses = Object.values(healthStatus.checks);
  const hasFailures = componentStatuses.some(
    (check) => check.status === "down"
  );
  const hasSlowComponents = componentStatuses.some(
    (check) => check.latency > 1000
  );

  if (hasFailures) {
    healthStatus.status = "unhealthy";
  } else if (hasSlowComponents) {
    healthStatus.status = "degraded";
  }

  endTimer();
  res.json(healthStatus);
});

async function checkDatabase(): Promise<ComponentHealth> {
  const startTime = Date.now();
  try {
    await storage.healthCheck();
    return {
      status: "up",
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const startTime = Date.now();
  try {
    // Implement Redis health check
    return {
      status: "up",
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkTradingSystem(): Promise<ComponentHealth> {
  const startTime = Date.now();
  try {
    await alpacaService.getAccount();
    return {
      status: "up",
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkWebSocket(): Promise<ComponentHealth> {
  const startTime = Date.now();
  try {
    // Check WebSocket connection status
    return {
      status: "up",
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export { router as healthCheckRouter };
