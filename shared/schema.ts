import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  decimal,
  integer,
  timestamp,
  boolean,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  // API Settings fields added to users table
  alpacaApiKey: text("alpaca_api_key"),
  alpacaSecretKey: text("alpaca_secret_key"),
  geminiApiKey: text("gemini_api_key"),
  enablePaperTrading: boolean("enable_paper_trading").default(true),
  enableRealTrading: boolean("enable_real_trading").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  cashBalance: decimal("cash_balance", { precision: 15, scale: 2 }).notNull(),
  dayPnL: decimal("day_pnl", { precision: 15, scale: 2 }).default("0"),
  totalPnL: decimal("total_pnl", { precision: 15, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const positions = pgTable("positions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 4 }).notNull(),
  averageEntryPrice: decimal("average_entry_price", { precision: 10, scale: 4 }), // Add for compatibility
  currentPrice: decimal("current_price", { precision: 10, scale: 4 }),
  marketValue: decimal("market_value", { precision: 15, scale: 2 }),
  unrealizedPnL: decimal("unrealized_pnl", { precision: 15, scale: 2 }),
  isOpen: boolean("is_open").default(true),
  entryDate: timestamp("entry_date").defaultNow(),
  exitDate: timestamp("exit_date"),
  exitPrice: decimal("exit_price", { precision: 10, scale: 4 }),
  realizedPnL: decimal("realized_pnl", { precision: 15, scale: 2 }),
  strategyId: text("strategy_id"),
  correlationId: text("correlation_id"),
});

export const trades = pgTable("trades", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").references(() => portfolios.id),
  positionId: varchar("position_id").references(() => positions.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'buy' or 'sell'
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
  orderId: text("order_id"),
  correlationId: text("correlation_id"),
  strategyName: text("strategy_name"),
  aiReasoning: text("ai_reasoning"),
});

export const strategies = pgTable("strategies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  entryRules: text("entry_rules").notNull(),
  exitRules: text("exit_rules").notNull(),
  riskParameters: jsonb("risk_parameters"),
  backtestResults: jsonb("backtest_results"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  status: text("status").default("staged"), // 'staged', 'active', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  correlationId: text("correlation_id"),
  aiMetadata: jsonb("ai_metadata"),
});

export const aiDecisions = pgTable("ai_decisions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  correlationId: text("correlation_id").notNull(),
  stage: text("stage").notNull(), // 'market_scan', 'asset_selection', 'strategy_generation', 'validation', 'staging', 'execution'
  input: jsonb("input"),
  output: jsonb("output"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  processingTime: integer("processing_time_ms"),
  status: text("status").notNull(), // 'success', 'failed', 'pending'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  alpacaApiKey: text("alpaca_api_key"),
  alpacaSecretKey: text("alpaca_secret_key"),
  geminiApiKey: text("gemini_api_key"),
  enablePaperTrading: boolean("enable_paper_trading").default(true),
  enableRealTrading: boolean("enable_real_trading").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  correlationId: text("correlation_id"),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  userId: varchar("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
  source: text("source"), // 'api', 'worker', 'ai', 'system'
  level: text("level").default("info"), // 'info', 'warn', 'error', 'debug'
});

export const systemHealth = pgTable("system_health", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  service: text("service").notNull(),
  status: text("status").notNull(), // 'healthy', 'degraded', 'down'
  metrics: jsonb("metrics"),
  lastCheck: timestamp("last_check").defaultNow(),
});

export const tradeExecutions = pgTable("trade_executions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'buy' | 'sell'
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 6 }).notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
  orderId: text("order_id").notNull(),
  correlationId: text("correlation_id"),
  strategyName: text("strategy_name"),
  aiReasoning: text("ai_reasoning"),
  timestamp: timestamp("timestamp").defaultNow(),
  executionId: text("execution_id"),
  commission: decimal("commission", { precision: 15, scale: 6 }),
});

export const riskMetrics = pgTable("risk_metrics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  sharpeRatio: decimal("sharpe_ratio", { precision: 15, scale: 6 }),
  maxDrawdown: decimal("max_drawdown", { precision: 15, scale: 6 }),
  volatility: decimal("volatility", { precision: 15, scale: 6 }),
  beta: decimal("beta", { precision: 15, scale: 6 }),
  alpha: decimal("alpha", { precision: 15, scale: 6 }),
  winRate: decimal("win_rate", { precision: 15, scale: 6 }),
  profitFactor: decimal("profit_factor", { precision: 15, scale: 6 }),
  averageReturn: decimal("average_return", { precision: 15, scale: 6 }),
  totalReturn: decimal("total_return", { precision: 15, scale: 6 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  auditLogs: many(auditLogs),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, { fields: [portfolios.userId], references: [users.id] }),
  positions: many(positions),
  trades: many(trades),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [positions.portfolioId],
    references: [portfolios.id],
  }),
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [trades.portfolioId],
    references: [portfolios.id],
  }),
  position: one(positions, {
    fields: [trades.positionId],
    references: [positions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  updatedAt: true,
});
export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  entryDate: true,
  exitDate: true,
});
export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});
export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
});
export const insertAiDecisionSchema = createInsertSchema(aiDecisions).omit({
  id: true,
  createdAt: true,
});
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});
export const insertSystemHealthSchema = createInsertSchema(systemHealth).omit({
  id: true,
  lastCheck: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type AiDecision = typeof aiDecisions.$inferSelect;
export type InsertAiDecision = z.infer<typeof insertAiDecisionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SystemHealth = typeof systemHealth.$inferSelect;
export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;
export type TradeExecution = typeof tradeExecutions.$inferSelect;
export type InsertTradeExecution = typeof tradeExecutions.$inferInsert;
export type RiskMetric = typeof riskMetrics.$inferSelect;
export type InsertRiskMetric = typeof riskMetrics.$inferInsert;

// API Response Types
export interface PortfolioStatus {
  portfolioValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  activePositions: number;
  winRate: number;
  cashBalance: number;
  totalPnL: number;
}

export interface SystemMetrics {
  bot_status: "running" | "stopped" | "error";
  system_health: SystemHealth[];
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
}

export interface PositionData {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  isOpen: boolean;
  entryDate: string;
  strategyId?: string;
  correlationId?: string;
}
