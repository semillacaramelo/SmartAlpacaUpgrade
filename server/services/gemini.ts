import { GoogleGenAI } from "@google/genai";
import { circuitBreakerManager, defaultConfigs } from './circuit-breaker';

export interface MarketAnalysis {
  trend: string;
  volatility: string;
  keyFactors: string[];
  confidence: number;
}

export interface AssetSelection {
  symbol: string;
  score: number;
  reasoning: string;
}

export interface TradingStrategy {
  name: string;
  symbol: string;
  entryRules: string;
  exitRules: string;
  riskParameters: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
  };
  confidence: number;
  backtestExpectedReturn: number;
}

export interface RiskAnalysis {
  overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  riskScore: number;
  recommendations: {
    positionSizeAdjustment: "increase" | "decrease" | "maintain";
    hedgingStrategy: string;
    stopLossAdjustment: "tighten" | "loosen" | "maintain";
    concentrationRisk: string;
  };
  marketFactors: string[];
  timeHorizon: "1D" | "1W" | "1M";
  volatilityPrediction: "increasing" | "decreasing" | "stable";
  confidence: number;
  emergencyActions: string[];
}

export class GeminiService {
  private genAI: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    if (!key) {
      throw new Error("Gemini API key not configured.");
    }
    this.genAI = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Execute function with circuit breaker protection
   */
  private async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    const circuitBreaker = circuitBreakerManager.getCircuitBreaker('gemini', defaultConfigs.gemini);
    return circuitBreaker.execute(operation);
  }

  async analyzeMarket(marketData: any): Promise<MarketAnalysis> {
    return this.executeWithCircuitBreaker(async () => {
      try {
        const prompt = `You are an expert market analyst. Analyze the provided market data and provide insights about current market trend, volatility level, and key factors affecting the market.
        Respond with JSON in this format:
        {
          "trend": "bullish|bearish|neutral",
          "volatility": "low|moderate|high",
          "keyFactors": ["factor1", "factor2", "factor3"],
          "confidence": 0.85
        }
        Market Data: ${JSON.stringify(marketData)}`;

        const result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        const text = result.text;
        if (!text) {
          throw new Error("No response text received");
        }
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to analyze market: ${error}`);
      }
    });
  }

  async selectAssets(
    marketAnalysis: MarketAnalysis,
    availableAssets: string[]
  ): Promise<AssetSelection[]> {
    return this.executeWithCircuitBreaker(async () => {
      try {
        const prompt = `You are a Quantitative Analyst. Based on the market analysis, select the top 3 assets for short-term trading from the list. Provide a score (0-100) and reasoning for each.
          Respond with a JSON array of 3 objects: [{"symbol": "...", "score": ..., "reasoning": "..."}]
          Market Analysis: ${JSON.stringify(marketAnalysis)}
          Available Assets: ${availableAssets.join(", ")}`;

        const result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        const text = result.text;
        if (!text) {
          throw new Error("No response text received");
        }
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to select assets: ${error}`);
      }
    });
  }

  async generateTradingStrategy(
    symbol: string,
    marketData: any
  ): Promise<TradingStrategy> {
    try {
      const prompt = `You are a Trading Strategist. Generate a trading strategy for the given asset.
      The strategy must include:
      - A descriptive name
      - Parseable entry/exit conditions using technical indicators (RSI, SMA, EMA, MACD, etc.)
      - Risk parameters (stopLoss, takeProfit percentages)
      - Confidence score and expected return.
      Respond with JSON in the specified format with parseable conditions.
      Symbol: ${symbol}
      Market Data: ${JSON.stringify(marketData)}`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      const text = result.text;
      if (!text) {
        throw new Error("No response text received");
      }
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to generate trading strategy: ${error}`);
    }
  }

  async analyzeRisk(portfolioData: any, marketConditions: any): Promise<RiskAnalysis> {
    return this.executeWithCircuitBreaker(async () => {
      try {
        const prompt = {
          text: `You are an expert risk management AI. Analyze the following portfolio and market conditions, then provide a comprehensive risk assessment.

Portfolio Data: ${JSON.stringify(portfolioData)}
Market Conditions: ${JSON.stringify(marketConditions)}

Provide your analysis as a JSON object with the following structure:
{
  "overallRiskLevel": "LOW|MEDIUM|HIGH|EXTREME",
  "riskScore": 0-100,
  "recommendations": {
    "positionSizeAdjustment": "increase|decrease|maintain",
    "hedgingStrategy": "string description",
    "stopLossAdjustment": "tighten|loosen|maintain",
    "concentrationRisk": "string assessment"
  },
  "marketFactors": [
    "list of key market risk factors"
  ],
  "timeHorizon": "1D|1W|1M",
  "volatilityPrediction": "increasing|decreasing|stable",
  "confidence": 0-100,
  "emergencyActions": [
    "list of emergency actions if needed"
  ]
}`
        };

        const result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        const text = result.text;
        if (!text) {
          throw new Error("No response text received");
        }
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`Failed to analyze risk: ${error}`);
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "test",
      });
      return !!result.text;
    } catch (error) {
      console.error("Gemini API connection test failed:", error);
      return false;
    }
  }

  /**
   * Optimize a prompt using meta-prompting techniques
   */
  async getPromptOptimization(metaPrompt: string): Promise<string> {
    return this.executeWithCircuitBreaker(async () => {
      try {
        const result = await this.genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: metaPrompt,
        });
        const text = result.text;
        if (!text) {
          throw new Error("No response text received");
        }
        return text;
      } catch (error) {
        const errorMessage = `Failed to optimize prompt: ${error}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    });
  }
}

// Singleton instance
export const geminiService = new GeminiService();

// Backward compatibility exports
export async function analyzeMarket(marketData: any): Promise<MarketAnalysis> {
  return geminiService.analyzeMarket(marketData);
}

export async function selectAssets(
  marketAnalysis: MarketAnalysis,
  availableAssets: string[]
): Promise<AssetSelection[]> {
  return geminiService.selectAssets(marketAnalysis, availableAssets);
}

export async function generateTradingStrategy(
  symbol: string,
  marketData: any
): Promise<TradingStrategy> {
  return geminiService.generateTradingStrategy(symbol, marketData);
}

export async function analyzeRisk(
  portfolioData: any,
  marketConditions: any
): Promise<RiskAnalysis> {
  return geminiService.analyzeRisk(portfolioData, marketConditions);
}
