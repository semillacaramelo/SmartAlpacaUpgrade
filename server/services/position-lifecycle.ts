import { db } from "../db";
import { eq } from "drizzle-orm";
import { positions } from "@shared/schema";
import { PositionData } from "../../shared/interfaces";
import { logger } from "./logger";
import { metrics } from "./metrics";

export class PositionLifecycleManager {
  async updatePosition(update: PositionData): Promise<void> {
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
            entryPrice: update.averageEntryPrice.toString(),
            currentPrice: update.currentPrice.toString(),
            unrealizedPnL: update.unrealizedPnL.toString(),
            realizedPnL: update.realizedPnL.toString(),
          })
          .where(eq(positions.symbol, update.symbol));
      } else {
        await db.insert(positions).values({
          symbol: update.symbol,
          quantity: update.quantity,
          entryPrice: update.averageEntryPrice.toString(),
          currentPrice: update.currentPrice.toString(),
          unrealizedPnL: update.unrealizedPnL.toString(),
          realizedPnL: update.realizedPnL.toString(),
        });
      }

      metrics.updateApplicationMetrics({ requestRate: metrics.getMetrics().application.requestRate + 1 });
      logger.log({ operation: "position.update.success", metadata: { symbol: update.symbol } });
    } catch (error) {
      metrics.updateApplicationMetrics({ errorRate: metrics.getMetrics().application.errorRate + 1 });
      logger.error(error instanceof Error ? error : new Error(String(error)), { operation: "position.update.error", metadata: { update } });
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
    const currentPrice = pos.currentPrice ? parseFloat(pos.currentPrice) : 0;
    const entryPrice = parseFloat(pos.entryPrice);
    const unrealizedPnL = pos.unrealizedPnL ? parseFloat(pos.unrealizedPnL) : 0;
    const realizedPnL = pos.realizedPnL ? parseFloat(pos.realizedPnL) : 0;

    return {
      totalValue: pos.quantity * currentPrice,
      profitLoss: unrealizedPnL + realizedPnL,
      returnOnInvestment:
        entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0,
      holdingPeriodDays: pos.entryDate 
        ? Math.floor((Date.now() - pos.entryDate.getTime()) / (24 * 60 * 60 * 1000))
        : 0,
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

        metrics.updateApplicationMetrics({ requestRate: metrics.getMetrics().application.requestRate + 1 });
        logger.log({ operation: "position.close.success", metadata: { symbol } });
      }
    } catch (error) {
      metrics.updateApplicationMetrics({ errorRate: metrics.getMetrics().application.errorRate + 1 });
      logger.error(error instanceof Error ? error : new Error(String(error)), { operation: "position.close.error", metadata: { symbol } });
      throw error;
    }
  }
}
