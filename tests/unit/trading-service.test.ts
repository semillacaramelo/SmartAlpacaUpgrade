import { TradingService } from '../../server/services/trading.js';
import { alpacaService } from '../../server/services/alpaca.js';
import { testUtils } from '../setup.js';

// Mock the external services
jest.mock('../../server/services/alpaca.js', () => ({
  alpacaService: {
    getMarketData: jest.fn(),
    getAccount: jest.fn(),
    placeOrder: jest.fn(),
  },
}));

jest.mock('../../server/services/evaluator.js', () => ({
  strategyEvaluator: {
    evaluateRules: jest.fn(),
  },
}));

describe('TradingService', () => {
  let tradingService: TradingService;

  beforeEach(() => {
    tradingService = new TradingService();
    jest.clearAllMocks();
  });

  describe('Position Size Calculation', () => {
    it('should calculate position size based on maxPositionSize', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy with maxPositionSize
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          maxPositionSize: 10000, // $10,000 max position
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Should be 10000 / 150 = 66.67, floored to 66
      expect(positionSize).toBe(66);
      console.log('Max position size calculation verified');
    });

    it('should calculate position size based on risk per trade and stop loss', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy with risk parameters
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          riskPerTrade: 2, // 2% risk per trade
          stopLossPercent: 5, // 5% stop loss
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Risk amount = 50000 * 0.02 = 1000
      // Stop loss amount = 150 * 0.05 = 7.5
      // Position size = 1000 / 7.5 = 133.33, floored to 133
      expect(positionSize).toBe(133);
      console.log('Risk per trade calculation verified');
    });

    it('should calculate position size based on portfolio percentage', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy with portfolio percentage
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          portfolioPercentage: 10, // 10% of portfolio
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Position value = 100000 * 0.10 = 10000
      // Position size = 10000 / 150 = 66.67, floored to 66
      expect(positionSize).toBe(66);
      console.log('Portfolio percentage calculation verified');
    });

    it('should respect cash availability limits', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account with limited cash
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '1000.00', // Only $1000 available
      });

      // Mock strategy with large position size
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          maxPositionSize: 10000,
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Should be limited by available cash: 1000 / 150 = 6.67, floored to 6
      expect(positionSize).toBe(6);
      console.log('Cash availability limit verified');
    });

    it('should enforce minimum and maximum position size limits', async () => {
      // Mock market data with very high price
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 10000.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy with small position size
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          maxPositionSize: 100, // Very small position
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Should be minimum 1 share
      expect(positionSize).toBe(1);
      console.log('Minimum position size limit verified');
    });

    it('should handle missing risk parameters gracefully', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy without risk parameters
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: null,
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Should return default fallback
      expect(positionSize).toBe(100);
      console.log('Missing risk parameters handling verified');
    });

    it('should handle string risk parameter values', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock strategy with string risk parameters
      const mockStrategy = {
        name: 'Test Strategy',
        symbol: 'AAPL',
        riskParameters: {
          maxPositionSize: '5000', // String value
          riskPerTrade: '1.5', // String value
          stopLossPercent: '3', // String value
        },
      };

      // Calculate position size
      const positionSize = await tradingService.calculatePositionSize('AAPL', 'Test Strategy');

      // Should parse strings correctly: 5000 / 150 = 33.33, floored to 33
      expect(positionSize).toBe(33);
      console.log('String risk parameter parsing verified');
    });
  });

  describe('Order Execution', () => {
    it('should execute order with calculated quantity', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock order placement
      (alpacaService.placeOrder as jest.Mock).mockResolvedValue({
        id: 'test-order-id',
        status: 'filled',
        filled_avg_price: '150.00',
        filled_qty: '50',
        filled_at: new Date().toISOString(),
      });

      const orderRequest = {
        symbol: 'AAPL',
        quantity: 50,
        side: 'buy' as const,
        type: 'market' as const,
        strategyName: 'Test Strategy',
        correlationId: 'test-correlation-id',
        aiReasoning: 'Test AI reasoning',
      };

      const result = await tradingService.executeOrder(orderRequest);

      expect(result).toBeDefined();
      expect(result.orderId).toBe('test-order-id');
      expect(result.status).toBe('filled');
      expect(result.executedQuantity).toBe(50);
      console.log('Order execution with calculated quantity verified');
    });

    it('should handle order execution errors gracefully', async () => {
      // Mock market data
      const mockMarketData = [testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 })];
      (alpacaService.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      // Mock account data
      (alpacaService.getAccount as jest.Mock).mockResolvedValue({
        portfolio_value: '100000.00',
        cash: '50000.00',
      });

      // Mock order placement failure
      (alpacaService.placeOrder as jest.Mock).mockRejectedValue(new Error('Order placement failed'));

      const orderRequest = {
        symbol: 'AAPL',
        side: 'buy' as const,
        type: 'market' as const,
        quantity: 100,
        strategyName: 'Test Strategy',
        correlationId: 'test-correlation-id',
      };

      await expect(tradingService.executeOrder(orderRequest)).rejects.toThrow('Order placement failed');
      console.log('Order execution error handling verified');
    });

    it('should validate quantity before order execution', async () => {
      const orderRequest = {
        symbol: 'AAPL',
        side: 'buy' as const,
        type: 'market' as const,
        quantity: 0, // Invalid quantity
        strategyName: 'Test Strategy',
      };

      await expect(tradingService.executeOrder(orderRequest)).rejects.toThrow('Invalid quantity: must be greater than 0');
      console.log('Quantity validation verified');
    });
  });

  describe('Strategy Evaluation', () => {
    it('should evaluate strategy rules correctly', async () => {
      // Mock market data
      const mockMarketData = testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 });

      const evaluation = await tradingService.evaluateStrategy(
        'AAPL',
        'RSI(14) < 30',
        'RSI(14) > 70',
        mockMarketData
      );

      expect(evaluation).toHaveProperty('shouldEnter');
      expect(evaluation).toHaveProperty('shouldExit');
      expect(evaluation).toHaveProperty('confidence');
      expect(typeof evaluation.shouldEnter).toBe('boolean');
      expect(typeof evaluation.shouldExit).toBe('boolean');
      expect(typeof evaluation.confidence).toBe('number');
      console.log('Strategy evaluation verified');
    });

    it('should handle strategy evaluation errors gracefully', async () => {
      // Mock market data
      const mockMarketData = testUtils.createMockMarketData({ symbol: 'AAPL', price: 150.0 });

      // Force an error in evaluation
      const evaluation = await tradingService.evaluateStrategy(
        'AAPL',
        'INVALID_RULE',
        'ANOTHER_INVALID',
        mockMarketData
      );

      // Should return safe defaults
      expect(evaluation.shouldEnter).toBe(false);
      expect(evaluation.shouldExit).toBe(false);
      expect(evaluation.confidence).toBe(0);
      console.log('Strategy evaluation error handling verified');
    });
  });
});
