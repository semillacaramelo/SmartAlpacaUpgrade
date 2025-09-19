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
