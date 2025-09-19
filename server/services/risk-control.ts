import { db } from "../db";
import { eq } from "drizzle-orm";
import { riskMetrics, positions } from "../schema";
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
      const existing = await db
        .select()
        .from(riskMetrics)
        .where(eq(riskMetrics.symbol, symbol))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(riskMetrics)
          .set({
            ...riskData,
            lastUpdated: new Date(),
          })
          .where(eq(riskMetrics.symbol, symbol));
      } else {
        await db.insert(riskMetrics).values({
          symbol,
          ...riskData,
          lastUpdated: new Date(),
        });
      }

      metrics.increment("risk.metrics.update.success");
      logger.info("Risk metrics updated successfully", { symbol });
    } catch (error) {
      metrics.increment("risk.metrics.update.error");
      logger.error("Failed to update risk metrics", { error, symbol });
      throw error;
    }
  }

  async validatePositionSize(
    symbol: string,
    size: number,
    portfolioValue: number
  ): boolean {
    const sizeRatio = size / portfolioValue;
    if (sizeRatio > this.MAX_POSITION_SIZE) {
      logger.warn("Position size exceeds maximum allowed", {
        symbol,
        sizeRatio,
        maxAllowed: this.MAX_POSITION_SIZE,
      });
      return false;
    }
    return true;
  }

  async checkPortfolioExposure(): Promise<boolean> {
    const allPositions = await db.select().from(positions);
    const totalExposure = allPositions.reduce(
      (sum, pos) => sum + pos.quantity * pos.currentPrice,
      0
    );

    const portfolioValue = await this.getPortfolioValue();
    const exposureRatio = totalExposure / portfolioValue;

    if (exposureRatio > this.MAX_PORTFOLIO_EXPOSURE) {
      logger.warn("Portfolio exposure exceeds maximum allowed", {
        exposureRatio,
        maxAllowed: this.MAX_PORTFOLIO_EXPOSURE,
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
    const lossRatio =
      (pos.averageEntryPrice - pos.currentPrice) / pos.averageEntryPrice;

    if (lossRatio > this.STOP_LOSS_THRESHOLD) {
      logger.warn("Stop loss triggered", {
        symbol,
        lossRatio,
        threshold: this.STOP_LOSS_THRESHOLD,
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
