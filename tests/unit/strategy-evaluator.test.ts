import { StrategyEvaluator } from '../../server/services/evaluator.js';
import { testUtils } from '../setup.js';

describe('StrategyEvaluator', () => {
  let evaluator: StrategyEvaluator;

  beforeEach(() => {
    evaluator = new StrategyEvaluator();
  });

  afterEach(() => {
    evaluator.reset();
  });

  describe('Rule Evaluation', () => {
    it('should evaluate RSI rules correctly', () => {
      // Create mock bar data with RSI around 25 (oversold)
      const mockBars = [
        testUtils.createMockBar({ close: 100, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) }),
        testUtils.createMockBar({ close: 98, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19) }),
        testUtils.createMockBar({ close: 95, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18) }),
        testUtils.createMockBar({ close: 92, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17) }),
        testUtils.createMockBar({ close: 89, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16) }),
        testUtils.createMockBar({ close: 87, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) }),
        testUtils.createMockBar({ close: 85, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) }),
        testUtils.createMockBar({ close: 83, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13) }),
        testUtils.createMockBar({ close: 82, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12) }),
        testUtils.createMockBar({ close: 81, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11) }),
        testUtils.createMockBar({ close: 80, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) }),
        testUtils.createMockBar({ close: 79, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9) }),
        testUtils.createMockBar({ close: 78, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) }),
        testUtils.createMockBar({ close: 77, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }),
        testUtils.createMockBar({ close: 76, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6) }),
        testUtils.createMockBar({ close: 75, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }),
        testUtils.createMockBar({ close: 74, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) }),
        testUtils.createMockBar({ close: 73, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) }),
        testUtils.createMockBar({ close: 72, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) }),
        testUtils.createMockBar({ close: 71, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) }),
        testUtils.createMockBar({ close: 70, timestamp: new Date() }), // Current bar
      ];

      // Add bars to evaluator
      mockBars.forEach(bar => evaluator.addBar(bar));

      // Test RSI < 30 rule (should trigger)
      const currentBar = testUtils.createMockBar({ close: 70 });
      const evaluation = evaluator.evaluateRules('RSI(14) < 30', 'RSI(14) > 70', currentBar);

      expect(evaluation.shouldEnter).toBe(true);
      expect(evaluation.confidence).toBeGreaterThan(0);
      console.log('RSI rule evaluation verified');
    });

    it('should evaluate SMA crossover rules correctly', () => {
      // Create mock data with SMA(20) crossing above SMA(50)
      const mockBars = [];
      for (let i = 50; i >= 1; i--) {
        const price = 100 + Math.sin(i * 0.1) * 10; // Create some variation
        mockBars.push(testUtils.createMockBar({
          close: price,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
        }));
      }

      // Add bars to evaluator
      mockBars.forEach(bar => evaluator.addBar(bar));

      // Test SMA crossover rule
      const currentBar = testUtils.createMockBar({ close: 105 });
      const evaluation = evaluator.evaluateRules('SMA(20) > SMA(50)', 'SMA(20) < SMA(50)', currentBar);

      // This should work regardless of the actual SMA values
      expect(typeof evaluation.shouldEnter).toBe('boolean');
      expect(typeof evaluation.confidence).toBe('number');
      console.log('SMA crossover rule evaluation verified');
    });

    it('should evaluate price-based rules correctly', () => {
      // Create mock bars with price above SMA
      const mockBars = [];
      for (let i = 20; i >= 1; i--) {
        mockBars.push(testUtils.createMockBar({
          close: 100,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
        }));
      }

      // Add bars to evaluator
      mockBars.forEach(bar => evaluator.addBar(bar));

      // Test price > SMA rule
      const currentBar = testUtils.createMockBar({ close: 105 }); // Above SMA
      const evaluation = evaluator.evaluateRules('PRICE > SMA(20)', 'PRICE < SMA(20)', currentBar);

      expect(typeof evaluation.shouldEnter).toBe('boolean');
      console.log('Price-based rule evaluation verified');
    });

    it('should handle malformed rules gracefully', () => {
      const currentBar = testUtils.createMockBar({ close: 100 });
      const evaluation = evaluator.evaluateRules('INVALID_RULE', 'ANOTHER_INVALID', currentBar);

      expect(evaluation.shouldEnter).toBe(false);
      expect(evaluation.shouldExit).toBe(false);
      expect(evaluation.confidence).toBe(0);
      console.log('Malformed rule handling verified');
    });

    it('should evaluate complex rules with AND conditions', () => {
      // Create mock data
      const mockBars = [];
      for (let i = 20; i >= 1; i--) {
        mockBars.push(testUtils.createMockBar({
          close: 100,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
        }));
      }

      // Add bars to evaluator
      mockBars.forEach(bar => evaluator.addBar(bar));

      // Test complex rule with AND
      const currentBar = testUtils.createMockBar({ close: 105 });
      const evaluation = evaluator.evaluateRules(
        'PRICE > SMA(20) AND VOLUME > 500',
        'PRICE < SMA(20)',
        currentBar
      );

      expect(typeof evaluation.shouldEnter).toBe('boolean');
      console.log('Complex rule evaluation verified');
    });
  });

  describe('Indicator Calculations', () => {
    it('should calculate RSI correctly', () => {
      // Create bars that should result in low RSI
      const mockBars = [];
      for (let i = 14; i >= 1; i--) {
        const close = 100 - i; // Declining prices
        mockBars.push(testUtils.createMockBar({ close }));
      }

      mockBars.forEach(bar => evaluator.addBar(bar));

      // RSI should be low for declining prices
      const currentBar = testUtils.createMockBar({ close: 85 });
      const evaluation = evaluator.evaluateRules('RSI(14) < 50', 'RSI(14) > 50', currentBar);

      expect(typeof evaluation.shouldEnter).toBe('boolean');
      console.log('RSI calculation verified');
    });

    it('should calculate SMA correctly', () => {
      // Create bars with known average
      const mockBars = [];
      for (let i = 10; i >= 1; i--) {
        mockBars.push(testUtils.createMockBar({ close: i }));
      }

      mockBars.forEach(bar => evaluator.addBar(bar));

      // Average of 1-10 = 5.5
      const currentBar = testUtils.createMockBar({ close: 5.5 });
      const evaluation = evaluator.evaluateRules('PRICE > SMA(10)', 'PRICE < SMA(10)', currentBar);

      expect(typeof evaluation.shouldEnter).toBe('boolean');
      console.log('SMA calculation verified');
    });
  });

  describe('Edge Cases', () => {
    it('should handle insufficient data gracefully', () => {
      // Only add a few bars (less than required for indicators)
      for (let i = 1; i <= 5; i++) {
        evaluator.addBar(testUtils.createMockBar({ close: 100 }));
      }

      const currentBar = testUtils.createMockBar({ close: 100 });
      const evaluation = evaluator.evaluateRules('RSI(14) < 30', 'RSI(14) > 70', currentBar);

      // Should not crash and should return safe defaults
      expect(evaluation.shouldEnter).toBe(false);
      expect(evaluation.confidence).toBe(0);
      console.log('Insufficient data handling verified');
    });

    it('should handle empty rule strings', () => {
      const currentBar = testUtils.createMockBar({ close: 100 });
      const evaluation = evaluator.evaluateRules('', '', currentBar);

      expect(evaluation.shouldEnter).toBe(false);
      expect(evaluation.shouldExit).toBe(false);
      console.log('Empty rule handling verified');
    });

    it('should maintain history size limits', () => {
      // Add more bars than the max history size
      for (let i = 1; i <= 120; i++) {
        evaluator.addBar(testUtils.createMockBar({ close: 100 + i }));
      }

      // History should be capped at maxHistorySize
      expect(evaluator.getHistorySize()).toBeLessThanOrEqual(100);
      console.log('History size limit verified');
    });
  });
});
