import { DrizzleError } from "drizzle-orm";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { tradeExecutions, positions, riskMetrics } from "../../shared/schema";
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
        price: execution.price.toString(), // Convert to string for decimal field
        side: execution.side,
        timestamp: execution.timestamp,
        executionId: execution.executionId,
        commission: execution.commission?.toString(), // Convert to string for decimal field
      });

      metrics.updateApplicationMetrics({ requestRate: metrics.getMetrics().application.requestRate + 1 });
      logger.log({ operation: "trade.execution.success", metadata: {
        executionId: execution.executionId,
        symbol: execution.symbol
      } });
    } catch (error) {
      metrics.updateApplicationMetrics({ errorRate: metrics.getMetrics().application.errorRate + 1 });
      logger.error(error instanceof Error ? error : new Error(String(error)), { 
        operation: "trade.execution.error", 
        metadata: { execution }
      });
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

      // Transform database results to match TradeExecution interface
      return executions.map(exec => ({
        ...exec,
        side: exec.side as "buy" | "sell", // Cast to proper type
        price: parseFloat(exec.price), // Convert string to number
        commission: exec.commission ? parseFloat(exec.commission) : undefined,
        executedAt: exec.executedAt || new Date(),
        timestamp: exec.timestamp || undefined,
        correlationId: exec.correlationId || undefined, // Convert null to undefined
        strategyName: exec.strategyName || undefined,   // Convert null to undefined
        aiReasoning: exec.aiReasoning || undefined,     // Convert null to undefined
        executionId: exec.executionId || undefined,     // Convert null to undefined
      }));
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), { 
        operation: "fetch.execution.history", 
        metadata: { symbol }
      });
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
        (sum, exec) => sum + (exec.commission || 0),
        0
      ),
    };
  }
}
