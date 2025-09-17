import { RSI, SMA, EMA, MACD, BollingerBands } from 'technicalindicators';

export interface MarketBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyEvaluation {
  shouldEnter: boolean;
  shouldExit: boolean;
  confidence: number;
  signals: {
    entry: boolean;
    exit: boolean;
    strength: number;
  };
}

export class StrategyEvaluator {
  private priceHistory: MarketBar[] = [];
  private maxHistorySize = 100; // Keep last 100 bars for indicators

  addBar(bar: MarketBar) {
    this.priceHistory.push(bar);
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory.shift(); // Remove oldest bar
    }
  }

  evaluateRules(entryRules: string, exitRules: string, currentBar: MarketBar): StrategyEvaluation {
    try {
      // Add current bar to history
      this.addBar(currentBar);

      // Parse and evaluate entry rules
      const entryResult = this.evaluateRuleString(entryRules, 'entry');

      // Parse and evaluate exit rules
      const exitResult = this.evaluateRuleString(exitRules, 'exit');

      // Calculate confidence based on signal strength
      const confidence = Math.min(1.0, (entryResult.strength + exitResult.strength) / 2);

      return {
        shouldEnter: entryResult.signal,
        shouldExit: exitResult.signal,
        confidence,
        signals: {
          entry: entryResult.signal,
          exit: exitResult.signal,
          strength: confidence
        }
      };
    } catch (error: any) {
      console.error('Error evaluating strategy rules:', error);
      return {
        shouldEnter: false,
        shouldExit: false,
        confidence: 0,
        signals: {
          entry: false,
          exit: false,
          strength: 0
        }
      };
    }
  }

  private evaluateRuleString(ruleString: string, ruleType: 'entry' | 'exit'): { signal: boolean; strength: number } {
    try {
      // Parse the rule string (simplified implementation)
      // In a real implementation, this would be a proper expression parser

      const rules = ruleString.split(' AND ').map(r => r.trim());

      let signalStrength = 0;
      let conditionsMet = 0;

      for (const rule of rules) {
        const result = this.evaluateSingleRule(rule);
        if (result.signal) {
          conditionsMet++;
          signalStrength += result.strength;
        }
      }

      const allConditionsMet = conditionsMet === rules.length;
      const averageStrength = rules.length > 0 ? signalStrength / rules.length : 0;

      return {
        signal: allConditionsMet,
        strength: averageStrength
      };
    } catch (error) {
      console.error(`Error evaluating ${ruleType} rule "${ruleString}":`, error);
      return { signal: false, strength: 0 };
    }
  }

  private evaluateSingleRule(rule: string): { signal: boolean; strength: number } {
    try {
      // Parse rule strings like "RSI(14) < 30", "SMA(20) > SMA(50)", "PRICE > SMA(20)"

      // RSI rule: RSI(period) <|>|= value
      const rsiMatch = rule.match(/RSI\((\d+)\)\s*([<>=]+)\s*(\d+(?:\.\d+)?)/);
      if (rsiMatch) {
        const period = parseInt(rsiMatch[1]);
        const operator = rsiMatch[2];
        const threshold = parseFloat(rsiMatch[3]);

        const rsiValue = this.calculateRSI(period);
        if (rsiValue !== null) {
          const signal = this.compareValues(rsiValue, operator, threshold);
          // Strength based on how far RSI is from the threshold (normalized)
          const distance = Math.abs(rsiValue - threshold) / 50; // RSI ranges 0-100
          const strength = Math.min(1.0, distance);

          return { signal, strength };
        }
      }

      // SMA rule: SMA(period1) >|<|= SMA(period2) or SMA(period) >|<|= value
      const smaMatch = rule.match(/SMA\((\d+)\)\s*([<>=]+)\s*(?:SMA\((\d+)\)|(\d+(?:\.\d+)?))/);
      if (smaMatch) {
        const period1 = parseInt(smaMatch[1]);
        const operator = smaMatch[2];
        const period2 = smaMatch[3] ? parseInt(smaMatch[3]) : null;
        const value = smaMatch[4] ? parseFloat(smaMatch[4]) : null;

        const sma1 = this.calculateSMA(period1);
        let compareValue: number | null = null;

        if (period2) {
          compareValue = this.calculateSMA(period2);
        } else if (value !== null) {
          compareValue = value;
        }

        if (sma1 !== null && compareValue !== null) {
          const signal = this.compareValues(sma1, operator, compareValue);
          // Strength based on percentage difference
          const ratio = Math.abs(sma1 - compareValue) / Math.max(sma1, compareValue);
          const strength = Math.min(1.0, ratio);

          return { signal, strength };
        }
      }

      // EMA rule: EMA(period1) >|<|= EMA(period2) or EMA(period) >|<|= value
      const emaMatch = rule.match(/EMA\((\d+)\)\s*([<>=]+)\s*(?:EMA\((\d+)\)|(\d+(?:\.\d+)?))/);
      if (emaMatch) {
        const period1 = parseInt(emaMatch[1]);
        const operator = emaMatch[2];
        const period2 = emaMatch[3] ? parseInt(emaMatch[3]) : null;
        const value = emaMatch[4] ? parseFloat(emaMatch[4]) : null;

        const ema1 = this.calculateEMA(period1);
        let compareValue: number | null = null;

        if (period2) {
          compareValue = this.calculateEMA(period2);
        } else if (value !== null) {
          compareValue = value;
        }

        if (ema1 !== null && compareValue !== null) {
          const signal = this.compareValues(ema1, operator, compareValue);
          const ratio = Math.abs(ema1 - compareValue) / Math.max(ema1, compareValue);
          const strength = Math.min(1.0, ratio);

          return { signal, strength };
        }
      }

      // MACD rule: MACD >|<|= value
      const macdMatch = rule.match(/MACD\s*([<>=]+)\s*(\d+(?:\.\d+)?)/);
      if (macdMatch) {
        const operator = macdMatch[1];
        const threshold = parseFloat(macdMatch[2]);

        const macdValue = this.calculateMACD();
        if (macdValue !== null) {
          const signal = this.compareValues(macdValue, operator, threshold);
          const distance = Math.abs(macdValue - threshold);
          const strength = Math.min(1.0, distance / Math.abs(threshold || 1));

          return { signal, strength };
        }
      }

      // Bollinger Bands rule: PRICE >|<|= BB_UPPER(period) or PRICE >|<|= BB_LOWER(period)
      const bbMatch = rule.match(/PRICE\s*([<>=]+)\s*BB_(UPPER|LOWER)\((\d+)\)/);
      if (bbMatch) {
        const operator = bbMatch[1];
        const bandType = bbMatch[2];
        const period = parseInt(bbMatch[3]);

        const currentPrice = this.priceHistory[this.priceHistory.length - 1]?.close || 0;
        const bbValue = bandType === 'UPPER' ? this.calculateBBUpper(period) : this.calculateBBLower(period);

        if (bbValue !== null) {
          const signal = this.compareValues(currentPrice, operator, bbValue);
          const ratio = Math.abs(currentPrice - bbValue) / bbValue;
          const strength = Math.min(1.0, ratio);

          return { signal, strength };
        }
      }

      // Price-based rules: PRICE >|<|= SMA(period) or PRICE >|<|= value
      const priceMatch = rule.match(/PRICE\s*([<>=]+)\s*(?:SMA\((\d+)\)|(\d+(?:\.\d+)?))/);
      if (priceMatch) {
        const operator = priceMatch[1];
        const smaPeriod = priceMatch[2] ? parseInt(priceMatch[2]) : null;
        const value = priceMatch[3] ? parseFloat(priceMatch[3]) : null;

        const currentPrice = this.priceHistory[this.priceHistory.length - 1]?.close || 0;
        let compareValue: number | null = null;

        if (smaPeriod) {
          compareValue = this.calculateSMA(smaPeriod);
        } else if (value !== null) {
          compareValue = value;
        }

        if (compareValue !== null) {
          const signal = this.compareValues(currentPrice, operator, compareValue);
          const ratio = Math.abs(currentPrice - compareValue) / Math.max(currentPrice, compareValue);
          const strength = Math.min(1.0, ratio);

          return { signal, strength };
        }
      }

      // Volume-based rules: VOLUME >|<|= value
      const volumeMatch = rule.match(/VOLUME\s*([<>=]+)\s*(\d+)/);
      if (volumeMatch) {
        const operator = volumeMatch[1];
        const threshold = parseInt(volumeMatch[2]);

        const currentVolume = this.priceHistory[this.priceHistory.length - 1]?.volume || 0;
        const signal = this.compareValues(currentVolume, operator, threshold);
        const ratio = Math.abs(currentVolume - threshold) / Math.max(currentVolume, threshold);
        const strength = Math.min(1.0, ratio);

        return { signal, strength };
      }

      // Default: no signal
      return { signal: false, strength: 0 };

    } catch (error) {
      console.error(`Error evaluating rule "${rule}":`, error);
      return { signal: false, strength: 0 };
    }
  }

  private calculateRSI(period: number): number | null {
    if (this.priceHistory.length < period + 1) return null;

    const closes = this.priceHistory.map(bar => bar.close);
    const rsi = RSI.calculate({
      period: period,
      values: closes
    });

    return rsi.length > 0 ? rsi[rsi.length - 1] : null;
  }

  private calculateSMA(period: number): number | null {
    if (this.priceHistory.length < period) return null;

    const closes = this.priceHistory.map(bar => bar.close);
    const sma = SMA.calculate({
      period: period,
      values: closes
    });

    return sma.length > 0 ? sma[sma.length - 1] : null;
  }

  private calculateEMA(period: number): number | null {
    if (this.priceHistory.length < period) return null;

    const closes = this.priceHistory.map(bar => bar.close);
    const ema = EMA.calculate({
      period: period,
      values: closes
    });

    return ema.length > 0 ? ema[ema.length - 1] : null;
  }

  private calculateMACD(): number | null {
    if (this.priceHistory.length < 26) return null; // MACD needs at least 26 periods

    const closes = this.priceHistory.map(bar => bar.close);
    const macd = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    return macd.length > 0 ? (macd[macd.length - 1].histogram ?? null) : null;
  }

  private calculateBBUpper(period: number): number | null {
    if (this.priceHistory.length < period) return null;

    const closes = this.priceHistory.map(bar => bar.close);
    const bb = BollingerBands.calculate({
      period: period,
      values: closes,
      stdDev: 2
    });

    return bb.length > 0 ? bb[bb.length - 1].upper : null;
  }

  private calculateBBLower(period: number): number | null {
    if (this.priceHistory.length < period) return null;

    const closes = this.priceHistory.map(bar => bar.close);
    const bb = BollingerBands.calculate({
      period: period,
      values: closes,
      stdDev: 2
    });

    return bb.length > 0 ? bb[bb.length - 1].lower : null;
  }

  private compareValues(value1: number, operator: string, value2: number): boolean {
    switch (operator) {
      case '>': return value1 > value2;
      case '<': return value1 < value2;
      case '>=': return value1 >= value2;
      case '<=': return value1 <= value2;
      case '=':
      case '==': return value1 === value2;
      default: return false;
    }
  }

  // Reset the evaluator state
  reset() {
    this.priceHistory = [];
  }

  // Get current history size
  getHistorySize(): number {
    return this.priceHistory.length;
  }
}

export const strategyEvaluator = new StrategyEvaluator();
