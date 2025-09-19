import { GoogleGenAI } from "@google/genai";

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

export class GeminiService {
  private genAI: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    if (!key) {
      throw new Error("Gemini API key not configured.");
    }
    this.genAI = new GoogleGenAI({ apiKey: key });
  }

  async analyzeMarket(marketData: any): Promise<MarketAnalysis> {
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
  }

  async selectAssets(
    marketAnalysis: MarketAnalysis,
    availableAssets: string[]
  ): Promise<AssetSelection[]> {
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
