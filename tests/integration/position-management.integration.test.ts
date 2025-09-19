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
    orderId: "order123",
    symbol: "AAPL",
    quantity: 100,
    price: 150.0,
    side: "buy",
    timestamp: new Date(),
    executionId: "exec123",
    commission: 1.5,
  };

  const mockPositionUpdate: PositionUpdate = {
    symbol: "AAPL",
    quantity: 100,
    averageEntryPrice: 150.0,
    currentPrice: 155.0,
    unrealizedPL: 500.0,
    realizedPL: 0,
    holdingPeriod: 86400000, // 1 day in milliseconds
  };

  const mockRiskMetrics: RiskMetrics = {
    positionSize: 15000, // $15,000
    portfolioExposure: 0.15, // 15%
    drawdown: 0.01, // 1%
    valueAtRisk: 750, // $750
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
        currentPrice: 146.0, // More than 2% loss
      };
      await lifecycleManager.updatePosition(badPosition);
      const shouldStop = await riskControl.checkStopLoss("AAPL");
      expect(shouldStop).toBe(false);
    });
  });
});
