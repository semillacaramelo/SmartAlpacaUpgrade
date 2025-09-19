import { db } from "../db";
import { eq } from "drizzle-orm";
import { positions } from "../schema";
import { PositionUpdate } from "../../shared/interfaces";
import { logger } from "./logger";
import { metrics } from "./metrics";

export class PositionLifecycleManager {
  async updatePosition(update: PositionUpdate): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(positions)
        .where(eq(positions.symbol, update.symbol))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(positions)
          .set({
            quantity: update.quantity,
            averageEntryPrice: update.averageEntryPrice,
            currentPrice: update.currentPrice,
            unrealizedPL: update.unrealizedPL,
            realizedPL: update.realizedPL,
            holdingPeriod: update.holdingPeriod,
            lastUpdated: new Date(),
          })
          .where(eq(positions.symbol, update.symbol));
      } else {
        await db.insert(positions).values({
          ...update,
          lastUpdated: new Date(),
        });
      }

      metrics.increment("position.update.success");
      logger.info("Position updated successfully", { symbol: update.symbol });
    } catch (error) {
      metrics.increment("position.update.error");
      logger.error("Failed to update position", { error, update });
      throw error;
    }
  }

  async calculatePositionMetrics(symbol: string) {
    const position = await db
      .select()
      .from(positions)
      .where(eq(positions.symbol, symbol))
      .limit(1);

    if (!position.length) {
      return null;
    }

    const pos = position[0];
    return {
      totalValue: pos.quantity * pos.currentPrice,
      profitLoss: pos.unrealizedPL + pos.realizedPL,
      returnOnInvestment:
        ((pos.currentPrice - pos.averageEntryPrice) / pos.averageEntryPrice) *
        100,
      holdingPeriodDays: pos.holdingPeriod / (24 * 60 * 60 * 1000), // Convert from milliseconds to days
    };
  }

  async closePosition(symbol: string): Promise<void> {
    try {
      const position = await db
        .select()
        .from(positions)
        .where(eq(positions.symbol, symbol))
        .limit(1);

      if (position.length > 0) {
        await db.delete(positions).where(eq(positions.symbol, symbol));

        metrics.increment("position.close.success");
        logger.info("Position closed successfully", { symbol });
      }
    } catch (error) {
      metrics.increment("position.close.error");
      logger.error("Failed to close position", { error, symbol });
      throw error;
    }
  }
}
