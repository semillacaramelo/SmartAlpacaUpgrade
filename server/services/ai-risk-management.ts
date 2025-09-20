import { GeminiService, RiskAnalysis } from "./gemini";
import { RiskControlService } from "./risk-control";
import { AlpacaService } from "./alpaca";
import { logger, LogContext } from "./logger";
import { metrics } from "./metrics";
import { db } from "../db";
import { positions, portfolios } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface AIRiskRecommendation {
    action: "maintain" | "reduce_exposure" | "emergency_stop" | "increase_hedge";
    priority: "low" | "medium" | "high" | "critical";
    reasoning: string;
    parameters?: {
        positionSizeMultiplier?: number;
        stopLossAdjustment?: number;
        hedgeRatio?: number;
    };
    timeframe: "immediate" | "1h" | "1d" | "1w";
}

export interface AIRiskStatus {
    lastAnalysis: Date;
    currentRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
    activeRecommendations: AIRiskRecommendation[];
    manualOverride: boolean;
    overrideReason?: string;
    overrideUntil?: Date;
}

export class AIRiskManagementService {
    private geminiService: GeminiService;
    private riskControlService: RiskControlService;
    private alpacaService: AlpacaService;
    private analysisInterval: NodeJS.Timeout | null = null;
    private isRunning = false;

    constructor() {
        this.geminiService = new GeminiService();
        this.riskControlService = new RiskControlService();
        this.alpacaService = new AlpacaService();
    }

    /**
     * Start AI-driven risk monitoring with configurable interval
     */
    async startMonitoring(intervalMinutes: number = 15): Promise<void> {
        if (this.isRunning) {
            logger.warn("AI Risk Management already running", { operation: "startMonitoring" });
            return;
        }

        this.isRunning = true;
        logger.log({
            operation: "startMonitoring",
            metadata: { intervalMinutes, message: "Starting AI Risk Management" }
        });

        // Run initial analysis
        await this.performRiskAnalysis();

        // Schedule periodic analysis
        this.analysisInterval = setInterval(async () => {
            try {
                await this.performRiskAnalysis();
            } catch (error) {
                logger.error(error as Error, { operation: "scheduledRiskAnalysis" });
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop AI risk monitoring
     */
    async stopMonitoring(): Promise<void> {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }

        logger.log({
            operation: "stopMonitoring",
            metadata: { message: "AI Risk Management monitoring stopped" }
        });
    }

    /**
     * Perform comprehensive AI risk analysis
     */
    async performRiskAnalysis(): Promise<AIRiskStatus> {
        const timer = logger.startOperation("aiRiskAnalysis");

        try {
            logger.log({ operation: "aiRiskAnalysis", metadata: { phase: "starting" } });

            // Gather portfolio data
            const portfolioData = await this.gatherPortfolioData();

            // Gather market conditions
            const marketConditions = await this.gatherMarketConditions();

            // Get AI risk analysis
            const aiAnalysis = await this.geminiService.analyzeRisk(portfolioData, marketConditions);

            // Generate recommendations
            const recommendations = await this.generateRecommendations(aiAnalysis, portfolioData);

            // Check for manual override
            const manualOverride = await this.checkManualOverride();

            // Execute non-overridden recommendations
            if (!manualOverride.active) {
                await this.executeRecommendations(recommendations);
            }

            const riskStatus: AIRiskStatus = {
                lastAnalysis: new Date(),
                currentRiskLevel: aiAnalysis.overallRiskLevel,
                activeRecommendations: recommendations,
                manualOverride: manualOverride.active,
                overrideReason: manualOverride.reason,
                overrideUntil: manualOverride.until,
            };

            // Complete timing
            const finishOperation = timer();

            logger.log({
                operation: "aiRiskAnalysis",
                duration: Date.now() - performance.now(),
                metadata: {
                    riskLevel: aiAnalysis.overallRiskLevel,
                    riskScore: aiAnalysis.riskScore,
                    recommendationsCount: recommendations.length,
                    phase: "completed"
                }
            });

            return riskStatus;

        } catch (error) {
            logger.error(error as Error, { operation: "aiRiskAnalysis" });
            throw error;
        }
    }

    /**
     * Generate actionable recommendations from AI analysis
     */
    private async generateRecommendations(
        aiAnalysis: RiskAnalysis,
        portfolioData: any
    ): Promise<AIRiskRecommendation[]> {
        const recommendations: AIRiskRecommendation[] = [];

        // Position size recommendations
        if (aiAnalysis.recommendations.positionSizeAdjustment !== "maintain") {
            recommendations.push({
                action: aiAnalysis.recommendations.positionSizeAdjustment === "decrease" ? "reduce_exposure" : "maintain",
                priority: aiAnalysis.riskScore > 80 ? "high" : "medium",
                reasoning: `AI recommends ${aiAnalysis.recommendations.positionSizeAdjustment} position sizes due to ${aiAnalysis.marketFactors.join(", ")}`,
                parameters: {
                    positionSizeMultiplier: aiAnalysis.recommendations.positionSizeAdjustment === "decrease" ? 0.7 : 1.3,
                },
                timeframe: aiAnalysis.timeHorizon === "1D" ? "immediate" : "1h",
            });
        }

        // Emergency stop recommendation
        if (aiAnalysis.overallRiskLevel === "EXTREME" || aiAnalysis.emergencyActions.length > 0) {
            recommendations.push({
                action: "emergency_stop",
                priority: "critical",
                reasoning: `Extreme risk detected: ${aiAnalysis.emergencyActions.join(", ")}`,
                timeframe: "immediate",
            });
        }

        // Hedging recommendations
        if (aiAnalysis.recommendations.hedgingStrategy && aiAnalysis.recommendations.hedgingStrategy !== "none") {
            recommendations.push({
                action: "increase_hedge",
                priority: aiAnalysis.riskScore > 70 ? "high" : "medium",
                reasoning: aiAnalysis.recommendations.hedgingStrategy,
                parameters: {
                    hedgeRatio: Math.min(0.5, aiAnalysis.riskScore / 100),
                },
                timeframe: "1h",
            });
        }

        return recommendations;
    }

    /**
     * Execute AI recommendations (with safety checks)
     */
    private async executeRecommendations(recommendations: AIRiskRecommendation[]): Promise<void> {
        for (const rec of recommendations) {
            try {
                switch (rec.action) {
                    case "reduce_exposure":
                        await this.executePositionReduction(rec);
                        break;
                    case "emergency_stop":
                        await this.executeEmergencyStop(rec);
                        break;
                    case "increase_hedge":
                        await this.executeHedging(rec);
                        break;
                    default:
                        logger.log({
                            operation: "executeRecommendations",
                            metadata: { action: "maintain", message: "Maintaining current positions as recommended" }
                        });
                }

                logger.log({
                    operation: "executeRecommendations",
                    metadata: { action: rec.action, reasoning: rec.reasoning, result: "executed" }
                });

            } catch (error) {
                logger.error(error as Error, {
                    operation: "executeRecommendations",
                    metadata: { action: rec.action, result: "failed" }
                });
            }
        }
    }

    /**
     * Reduce position exposure based on AI recommendation
     */
    private async executePositionReduction(recommendation: AIRiskRecommendation): Promise<void> {
        if (!recommendation.parameters?.positionSizeMultiplier) return;

        const positions = await this.getCurrentPositions();
        const reductionFactor = 1 - recommendation.parameters.positionSizeMultiplier;

        for (const position of positions) {
            if (position.quantity > 0) {
                const shareToSell = Math.floor(position.quantity * reductionFactor);
                if (shareToSell > 0) {
                    await this.alpacaService.placeOrder({
                        symbol: position.symbol,
                        qty: shareToSell,
                        side: "sell",
                        type: "market",
                        time_in_force: "day",
                    });

                    logger.log({
                        operation: "positionReduction",
                        metadata: {
                            symbol: position.symbol,
                            sharesSold: shareToSell,
                            reason: "ai_driven_reduction"
                        }
                    });
                }
            }
        }
    }

    /**
     * Execute emergency stop (close all positions)
     */
    private async executeEmergencyStop(recommendation: AIRiskRecommendation): Promise<void> {
        logger.warn("Executing AI-driven emergency stop", {
            operation: "emergencyStop",
            metadata: { reasoning: recommendation.reasoning }
        });

        // Close all positions
        const currentPositions = await this.getCurrentPositions();
        for (const position of currentPositions) {
            if (position.quantity > 0) {
                await this.alpacaService.placeOrder({
                    symbol: position.symbol,
                    qty: position.quantity,
                    side: "sell",
                    type: "market",
                    time_in_force: "day",
                });
            }
        }

        logger.error(new Error("EMERGENCY STOP EXECUTED BY AI"), {
            operation: "emergencyStop",
            metadata: { reasoning: recommendation.reasoning }
        });
    }

    /**
     * Execute hedging strategy
     */
    private async executeHedging(recommendation: AIRiskRecommendation): Promise<void> {
        // Implementation would depend on specific hedging strategy
        // For now, log the recommendation
        logger.log({
            operation: "hedging",
            metadata: {
                hedgeRatio: recommendation.parameters?.hedgeRatio,
                reasoning: recommendation.reasoning,
                status: "recommendation_logged"
            }
        });
    }

    /**
     * Set manual override to disable AI risk management
     */
    async setManualOverride(reason: string, durationHours: number = 24): Promise<void> {
        const overrideUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        // Store override in database or cache
        // Implementation depends on storage mechanism

        logger.warn("Manual override activated for AI risk management", {
            operation: "setManualOverride",
            metadata: { reason, durationHours, overrideUntil }
        });
    }

    /**
     * Clear manual override
     */
    async clearManualOverride(): Promise<void> {
        // Clear override from storage
        logger.log({
            operation: "clearManualOverride",
            metadata: { message: "Manual override cleared for AI risk management" }
        });
    }

    /**
     * Get current AI risk status
     */
    async getStatus(): Promise<AIRiskStatus> {
        // Implementation would fetch from cache/database
        return {
            lastAnalysis: new Date(),
            currentRiskLevel: "MEDIUM",
            activeRecommendations: [],
            manualOverride: false,
        };
    }

    // Helper methods
    private async gatherPortfolioData(): Promise<any> {
        const positions = await this.getCurrentPositions();
        const account = await this.alpacaService.getAccount();

        return {
            positions,
            accountValue: account.portfolio_value,
            buyingPower: account.buying_power,
            dayTradeCount: account.daytrade_count,
        };
    }

    private async gatherMarketConditions(): Promise<any> {
        // Get market data from various sources
        // This is a simplified version
        return {
            spyPrice: await this.getSpyPrice(),
            vixLevel: await this.getVixLevel(),
            marketHours: await this.getMarketHours(),
        };
    }

    private async getCurrentPositions(): Promise<any[]> {
        return await db.select().from(positions);
    }

    private async checkManualOverride(): Promise<{ active: boolean; reason?: string; until?: Date }> {
        // Check if manual override is active
        return { active: false };
    }

    // Market data helpers (simplified)
    private async getSpyPrice(): Promise<number> {
        // Implementation would fetch real SPY price
        return 500;
    }

    private async getVixLevel(): Promise<number> {
        // Implementation would fetch real VIX level
        return 20;
    }

    private async getMarketHours(): Promise<string> {
        // Implementation would check if market is open
        return "open";
    }
}

// Singleton instance
export const aiRiskManagementService = new AIRiskManagementService();