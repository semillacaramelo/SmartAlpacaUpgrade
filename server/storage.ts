import {
  users,
  portfolios,
  positions,
  trades,
  strategies,
  aiDecisions,
  auditLogs,
  systemHealth,
  userSettings,
  type User,
  type InsertUser,
  type Portfolio,
  type InsertPortfolio,
  type Position,
  type InsertPosition,
  type Trade,
  type InsertTrade,
  type Strategy,
  type InsertStrategy,
  type AiDecision,
  type InsertAiDecision,
  type AuditLog,
  type InsertAuditLog,
  type SystemHealth,
  type InsertSystemHealth,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolios
  getPortfolio(userId: string): Promise<Portfolio | undefined>;
  getPortfolioById(portfolioId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio>;

  // Positions
  getOpenPositions(portfolioId: string): Promise<Position[]>;
  getPosition(id: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<Position>): Promise<Position>;
  closePosition(
    id: string,
    exitPrice: string,
    realizedPnL: string
  ): Promise<Position>;

  // Trades
  getTrades(portfolioId: string, limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Strategies
  getStrategies(status?: string): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy>;

  // AI Decisions
  getAiDecisions(correlationId: string): Promise<AiDecision[]>;
  createAiDecision(decision: InsertAiDecision): Promise<AiDecision>;

  // Audit Logs
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // System Health
  getSystemHealth(): Promise<SystemHealth[]>;
  updateSystemHealth(
    service: string,
    status: string,
    metrics: any
  ): Promise<SystemHealth>;

  // User Settings - now part of users table
  updateUserSettings(userId: string, settings: Partial<User>): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    return portfolio || undefined;
  }

  async getPortfolioById(portfolioId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId));
    return portfolio || undefined;
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const [portfolio] = await db
      .insert(portfolios)
      .values(insertPortfolio)
      .returning();
    return portfolio;
  }

  async updatePortfolio(
    id: string,
    updates: Partial<Portfolio>
  ): Promise<Portfolio> {
    const [portfolio] = await db
      .update(portfolios)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(portfolios.id, id))
      .returning();
    return portfolio;
  }

  async getOpenPositions(portfolioId: string): Promise<Position[]> {
    return await db
      .select()
      .from(positions)
      .where(
        and(eq(positions.portfolioId, portfolioId), eq(positions.isOpen, true))
      );
  }

  async getPosition(id: string): Promise<Position | undefined> {
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.id, id));
    return position || undefined;
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updatePosition(
    id: string,
    updates: Partial<Position>
  ): Promise<Position> {
    const [position] = await db
      .update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    return position;
  }

  async closePosition(
    id: string,
    exitPrice: string,
    realizedPnL: string
  ): Promise<Position> {
    const [position] = await db
      .update(positions)
      .set({
        isOpen: false,
        exitDate: sql`NOW()`,
        exitPrice,
        realizedPnL,
      })
      .where(eq(positions.id, id))
      .returning();
    return position;
  }

  async getTrades(portfolioId: string, limit = 50): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.portfolioId, portfolioId))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db.insert(trades).values(insertTrade).returning();
    return trade;
  }

  async getStrategies(status?: string): Promise<Strategy[]> {
    const query = db
      .select()
      .from(strategies)
      .orderBy(desc(strategies.createdAt));
    if (status) {
      return await query.where(eq(strategies.status, status));
    }
    return await query;
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    const [strategy] = await db
      .select()
      .from(strategies)
      .where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db
      .insert(strategies)
      .values(insertStrategy)
      .returning();
    return strategy;
  }

  async updateStrategy(
    id: string,
    updates: Partial<Strategy>
  ): Promise<Strategy> {
    const [strategy] = await db
      .update(strategies)
      .set(updates)
      .where(eq(strategies.id, id))
      .returning();
    return strategy;
  }

  async getAiDecisions(correlationId: string): Promise<AiDecision[]> {
    return await db
      .select()
      .from(aiDecisions)
      .where(eq(aiDecisions.correlationId, correlationId))
      .orderBy(desc(aiDecisions.createdAt));
  }

  async createAiDecision(
    insertDecision: InsertAiDecision
  ): Promise<AiDecision> {
    const [decision] = await db
      .insert(aiDecisions)
      .values(insertDecision)
      .returning();
    return decision;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    return await db.select().from(systemHealth);
  }

  async updateSystemHealth(
    service: string,
    status: string,
    metrics: any
  ): Promise<SystemHealth> {
    const [health] = await db
      .insert(systemHealth)
      .values({ service, status, metrics })
      .onConflictDoUpdate({
        target: [systemHealth.service],
        set: { status, metrics, lastCheck: sql`NOW()` },
      })
      .returning();
    return health;
  }

  async updateUserSettings(
    userId: string,
    settings: Partial<User>
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...settings, updatedAt: sql`NOW()` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
