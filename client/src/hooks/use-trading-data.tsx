import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { useEffect, useState, useCallback } from "react";
import type { PortfolioStatus, SystemMetrics, PositionData, AuditLog } from "../../../shared/schema";

interface PipelineStage {
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  icon: string;
  timestamp?: string;
}

export function useTradingData() {
  const queryClient = useQueryClient();
  const [aiPipelineStages, setAiPipelineStages] = useState<PipelineStage[]>([
    { name: "Market Scan", description: "Waiting to start", status: "pending", icon: "fas fa-search" },
    { name: "Asset Selection", description: "Waiting for market data", status: "pending", icon: "fas fa-chart-line" },
    { name: "Strategy Generation", description: "Waiting for asset selection", status: "pending", icon: "fas fa-brain" },
    { name: "Risk Validation", description: "Waiting for strategy", status: "pending", icon: "fas fa-shield-alt" },
    { name: "Trade Staging", description: "Waiting for validation", status: "pending", icon: "fas fa-cog" },
    { name: "Execution", description: "Waiting for staging", status: "pending", icon: "fas fa-play" },
  ]);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected, lastMessage } = useWebSocket();

  // Portfolio status query
  const {
    data: portfolioStatus,
    refetch: refetchPortfolio,
    isLoading: portfolioLoading
  } = useQuery<PortfolioStatus>({
    queryKey: ["/api/portfolio/status"],
    refetchInterval: wsConnected ? false : 30000, // Disable polling if WebSocket is connected
  });

  // Open positions query
  const {
    data: positions,
    refetch: refetchPositions,
    isLoading: positionsLoading
  } = useQuery<PositionData[]>({
    queryKey: ["/api/positions/open"],
    refetchInterval: wsConnected ? false : 30000,
  });

  // System metrics query
  const {
    data: systemMetrics,
    refetch: refetchSystemMetrics,
    isLoading: metricsLoading
  } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"],
    refetchInterval: wsConnected ? false : 10000,
  });

  // Audit logs query
  const {
    data: auditLogs,
    refetch: refetchAuditLogs,
    isLoading: auditLogsLoading
  } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    refetchInterval: wsConnected ? false : 15000,
  });

  // Strategies query
  const {
    data: strategies,
    refetch: refetchStrategies,
    isLoading: strategiesLoading
  } = useQuery({
    queryKey: ["/api/strategies"],
    refetchInterval: wsConnected ? false : 20000,
  });

  // Market data query
  const {
    data: marketData,
    refetch: refetchMarketData,
    isLoading: marketDataLoading
  } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: wsConnected ? false : 60000,
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;

      switch (type) {
        case 'system_event':
          handleSystemEvent(data);
          break;
        case 'portfolio_update':
          queryClient.setQueryData(["/api/portfolio/status"], data);
          break;
        case 'position_update':
          queryClient.invalidateQueries({ queryKey: ["/api/positions/open"] });
          break;
        case 'trade_executed':
          queryClient.invalidateQueries({ queryKey: ["/api/positions/open"] });
          queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
          break;
        default:
          break;
      }
    }
  }, [lastMessage, queryClient]);

  // Handle AI pipeline events from WebSocket
  const handleSystemEvent = useCallback((eventData: any) => {
    const { event, data, correlationId } = eventData;

    // Update AI pipeline stages based on events
    if (event.includes('AI_PIPELINE')) {
      const stageMatch = event.match(/AI_PIPELINE_(\w+)_(\w+)/);
      if (stageMatch) {
        const [, stageName, status] = stageMatch;
        updatePipelineStage(stageName, status, data, correlationId);
      }
    }

    // Invalidate relevant queries based on event type
    if (event.includes('MARKET_SCAN') || event.includes('ASSET_SELECTION') ||
        event.includes('STRATEGY_GENERATION') || event.includes('VALIDATION') ||
        event.includes('STAGING') || event.includes('EXECUTION')) {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    }
  }, [queryClient]);

  // Update AI pipeline stage status
  const updatePipelineStage = useCallback((stageName: string, status: string, data: any, correlationId?: string) => {
    setAiPipelineStages(current => {
      return current.map(stage => {
        const stageKey = stage.name.toLowerCase().replace(' ', '_');
        const eventStageKey = stageName.toLowerCase();

        if (stageKey === eventStageKey) {
          let newStatus: 'completed' | 'active' | 'pending' | 'failed' = 'pending';
          let description = stage.description;

          switch (status) {
            case 'STARTED':
              newStatus = 'active';
              description = `Processing...`;
              break;
            case 'COMPLETED':
              newStatus = 'completed';
              description = `Completed ${new Date().toLocaleTimeString()}`;
              break;
            case 'FAILED':
              newStatus = 'failed';
              description = `Failed: ${data?.error || 'Unknown error'}`;
              break;
            default:
              newStatus = 'pending';
          }

          return {
            ...stage,
            status: newStatus,
            description,
            timestamp: new Date().toISOString()
          };
        }
        return stage;
      });
    });
  }, []);

  const isLoading = portfolioLoading || positionsLoading || metricsLoading;

  return {
    // Data
    portfolioStatus,
    positions,
    systemMetrics,
    auditLogs,
    strategies,
    marketData,
    aiPipelineStages,

    // WebSocket status
    wsConnected,

    // Loading states
    isLoading,
    portfolioLoading,
    positionsLoading,
    metricsLoading,
    auditLogsLoading,
    strategiesLoading,
    marketDataLoading,

    // Refetch functions
    refetchPortfolio,
    refetchPositions,
    refetchSystemMetrics,
    refetchAuditLogs,
    refetchStrategies,
    refetchMarketData,

    // Utility function to refetch all
    refetchAll: () => {
      refetchPortfolio();
      refetchPositions();
      refetchSystemMetrics();
      refetchAuditLogs();
      refetchStrategies();
      refetchMarketData();
    }
  };
}
