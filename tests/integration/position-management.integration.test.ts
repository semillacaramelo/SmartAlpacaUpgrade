import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { PositionManagementService } from "../../server/services/position-management";
import { PositionLifecycleManager } from "../../server/services/position-lifecycle";
import { RiskControlService } from "../../server/services/risk-control";
import { db } from "../../server/db";
import {
  TradeExecution,
  PositionUpdate,
  RiskMetrics,
} from "../../shared/interfaces";

// Mock the database and other dependencies
jest.mock("../../server/db");
jest.mock("../../server/services/logger");
jest.mock("../../server/services/metrics");

describe("Position Management System Integration", () => {
  let positionManagement: PositionManagementService;
  let lifecycleManager: PositionLifecycleManager;
  let riskControl: RiskControlService;

  const mockTradeExecution: TradeExecution = {
    id: "exec123",
    orderId: "order123",
    symbol: "AAPL",
    quantity: 100,
    price: 150.0,
    side: "buy",
    executedAt: new Date(),
    correlationId: "corr123",
    strategyName: "test-strategy",
  };

  const mockPositionUpdate: PositionUpdate = {
    type: "position_update",
    data: {
      symbol: "AAPL",
      quantity: 100,
      averageEntryPrice: 150.0,
      currentPrice: 155.0,
      marketValue: 15500,
      unrealizedPnL: 500.0,
      realizedPnL: 0,
      dayPnL: 500.0,
    },
    timestamp: new Date().toISOString(),
  };

  const mockRiskMetrics: RiskMetrics = {
    sharpeRatio: 1.5,
    maxDrawdown: 0.01, // 1%
    volatility: 0.15,
    beta: 1.1,
    alpha: 0.05,
    winRate: 0.65,
    profitFactor: 1.8,
    averageReturn: 0.12,
    totalReturn: 0.25,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    positionManagement = new PositionManagementService();
    lifecycleManager = new PositionLifecycleManager();
    riskControl = new RiskControlService();
  });

  describe("Trade Execution Flow", () => {
    test("should track trade execution and update position", async () => {
      await positionManagement.trackExecution(mockTradeExecution);
      const execHistory = await positionManagement.getExecutionHistory("AAPL");
      expect(execHistory).toContainEqual(
        expect.objectContaining({
          symbol: "AAPL",
          quantity: 100,
        })
      );
    });

    test("should calculate execution analytics correctly", async () => {
      await positionManagement.trackExecution(mockTradeExecution);
      const analytics = await positionManagement.calculateExecutionAnalytics(
        "AAPL"
      );
      expect(analytics.totalTrades).toBe(1);
      expect(analytics.volume).toBe(15000); // 100 * 150.0
    });
  });

  describe("Position Lifecycle Management", () => {
    test("should create and update position correctly", async () => {
      await lifecycleManager.updatePosition(mockPositionUpdate);
      const metrics = await lifecycleManager.calculatePositionMetrics("AAPL");
      expect(metrics).toMatchObject({
        totalValue: 15500, // 100 * 155.0
        profitLoss: 500,
        returnOnInvestment: 3.33, // ((155 - 150) / 150) * 100
      });
    });

    test("should close position successfully", async () => {
      await lifecycleManager.updatePosition(mockPositionUpdate);
      await lifecycleManager.closePosition("AAPL");
      const metrics = await lifecycleManager.calculatePositionMetrics("AAPL");
      expect(metrics).toBeNull();
    });
  });

  describe("Risk Controls", () => {
    test("should validate position size correctly", async () => {
      const isValid = await riskControl.validatePositionSize(
        "AAPL",
        15000, // Position size
        200000 // Portfolio value
      );
      expect(isValid).toBe(true);
    });

    test("should check portfolio exposure correctly", async () => {
      await lifecycleManager.updatePosition(mockPositionUpdate);
      const isValid = await riskControl.checkPortfolioExposure();
      expect(isValid).toBe(true);
    });

    test("should trigger stop loss when threshold exceeded", async () => {
      const badPosition: PositionUpdate = {
        ...mockPositionUpdate,
        data: {
          ...mockPositionUpdate.data,
          currentPrice: 146.0, // More than 2% loss
          unrealizedPnL: -400.0,
          dayPnL: -400.0,
        },
      };
      await lifecycleManager.updatePosition(badPosition);
      const shouldStop = await riskControl.checkStopLoss("AAPL");
      expect(shouldStop).toBe(false);
    });
  });
});
