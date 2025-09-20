import { db } from "../db";
import { eq } from "drizzle-orm";
import { riskMetrics, positions } from "../../shared/schema";
import { RiskMetrics } from "../../shared/interfaces";
import { logger } from "./logger";
import { metrics } from "./metrics";

export class RiskControlService {
  private readonly MAX_POSITION_SIZE = 0.1; // 10% of portfolio
  private readonly MAX_PORTFOLIO_EXPOSURE = 0.8; // 80% of portfolio
  private readonly STOP_LOSS_THRESHOLD = 0.02; // 2% loss threshold

  async updateRiskMetrics(
    symbol: string,
    riskData: RiskMetrics
  ): Promise<void> {
    try {
      // Convert RiskMetrics to database format (numbers to strings for decimal fields)
      const dbRiskData = {
        sharpeRatio: riskData.sharpeRatio.toString(),
        maxDrawdown: riskData.maxDrawdown.toString(),
        volatility: riskData.volatility.toString(),
        beta: riskData.beta.toString(),
        alpha: riskData.alpha.toString(),
        winRate: riskData.winRate.toString(),
        profitFactor: riskData.profitFactor.toString(),
        averageReturn: riskData.averageReturn.toString(),
        totalReturn: riskData.totalReturn.toString(),
      };

      const existing = await db
        .select()
        .from(riskMetrics)
        .where(eq(riskMetrics.symbol, symbol))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(riskMetrics)
          .set({
            ...dbRiskData,
            updatedAt: new Date(),
          })
          .where(eq(riskMetrics.symbol, symbol));
      } else {
        await db.insert(riskMetrics).values({
          symbol,
          ...dbRiskData,
          updatedAt: new Date(),
        });
      }

      metrics.updateApplicationMetrics({ requestRate: metrics.getMetrics().application.requestRate + 1 });
      logger.log({ operation: "risk.metrics.update.success", metadata: { symbol } });
    } catch (error) {
      metrics.updateApplicationMetrics({ errorRate: metrics.getMetrics().application.errorRate + 1 });
      logger.error(error instanceof Error ? error : new Error(String(error)), { 
        operation: "risk.metrics.update.error", 
        metadata: { symbol }
      });
      throw error;
    }
  }

  async validatePositionSize(
    symbol: string,
    size: number,
    portfolioValue: number
  ): Promise<boolean> {
    const sizeRatio = size / portfolioValue;
    if (sizeRatio > this.MAX_POSITION_SIZE) {
      logger.warn("Position size exceeds maximum allowed", {
        operation: "position.size.validation",
        metadata: {
          symbol,
          sizeRatio,
          maxAllowed: this.MAX_POSITION_SIZE,
        }
      });
      return false;
    }
    return true;
  }

  async checkPortfolioExposure(): Promise<boolean> {
    const allPositions = await db.select().from(positions);
    const totalExposure = allPositions.reduce(
      (sum, pos) => {
        const currentPrice = pos.currentPrice ? parseFloat(pos.currentPrice) : 0;
        return sum + pos.quantity * currentPrice;
      },
      0
    );

    const portfolioValue = await this.getPortfolioValue();
    const exposureRatio = totalExposure / portfolioValue;

    if (exposureRatio > this.MAX_PORTFOLIO_EXPOSURE) {
      logger.warn("Portfolio exposure exceeds maximum allowed", {
        operation: "portfolio.exposure.validation",
        metadata: {
          exposureRatio,
          maxAllowed: this.MAX_PORTFOLIO_EXPOSURE,
        }
      });
      return false;
    }
    return true;
  }

  async checkStopLoss(symbol: string): Promise<boolean> {
    const position = await db
      .select()
      .from(positions)
      .where(eq(positions.symbol, symbol))
      .limit(1);

    if (!position.length) {
      return true;
    }

    const pos = position[0];
    const avgPrice = pos.averageEntryPrice ? parseFloat(pos.averageEntryPrice) : parseFloat(pos.entryPrice);
    const currentPrice = pos.currentPrice ? parseFloat(pos.currentPrice) : 0;
    
    if (avgPrice === 0) {
      return true; // Can't calculate loss ratio without entry price
    }
    
    const lossRatio = (avgPrice - currentPrice) / avgPrice;

    if (lossRatio > this.STOP_LOSS_THRESHOLD) {
      logger.warn("Stop loss triggered", {
        operation: "stop.loss.triggered",
        metadata: {
          symbol,
          lossRatio,
          threshold: this.STOP_LOSS_THRESHOLD,
        }
      });
      return false;
    }
    return true;
  }

  private async getPortfolioValue(): Promise<number> {
    // Implementation would depend on your portfolio service
    // This is a placeholder
    return 100000; // $100,000 placeholder
  }
}
