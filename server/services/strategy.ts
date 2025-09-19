import { getCurrentPrice, type HistoricalBar } from "./alpaca";

async function evaluateSimpleEntry(bar: HistoricalBar): Promise<boolean> {
  // Simple moving average crossover strategy
  const price = bar.c;
  const sma20 = await calculateSMA(bar.symbol, 20);
  const sma50 = await calculateSMA(bar.symbol, 50);

  return sma20 > sma50 && price > sma20;
}

async function calculateSMA(symbol: string, period: number): Promise<number> {
  // Implementation of SMA calculation
  return 0; // Placeholder
}

export { evaluateSimpleEntry, calculateSMA };
