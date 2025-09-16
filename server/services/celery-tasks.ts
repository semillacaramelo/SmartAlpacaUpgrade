import { storage } from '../storage';
import { tradingService } from './trading';
import { analyzeMarket, selectAssets, generateTradingStrategy } from './gemini';
import { wsManager } from './websocket';
import { v4 as uuidv4 } from 'uuid';

export interface TaskResult {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: string;
}

export class TaskManager {
  private activeTasks: Map<string, any> = new Map();
  private botStatus: 'stopped' | 'running' = 'stopped';

  async startBotCycle(): Promise<TaskResult> {
    const correlationId = uuidv4();
    
    if (this.botStatus === 'running') {
      return {
        success: false,
        error: 'Bot is already running',
        correlationId
      };
    }

    this.botStatus = 'running';
    
    try {
      await storage.createAuditLog({
        correlationId,
        eventType: 'BOT_CYCLE_STARTED',
        eventData: { correlationId },
        source: 'task_manager',
        level: 'info'
      });

      // Start the AI pipeline
      await this.runAIPipeline(correlationId);

      return {
        success: true,
        data: { correlationId },
        correlationId
      };
    } catch (error) {
      this.botStatus = 'stopped';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      };
    }
  }

  async stopBot(): Promise<TaskResult> {
    const correlationId = uuidv4();
    this.botStatus = 'stopped';
    
    await storage.createAuditLog({
      correlationId,
      eventType: 'BOT_STOPPED',
      eventData: { correlationId },
      source: 'task_manager',
      level: 'info'
    });

    wsManager?.broadcastSystemEvent({
      event: 'BOT_STOPPED',
      data: { status: 'stopped' },
      correlationId
    });

    return {
      success: true,
      data: { status: 'stopped' },
      correlationId
    };
  }

  private async runAIPipeline(correlationId: string) {
    try {
      // Stage 1: Market Scan
      wsManager?.broadcastAIPipelineUpdate('market_scan', 'started', {}, correlationId);
      const marketScanResult = await this.marketScanTask(correlationId);
      
      if (!marketScanResult.success) {
        throw new Error(`Market scan failed: ${marketScanResult.error}`);
      }

      // Stage 2: Asset Selection
      wsManager?.broadcastAIPipelineUpdate('asset_selection', 'started', {}, correlationId);
      const assetSelectionResult = await this.assetSelectionTask(correlationId, marketScanResult.data);
      
      if (!assetSelectionResult.success) {
        throw new Error(`Asset selection failed: ${assetSelectionResult.error}`);
      }

      // Stage 3: Strategy Generation
      wsManager?.broadcastAIPipelineUpdate('strategy_generation', 'started', {}, correlationId);
      const strategyResult = await this.strategyGenerationTask(correlationId, assetSelectionResult.data);
      
      if (!strategyResult.success) {
        throw new Error(`Strategy generation failed: ${strategyResult.error}`);
      }

      // Stage 4: Validation
      wsManager?.broadcastAIPipelineUpdate('validation', 'started', {}, correlationId);
      const validationResult = await this.validateStrategyTask(correlationId, strategyResult.data);
      
      if (!validationResult.success) {
        throw new Error(`Strategy validation failed: ${validationResult.error}`);
      }

      // Stage 5: Staging
      wsManager?.broadcastAIPipelineUpdate('staging', 'started', {}, correlationId);
      const stagingResult = await this.stageTradeTask(correlationId, validationResult.data);
      
      if (!stagingResult.success) {
        throw new Error(`Trade staging failed: ${stagingResult.error}`);
      }

      // Stage 6: Schedule Execution Monitor
      this.scheduleExecutionMonitor();

    } catch (error) {
      wsManager?.broadcastAIPipelineUpdate('pipeline', 'failed', { error: error.message }, correlationId);
      await storage.createAuditLog({
        correlationId,
        eventType: 'AI_PIPELINE_FAILED',
        eventData: { error: error.message },
        source: 'task_manager',
        level: 'error'
      });
    }
  }

  async marketScanTask(correlationId: string): Promise<TaskResult> {
    try {
      // Get available market data
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'];
      const marketData = await tradingService.getMarketData(symbols);
      
      // Analyze market with AI
      const marketAnalysis = await analyzeMarket(marketData);
      
      // Store decision
      await storage.createAiDecision({
        correlationId,
        stage: 'market_scan',
        input: { symbols, marketData },
        output: marketAnalysis,
        confidence: marketAnalysis.confidence.toString(),
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('market_scan', 'completed', marketAnalysis, correlationId);

      return {
        success: true,
        data: marketAnalysis,
        correlationId
      };
    } catch (error) {
      await storage.createAiDecision({
        correlationId,
        stage: 'market_scan',
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        correlationId
      };
    }
  }

  async assetSelectionTask(correlationId: string, marketAnalysis: any): Promise<TaskResult> {
    try {
      const availableAssets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'];
      const assetSelections = await selectAssets(marketAnalysis, availableAssets);
      
      // Select top 3 assets
      const selectedAssets = assetSelections
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      await storage.createAiDecision({
        correlationId,
        stage: 'asset_selection',
        input: { marketAnalysis, availableAssets },
        output: selectedAssets,
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('asset_selection', 'completed', { selectedAssets }, correlationId);

      return {
        success: true,
        data: selectedAssets,
        correlationId
      };
    } catch (error) {
      await storage.createAiDecision({
        correlationId,
        stage: 'asset_selection',
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        correlationId
      };
    }
  }

  async strategyGenerationTask(correlationId: string, selectedAssets: any[]): Promise<TaskResult> {
    try {
      const strategies = [];
      
      for (const asset of selectedAssets.slice(0, 1)) { // Generate strategy for top asset
        const marketData = await tradingService.getMarketData([asset.symbol]);
        const strategy = await generateTradingStrategy(asset.symbol, marketData[0]);
        strategies.push(strategy);
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'strategy_generation',
        input: { selectedAssets },
        output: strategies,
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('strategy_generation', 'completed', { strategies }, correlationId);

      return {
        success: true,
        data: strategies,
        correlationId
      };
    } catch (error) {
      await storage.createAiDecision({
        correlationId,
        stage: 'strategy_generation',
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        correlationId
      };
    }
  }

  async validateStrategyTask(correlationId: string, strategies: any[]): Promise<TaskResult> {
    try {
      const validatedStrategies = [];
      
      for (const strategy of strategies) {
        // Run backtest
        const backtestResult = await tradingService.backtestStrategy(
          strategy.symbol,
          strategy.entryRules,
          strategy.exitRules,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          new Date()
        );
        
        // Validate performance
        if (backtestResult.totalReturn > 0.02 && backtestResult.winRate > 0.6) { // > 2% return and > 60% win rate
          validatedStrategies.push({
            ...strategy,
            backtestResult,
            validated: true
          });
        }
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'validation',
        input: { strategies },
        output: { validatedStrategies },
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('validation', 'completed', { validatedStrategies }, correlationId);

      return {
        success: true,
        data: validatedStrategies,
        correlationId
      };
    } catch (error) {
      await storage.createAiDecision({
        correlationId,
        stage: 'validation',
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        correlationId
      };
    }
  }

  async stageTradeTask(correlationId: string, validatedStrategies: any[]): Promise<TaskResult> {
    try {
      const stagedStrategies = [];
      
      for (const strategy of validatedStrategies) {
        // Store strategy in database
        const dbStrategy = await storage.createStrategy({
          name: strategy.name,
          symbol: strategy.symbol,
          entryRules: strategy.entryRules,
          exitRules: strategy.exitRules,
          riskParameters: strategy.riskParameters,
          backtestResults: strategy.backtestResult,
          confidence: strategy.confidence.toString(),
          status: 'staged',
          correlationId,
          aiMetadata: strategy
        });
        
        stagedStrategies.push(dbStrategy);
      }

      await storage.createAiDecision({
        correlationId,
        stage: 'staging',
        input: { validatedStrategies },
        output: { stagedStrategies: stagedStrategies.map(s => s.id) },
        status: 'success'
      });

      wsManager?.broadcastAIPipelineUpdate('staging', 'completed', { stagedCount: stagedStrategies.length }, correlationId);

      return {
        success: true,
        data: stagedStrategies,
        correlationId
      };
    } catch (error) {
      await storage.createAiDecision({
        correlationId,
        stage: 'staging',
        status: 'failed',
        errorMessage: error.message
      });
      
      return {
        success: false,
        error: error.message,
        correlationId
      };
    }
  }

  private scheduleExecutionMonitor() {
    // This would run continuously to monitor staged strategies
    setInterval(async () => {
      if (this.botStatus === 'running') {
        await this.executeStagedTrades();
        await this.monitorOpenPositions();
      }
    }, 60000); // Check every minute
  }

  private async executeStagedTrades() {
    try {
      const stagedStrategies = await storage.getStrategies('staged');
      
      for (const strategy of stagedStrategies) {
        const marketData = await tradingService.getMarketData([strategy.symbol]);
        const evaluation = await tradingService.evaluateStrategy(
          strategy.symbol,
          strategy.entryRules,
          strategy.exitRules,
          marketData[0]
        );
        
        if (evaluation.shouldEnter && evaluation.confidence > 0.7) {
          // Execute trade
          const orderRequest = {
            symbol: strategy.symbol,
            quantity: 100, // This should come from risk parameters
            side: 'buy' as const,
            type: 'market' as const,
            correlationId: strategy.correlationId,
            strategyName: strategy.name,
            aiReasoning: `AI confidence: ${evaluation.confidence}`
          };
          
          const orderResult = await tradingService.executeOrder(orderRequest);
          
          // Update strategy status
          await storage.updateStrategy(strategy.id, { status: 'active' });
          
          wsManager?.broadcastTradeExecution({
            strategy: strategy.name,
            symbol: strategy.symbol,
            side: 'buy',
            quantity: 100,
            price: orderResult.executedPrice,
            correlationId: strategy.correlationId
          });
        }
      }
    } catch (error) {
      console.error('Error executing staged trades:', error);
    }
  }

  private async monitorOpenPositions() {
    try {
      // This would monitor all open positions for exit signals
      // Implementation depends on having a portfolio context
      console.log('Monitoring open positions...');
    } catch (error) {
      console.error('Error monitoring positions:', error);
    }
  }

  getBotStatus() {
    return this.botStatus;
  }
}

export const taskManager = new TaskManager();
