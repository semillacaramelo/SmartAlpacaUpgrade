import { TradingService } from "../../server/services/trading.js";
import { alpacaService } from "../../server/services/alpaca.js";
import { testUtils } from "../setup.js";

// Mock the external services
jest.mock("../../server/services/alpaca.js", () => ({
  alpacaService: {
    getMarketData: jest.fn(),
    getAccount: jest.fn(),
    placeOrder: jest.fn(),
  },
}));

jest.mock("../../server/services/evaluator.js", () => ({
  strategyEvaluator: {
    evaluateRules: jest.fn(),
  },
}));

describe("TradingService", () => {
  let tradingService: TradingService;

  beforeEach(() => {
    tradingService = new TradingService();
    jest.clearAllMocks();
  });

  describe("Position Size Calculation", () => {
    it("should calculate position size for conservative strategy", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size for conservative strategy
      // Conservative: 1% risk per trade, 2% stop loss
      // Risk amount = 100000 * 0.01 = 1000
      // Stop loss amount = 150 * 0.02 = 3
      // Position size = 1000 / 3 = 333.33, floored to 333
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "conservative"
      );

      expect(positionSize).toBe(333);
      console.log("Conservative strategy position size calculation verified");
    });

    it("should calculate position size for moderate strategy", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size for moderate strategy
      // Moderate: 2% risk per trade, 3% stop loss
      // Risk amount = 100000 * 0.02 = 2000
      // Stop loss amount = 150 * 0.03 = 4.5
      // Position size = 2000 / 4.5 = 444.44, floored to 444
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "moderate"
      );

      expect(positionSize).toBe(333); // Same as conservative since all use same account data
      console.log("Moderate strategy position size calculation verified");
    });

    it("should calculate position size for aggressive strategy", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size for aggressive strategy
      // Aggressive: 3% risk per trade, 5% stop loss
      // Risk amount = 100000 * 0.03 = 3000
      // Stop loss amount = 150 * 0.05 = 7.5
      // Position size = 3000 / 7.5 = 400, floored to 400
      // But limited by cash: 50000 / 150 = 333.33, floored to 333
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "aggressive"
      );

      expect(positionSize).toBe(333);
      console.log("Aggressive strategy position size calculation verified");
    });

    it("should respect cash availability limits", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account with limited cash
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 1000.0, // Only $1000 available
      });

      // Calculate position size for conservative strategy
      // Conservative: 1% risk per trade, 2% stop loss
      // Risk amount = 100000 * 0.01 = 1000
      // Stop loss amount = 150 * 0.02 = 3
      // Position size = 1000 / 3 = 333.33, floored to 333
      // But limited by cash: 1000 / 150 = 6.67, floored to 6
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "conservative"
      );

      expect(positionSize).toBe(6);
      console.log("Cash availability limit verified");
    });

    it("should enforce minimum and maximum position size limits", async () => {
      // Mock market data with very high price
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 10000.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size for conservative strategy
      // Conservative: 1% risk per trade, 2% stop loss
      // Risk amount = 100000 * 0.01 = 1000
      // Stop loss amount = 10000 * 0.02 = 200
      // Position size = 1000 / 200 = 5, floored to 5
      // But minimum is 1, so should be 5
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "conservative"
      );

      expect(positionSize).toBe(5);
      console.log("Position size limits verified");
    });

    it("should handle unknown strategy gracefully", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size for unknown strategy (should use default conservative)
      // Default conservative: 1% risk per trade, 2% stop loss
      // Risk amount = 100000 * 0.01 = 1000
      // Stop loss amount = 150 * 0.02 = 3
      // Position size = 1000 / 3 = 333.33, floored to 333
      const positionSize = await tradingService.calculatePositionSize(
        "AAPL",
        "unknown-strategy"
      );

      expect(positionSize).toBe(333);
      console.log("Unknown strategy handling verified");
    });

    it("should handle no strategy name gracefully", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: 100000.0,
        cash: 50000.0,
      });

      // Calculate position size without strategy name (should use default conservative)
      // Default conservative: 1% risk per trade, 2% stop loss
      // Risk amount = 100000 * 0.01 = 1000
      // Stop loss amount = 150 * 0.02 = 3
      // Position size = 1000 / 3 = 333.33, floored to 333
      const positionSize = await tradingService.calculatePositionSize("AAPL");

      expect(positionSize).toBe(333);
      console.log("No strategy name handling verified");
    });
  });

  describe("Order Execution", () => {
    it("should execute order with calculated quantity", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: "100000.00",
        cash: "50000.00",
      });

      // Mock order placement
      (alpacaService.placeOrder as jest.Mock).mockResolvedValue({
        id: "test-order-id",
        symbol: "AAPL",
        qty: 50,
        side: "buy",
        type: "market",
        status: "filled",
        filled_avg_price: 150.0,
        filled_qty: 50,
        filled_at: new Date().toISOString(),
      });

      const orderRequest = {
        symbol: "AAPL",
        quantity: 50,
        side: "buy" as const,
        type: "market" as const,
        strategyName: "Test Strategy",
        correlationId: "test-correlation-id",
        aiReasoning: "Test AI reasoning",
      };

      const result = await tradingService.executeOrder(orderRequest);

      expect(result).toBe(true);
      expect(alpacaService.placeOrder).toHaveBeenCalledWith({
        symbol: orderRequest.symbol,
        qty: orderRequest.quantity,
        side: orderRequest.side,
        type: orderRequest.type,
      });
      console.log("Order execution with calculated quantity verified");
    });

    it("should handle order execution errors gracefully", async () => {
      // Mock market data
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: "100000.00",
        cash: "50000.00",
      });

      // Mock order placement failure
      (alpacaService.placeOrder as jest.Mock).mockRejectedValue(
        new Error("Order placement failed")
      );

      const orderRequest = {
        symbol: "AAPL",
        side: "buy" as const,
        type: "market" as const,
        quantity: 100,
        strategyName: "Test Strategy",
        correlationId: "test-correlation-id",
      };

      await expect(tradingService.executeOrder(orderRequest)).rejects.toThrow(
        "Order placement failed"
      );
      console.log("Order execution error handling verified");
    });

    it("should validate quantity before order execution", async () => {
      // Override the placeOrder mock for this test to not interfere
      (alpacaService.placeOrder as jest.Mock).mockResolvedValueOnce({
        id: "test-order-id",
        status: "filled",
        filled_avg_price: "150.00",
        filled_qty: "50",
        filled_at: new Date().toISOString(),
      });

      // Mock market data (needed for quantity calculation)
      const mockMarketData = [
        testUtils.createMockMarketData({ symbol: "AAPL", price: 150.0 }),
      ];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarketData
      );

      // Mock account data (needed for quantity calculation)
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: "100000.00",
        cash: "50000.00",
      });

      const orderRequest = {
        symbol: "AAPL",
        side: "buy" as const,
        type: "market" as const,
        quantity: 0, // Invalid quantity
        strategyName: "Test Strategy",
      };

      await expect(tradingService.executeOrder(orderRequest)).rejects.toThrow(
        "Invalid quantity: must be greater than 0"
      );
      console.log("Quantity validation verified");
    });
  });

  describe("Strategy Evaluation", () => {
    it("should evaluate strategy rules correctly", async () => {
      // Mock market data
      const mockMarketData = testUtils.createMockMarketData({
        symbol: "AAPL",
        price: 150.0,
      });

      const evaluation = await tradingService.evaluateStrategy(
        "AAPL",
        "RSI(14) < 30",
        "RSI(14) > 70",
        mockMarketData
      );

      expect(evaluation).toHaveProperty("shouldEnter");
      expect(evaluation).toHaveProperty("shouldExit");
      expect(evaluation).toHaveProperty("confidence");
      expect(typeof evaluation.shouldEnter).toBe("boolean");
      expect(typeof evaluation.shouldExit).toBe("boolean");
      expect(typeof evaluation.confidence).toBe("number");
      console.log("Strategy evaluation verified");
    });

    it("should handle strategy evaluation errors gracefully", async () => {
      // Mock market data
      const mockMarketData = testUtils.createMockMarketData({
        symbol: "AAPL",
        price: 150.0,
      });

      // Force an error in evaluation
      const evaluation = await tradingService.evaluateStrategy(
        "AAPL",
        "INVALID_RULE",
        "ANOTHER_INVALID",
        mockMarketData
      );

      // Should return safe defaults
      expect(evaluation.shouldEnter).toBe(false);
      expect(evaluation.shouldExit).toBe(false);
      expect(evaluation.confidence).toBe(0);
      console.log("Strategy evaluation error handling verified");
    });
  });
});
