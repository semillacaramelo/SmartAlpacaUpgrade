import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

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

export async function analyzeMarket(marketData: any): Promise<MarketAnalysis> {
  try {
    const systemPrompt = `You are an expert market analyst. Analyze the provided market data and provide insights about current market trend, volatility level, and key factors affecting the market.
    
    Respond with JSON in this format:
    {
      "trend": "bullish|bearish|neutral",
      "volatility": "low|moderate|high",  
      "keyFactors": ["factor1", "factor2", "factor3"],
      "confidence": 0.85
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            trend: { type: "string" },
            volatility: { type: "string" },
            keyFactors: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          },
          required: ["trend", "volatility", "keyFactors", "confidence"],
        },
      },
      contents: `Market Data: ${JSON.stringify(marketData)}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    throw new Error(`Failed to analyze market: ${error}`);
  }
}

export async function selectAssets(marketAnalysis: MarketAnalysis, availableAssets: string[]): Promise<AssetSelection[]> {
  try {
    const systemPrompt = `You are an expert asset selector for algorithmic trading. Based on the market analysis and available assets, select and rank the top assets for trading.
    
    Consider:
    - Market trend alignment
    - Liquidity and volatility
    - Technical indicators
    - Risk-reward potential
    
    Respond with JSON array of selected assets with scores and reasoning.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              score: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["symbol", "score", "reasoning"],
          },
        },
      },
      contents: `Market Analysis: ${JSON.stringify(marketAnalysis)}\nAvailable Assets: ${availableAssets.join(', ')}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    throw new Error(`Failed to select assets: ${error}`);
  }
}

export async function generateTradingStrategy(symbol: string, marketData: any): Promise<TradingStrategy> {
  try {
    const systemPrompt = `You are an expert algorithmic trading strategist. Generate a complete trading strategy for the given symbol based on market data.
    
    The strategy should include:
    - Clear entry rules using technical indicators
    - Exit rules for both profit-taking and stop-loss
    - Risk management parameters
    - Expected performance metrics
    
    Use standard technical indicators like RSI, SMA, EMA, MACD, Bollinger Bands, etc.
    
    Respond with JSON in the specified format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            symbol: { type: "string" },
            entryRules: { type: "string" },
            exitRules: { type: "string" },
            riskParameters: {
              type: "object",
              properties: {
                maxPositionSize: { type: "number" },
                stopLoss: { type: "number" },
                takeProfit: { type: "number" },
              },
              required: ["maxPositionSize", "stopLoss", "takeProfit"],
            },
            confidence: { type: "number" },
            backtestExpectedReturn: { type: "number" },
          },
          required: ["name", "symbol", "entryRules", "exitRules", "riskParameters", "confidence", "backtestExpectedReturn"],
        },
      },
      contents: `Symbol: ${symbol}\nMarket Data: ${JSON.stringify(marketData)}`,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini AI");
    }
  } catch (error) {
    throw new Error(`Failed to generate trading strategy: ${error}`);
  }
}
