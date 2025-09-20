import { db } from "../db";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { 
  users, 
  portfolios, 
  positions, 
  trades, 
  strategies, 
  aiDecisions, 
  auditLogs,
  tradeExecutions,
  riskMetrics,
  type InsertPosition,
  type InsertTrade,
  type InsertAuditLog,
  type InsertTradeExecution,
  type InsertRiskMetric
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface TradeExecutionData {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  portfolioId: string;
  correlationId: string;
  alpacaOrderId?: string;
}

export interface PositionUpdateData {
  positionId?: string;
  symbol: string;
  portfolioId: string;
  quantity: number;
  entryPrice: number;
  averageEntryPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL?: number;
}

export interface RiskMetricData {
  portfolioId: string;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  var95: number;
  var99: number;
}

export class TransactionService {
  /**
   * Execute a trade with full consistency - updates positions, records trade, logs audit
   */
  async executeTradeWithConsistency(
    tradeData: TradeExecutionData,
    positionData: PositionUpdateData,
    riskData?: RiskMetricData
  ): Promise<{ trade: any; position: any; execution: any }> {
    return await db.transaction(async (tx) => {
      // 1. Record the trade execution
      const [execution] = await tx.insert(tradeExecutions).values({
        symbol: tradeData.symbol,
        side: tradeData.side,
        quantity: tradeData.quantity,
        price: tradeData.price.toString(),
        executedAt: new Date(),
        orderId: tradeData.alpacaOrderId || uuidv4(),
        correlationId: tradeData.correlationId
      }).returning();

      // 2. Update or create position
      let position;
      if (positionData.positionId) {
        // Update existing position
        [position] = await tx.update(positions)
          .set({
            quantity: positionData.quantity,
            entryPrice: positionData.entryPrice.toString(),
            averageEntryPrice: positionData.averageEntryPrice.toString(),
            marketValue: positionData.marketValue.toString(),
            unrealizedPnL: positionData.unrealizedPnL.toString(),
            realizedPnL: positionData.realizedPnL?.toString()
          })
          .where(eq(positions.id, positionData.positionId))
          .returning();
      } else {
        // Create new position
        [position] = await tx.insert(positions).values({
          portfolioId: positionData.portfolioId,
          symbol: positionData.symbol,
          quantity: positionData.quantity,
          entryPrice: positionData.entryPrice.toString(),
          averageEntryPrice: positionData.averageEntryPrice.toString(),
          marketValue: positionData.marketValue.toString(),
          unrealizedPnL: positionData.unrealizedPnL.toString(),
          realizedPnL: (positionData.realizedPnL || 0).toString(),
          isOpen: positionData.quantity > 0
        }).returning();
      }

      // 3. Record trade in trades table
      const [trade] = await tx.insert(trades).values({
        portfolioId: tradeData.portfolioId,
        symbol: tradeData.symbol,
        side: tradeData.side,
        quantity: tradeData.quantity,
        price: tradeData.price.toString(),
        executedAt: new Date(),
        correlationId: tradeData.correlationId,
        orderId: tradeData.alpacaOrderId
      }).returning();

      // 4. Update risk metrics if provided
      if (riskData) {
        await tx.insert(riskMetrics).values({
          symbol: tradeData.symbol,
          sharpeRatio: riskData.sharpeRatio.toString(),
          maxDrawdown: riskData.maxDrawdown.toString(),
          volatility: riskData.volatility.toString(),
          beta: riskData.beta.toString()
        });
      }

      // 5. Create audit log
      await tx.insert(auditLogs).values({
        eventType: "TRADE_EXECUTED",
        eventData: {
          tradeId: trade.id,
          positionId: position.id,
          executionId: execution.id,
          ...tradeData
        },
        source: "transaction_service",
        level: "info",
        correlationId: tradeData.correlationId
      });

      return { trade, position, execution };
    });
  }

  /**
   * Close position with full P&L calculation and audit logging
   */
  async closePositionWithConsistency(
    positionId: string,
    exitPrice: number,
    correlationId: string
  ): Promise<{ trade: any; position: any; pnl: number }> {
    return await db.transaction(async (tx) => {
      // Get the position to close
      const [position] = await tx.select().from(positions)
        .where(eq(positions.id, positionId));

      if (!position) {
        throw new Error(`Position ${positionId} not found`);
      }

      if (position.quantity <= 0) {
        throw new Error(`Position ${positionId} has no quantity to close`);
      }

      // Calculate P&L
      const avgPrice = parseFloat(position.averageEntryPrice || position.entryPrice);
      const realizedPnl = (exitPrice - avgPrice) * position.quantity;
      const totalPnl = parseFloat(position.realizedPnL || "0") + realizedPnl;

      // Record the closing trade
      const [trade] = await tx.insert(trades).values({
        portfolioId: position.portfolioId!,
        symbol: position.symbol,
        side: "sell",
        quantity: position.quantity,
        price: exitPrice.toString(),
        executedAt: new Date(),
        correlationId
      }).returning();

      // Record trade execution
      await tx.insert(tradeExecutions).values({
        symbol: position.symbol,
        side: "sell",
        quantity: position.quantity,
        price: exitPrice.toString(),
        executedAt: new Date(),
        orderId: uuidv4(),
        correlationId
      });

      // Update position to closed
      const [updatedPosition] = await tx.update(positions)
        .set({
          quantity: 0,
          realizedPnL: totalPnl.toString(),
          marketValue: "0",
          unrealizedPnL: "0",
          isOpen: false
        })
        .where(eq(positions.id, positionId))
        .returning();

      // Create audit log
      await tx.insert(auditLogs).values({
        eventType: "POSITION_CLOSED",
        eventData: {
          positionId,
          symbol: position.symbol,
          exitPrice,
          realizedPnl,
          totalPnl
        },
        source: "transaction_service",
        level: "info",
        correlationId
      });

      return { 
        trade, 
        position: updatedPosition, 
        pnl: realizedPnl 
      };
    });
  }
}

export const transactionService = new TransactionService();