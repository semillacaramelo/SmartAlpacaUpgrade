import { PortfolioStatus, Position } from "../../shared/interfaces";
import { alpacaService } from "./alpaca";
import { storage } from "../storage";
import { wsManager } from "./websocket";

export class PortfolioService {
  private lastDayClose: Map<string, number> = new Map();

  constructor() {
    this.initializeLastClosePrices();
  }

  private async initializeLastClosePrices() {
    try {
      const positions = await alpacaService.getPositions();
      for (const position of positions) {
        const bars = await alpacaService.getBars(position.symbol, "1D", 2);
        if (bars.length > 1) {
          this.lastDayClose.set(position.symbol, bars[0].c);
        }
      }
    } catch (error) {
      console.error("Error initializing last close prices:", error);
    }
  }

  private calculateDayPnL(position: Position, lastClose: number): number {
    return position.quantity * (position.currentPrice - lastClose);
  }

  private calculateUnrealizedPnL(position: Position): number {
    return (
      position.quantity * (position.currentPrice - position.averageEntryPrice)
    );
  }

  public async getPortfolioStatus(): Promise<PortfolioStatus> {
    try {
      const account = await alpacaService.getAccount();
      const alpacaPositions = await alpacaService.getPositions();

      const positions: Position[] = await Promise.all(
        alpacaPositions.map(async (p) => {
          const lastClose = this.lastDayClose.get(p.symbol) || p.current_price;

          const position: Position = {
            symbol: p.symbol,
            quantity: p.qty,
            averageEntryPrice: p.avg_entry_price,
            currentPrice: p.current_price,
            marketValue: p.market_value,
            unrealizedPnL: this.calculateUnrealizedPnL({
              symbol: p.symbol,
              quantity: p.qty,
              averageEntryPrice: p.avg_entry_price,
              currentPrice: p.current_price,
              marketValue: p.market_value,
              unrealizedPnL: 0,
              realizedPnL: p.unrealized_pl,
              dayPnL: 0,
            }),
            realizedPnL: p.unrealized_pl,
            dayPnL: this.calculateDayPnL(
              {
                symbol: p.symbol,
                quantity: p.qty,
                averageEntryPrice: p.avg_entry_price,
                currentPrice: p.current_price,
                marketValue: p.market_value,
                unrealizedPnL: 0,
                realizedPnL: p.unrealized_pl,
                dayPnL: 0,
              },
              lastClose
            ),
          };

          return position;
        })
      );

      const status: PortfolioStatus = {
        totalValue: account.portfolio_value,
        cashBalance: account.cash,
        positions,
        dayPnL: positions.reduce((sum, pos) => sum + pos.dayPnL, 0),
        totalPnL: positions.reduce(
          (sum, pos) => sum + pos.unrealizedPnL + pos.realizedPnL,
          0
        ),
        timestamp: new Date().toISOString(),
      };

      // Store the status update
      await this.storePortfolioStatus(status);

      // Broadcast the update via WebSocket
      this.broadcastUpdate(status);

      return status;
    } catch (error) {
      console.error("Error getting portfolio status:", error);
      throw new Error("Failed to get portfolio status");
    }
  }

  private async storePortfolioStatus(status: PortfolioStatus) {
    try {
      const user = await storage.getUserByUsername("demo-user");
      if (user) {
        await storage.updatePortfolio(user.id, {
          totalValue: status.totalValue.toString(),
          cashBalance: status.cashBalance.toString(),
        });
      }
    } catch (error) {
      console.error("Error storing portfolio status:", error);
    }
  }

  private broadcastUpdate(status: PortfolioStatus) {
    if (wsManager) {
      wsManager.broadcastPortfolioUpdate(status);
    }
  }

  // Method to update last close prices at market close
  public async updateLastClosePrices() {
    try {
      const positions = await alpacaService.getPositions();
      for (const position of positions) {
        const bars = await alpacaService.getBars(position.symbol, "1D", 1);
        if (bars.length > 0) {
          this.lastDayClose.set(position.symbol, bars[0].c);
        }
      }
    } catch (error) {
      console.error("Error updating last close prices:", error);
    }
  }
}

export const portfolioService = new PortfolioService();
