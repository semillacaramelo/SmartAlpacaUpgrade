import { DrizzleError } from "drizzle-orm";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { tradeExecutions, positions, riskMetrics } from "../schema";
import {
  TradeExecution,
  PositionUpdate,
  RiskMetrics,
} from "../../shared/interfaces";
import { logger } from "./logger";
import { metrics } from "./metrics";

export class PositionManagementService {
  async trackExecution(execution: TradeExecution): Promise<void> {
    try {
      await db.insert(tradeExecutions).values({
        orderId: execution.orderId,
        symbol: execution.symbol,
        quantity: execution.quantity,
        price: execution.price,
        side: execution.side,
        timestamp: execution.timestamp,
        executionId: execution.executionId,
        commission: execution.commission,
      });

      metrics.increment("trade.execution.success");
      logger.info("Trade execution tracked successfully", {
        executionId: execution.executionId,
      });
    } catch (error) {
      metrics.increment("trade.execution.error");
      logger.error("Failed to track trade execution", { error, execution });
      throw error;
    }
  }

  async getExecutionHistory(symbol: string): Promise<TradeExecution[]> {
    try {
      const executions = await db
        .select()
        .from(tradeExecutions)
        .where(eq(tradeExecutions.symbol, symbol))
        .orderBy(tradeExecutions.timestamp);

      return executions;
    } catch (error) {
      logger.error("Failed to fetch execution history", { error, symbol });
      throw error;
    }
  }

  async calculateExecutionAnalytics(symbol: string) {
    const executions = await this.getExecutionHistory(symbol);
    return {
      totalTrades: executions.length,
      volume: executions.reduce(
        (sum, exec) => sum + exec.quantity * exec.price,
        0
      ),
      averagePrice:
        executions.reduce((sum, exec) => sum + exec.price, 0) /
        executions.length,
      totalCommission: executions.reduce(
        (sum, exec) => sum + exec.commission,
        0
      ),
    };
  }
}
