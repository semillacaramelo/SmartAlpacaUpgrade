// Portfolio and Position Interfaces
export interface PortfolioStatus {
  totalValue: number;
  cashBalance: number;
  positions: Position[];
  dayPnL: number;
  totalPnL: number;
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayPnL: number;
}

export interface PortfolioUpdate {
  type: "portfolio_update";
  data: PortfolioStatus;
  timestamp: string;
}

export interface PositionUpdate {
  type: "position_update";
  data: Position;
  timestamp: string;
}

// Direct position data for internal updates
export interface PositionData {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number; // Changed from unrealizedPL to match Position interface
  realizedPnL: number;   // Changed from realizedPL to match Position interface
  holdingPeriod?: number;
}

// Trading and Execution Interfaces
export interface TradeExecution {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  executedAt: Date;
  orderId: string;
  correlationId?: string;
  strategyName?: string;
  aiReasoning?: string;
  timestamp?: Date;     // Added to match schema
  executionId?: string; // Added to match schema
  commission?: number;  // Added to match schema
}

// Risk Management Interfaces
export interface RiskMetrics {
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  alpha: number;
  winRate: number;
  profitFactor: number;
  averageReturn: number;
  totalReturn: number;
}
