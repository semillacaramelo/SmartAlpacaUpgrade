import { storage } from "../storage";
import { v4 as uuidv4 } from 'uuid';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface OrderRequest {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  correlationId?: string;
  strategyName?: string;
  aiReasoning?: string;
}

export interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
}

export class TradingService {
  
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    // This would integrate with Alpaca API for real market data
    // For now, return mock data structure
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    const baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

    if (!apiKey || !secretKey) {
      throw new Error('Alpaca API credentials not configured');
    }

    // Simulate API call structure - in production this would call Alpaca API
    return symbols.map(symbol => ({
      symbol,
      price: Math.random() * 200 + 100,
      volume: Math.floor(Math.random() * 1000000),
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 0.05,
      high: Math.random() * 220 + 100,
      low: Math.random() * 180 + 80,
      open: Math.random() * 200 + 90,
      previousClose: Math.random() * 200 + 95,
    }));
  }

  async executeOrder(orderRequest: OrderRequest): Promise<any> {
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    const baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

    if (!apiKey || !secretKey) {
      throw new Error('Alpaca API credentials not configured');
    }

    // In production, this would make actual API calls to Alpaca
    // For now, simulate successful order execution
    const orderId = uuidv4();
    
    await storage.createAuditLog({
      correlationId: orderRequest.correlationId,
      eventType: 'ORDER_EXECUTED',
      eventData: { orderRequest, orderId },
      source: 'trading_service',
      level: 'info'
    });

    return {
      orderId,
      status: 'filled',
      executedPrice: orderRequest.price || Math.random() * 200 + 100,
      executedQuantity: orderRequest.quantity,
      executedAt: new Date().toISOString()
    };
  }

  async backtestStrategy(
    symbol: string, 
    entryRules: string, 
    exitRules: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<BacktestResult> {
    // This would implement actual backtesting logic with historical data
    // For now, return simulated backtest results
    
    await storage.createAuditLog({
      eventType: 'BACKTEST_STARTED',
      eventData: { symbol, entryRules, exitRules, startDate, endDate },
      source: 'trading_service',
      level: 'info'
    });

    // Simulate backtest computation
    const totalReturn = (Math.random() - 0.3) * 0.5; // -0.3 to 0.2 range
    const winRate = Math.random() * 0.4 + 0.5; // 0.5 to 0.9 range
    const totalTrades = Math.floor(Math.random() * 50) + 10;
    const profitableTrades = Math.floor(totalTrades * winRate);

    const result: BacktestResult = {
      totalReturn,
      sharpeRatio: Math.random() * 2,
      maxDrawdown: Math.random() * 0.2,
      winRate,
      totalTrades,
      profitableTrades,
      averageReturn: totalReturn / totalTrades
    };

    await storage.createAuditLog({
      eventType: 'BACKTEST_COMPLETED',
      eventData: { symbol, result },
      source: 'trading_service',
      level: 'info'
    });

    return result;
  }

  async evaluateStrategy(
    symbol: string,
    entryRules: string,
    exitRules: string,
    marketData: MarketData
  ): Promise<{ shouldEnter: boolean; shouldExit: boolean; confidence: number }> {
    // This would implement the StrategyEvaluator logic
    // Parse rules and evaluate against current market data
    
    // For demonstration, simulate rule evaluation
    const shouldEnter = Math.random() > 0.7; // 30% chance to enter
    const shouldExit = Math.random() > 0.8;  // 20% chance to exit
    const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0 range

    return { shouldEnter, shouldExit, confidence };
  }

  async getPortfolioMetrics(portfolioId: string) {
    const portfolio = await storage.getPortfolioById(portfolioId);
    const openPositions = await storage.getOpenPositions(portfolioId);
    const recentTrades = await storage.getTrades(portfolioId, 10);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate additional metrics
    const totalPositions = openPositions.length;
    const totalValue = parseFloat(portfolio.totalValue);
    const dayPnL = parseFloat(portfolio.dayPnL || '0');
    const dayPnLPercent = totalValue > 0 ? (dayPnL / totalValue) * 100 : 0;

    // Calculate win rate from recent trades
    const profitableTrades = recentTrades.filter(trade => {
      // This is simplified - in reality you'd calculate P&L per trade
      return Math.random() > 0.3; // Simulate 70% win rate
    });
    const winRate = recentTrades.length > 0 ? (profitableTrades.length / recentTrades.length) * 100 : 0;

    return {
      portfolioValue: totalValue,
      dayPnL,
      dayPnLPercent,
      activePositions: totalPositions,
      winRate,
      cashBalance: parseFloat(portfolio.cashBalance),
      totalPnL: parseFloat(portfolio.totalPnL || '0')
    };
  }

  async updateSystemHealth(service: string, isHealthy: boolean, metrics: any = {}) {
    const status = isHealthy ? 'healthy' : 'degraded';
    return await storage.updateSystemHealth(service, status, metrics);
  }
}

export const tradingService = new TradingService();
