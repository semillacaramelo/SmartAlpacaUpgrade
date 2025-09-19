import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { useEffect, useState, useCallback } from "react";
import type {
  PortfolioStatus,
  SystemMetrics,
  PositionData,
  AuditLog,
} from "../../../shared/schema";

interface PipelineStage {
  name: string;
  description: string;
  status: "completed" | "active" | "pending" | "failed";
  icon: string;
  timestamp?: string;
}

interface PortfolioHistory {
  time: string;
  value: number;
}

export function useTradingData() {
  const queryClient = useQueryClient();
  const [activeTimeframe, setActiveTimeframe] = useState<string>("1d");
  const [aiPipelineStages, setAiPipelineStages] = useState<PipelineStage[]>([
    {
      name: "Market Scan",
      description: "Waiting to start",
      status: "pending",
      icon: "fas fa-search",
    },
    {
      name: "Asset Selection",
      description: "Waiting for market data",
      status: "pending",
      icon: "fas fa-chart-line",
    },
    {
      name: "Strategy Generation",
      description: "Waiting for asset selection",
      status: "pending",
      icon: "fas fa-brain",
    },
    {
      name: "Risk Validation",
      description: "Waiting for strategy",
      status: "pending",
      icon: "fas fa-shield-alt",
    },
    {
      name: "Trade Staging",
      description: "Waiting for validation",
      status: "pending",
      icon: "fas fa-cog",
    },
    {
      name: "Execution",
      description: "Waiting for staging",
      status: "pending",
      icon: "fas fa-play",
    },
  ]);

  const { isConnected: wsConnected, lastMessage } = useWebSocket();

  const {
    data: portfolioStatus,
    refetch: refetchPortfolio,
    isLoading: portfolioLoading,
    isError: portfolioError,
  } = useQuery<PortfolioStatus>({
    queryKey: ["/api/portfolio/status"],
    refetchInterval: 30000,
  });

  const {
    data: portfolioHistory,
    refetch: refetchHistory,
    isLoading: historyLoading,
  } = useQuery<PortfolioHistory[]>({
    queryKey: ["/api/portfolio/history", activeTimeframe],
    refetchInterval: 60000,
  });

  const {
    data: positions,
    refetch: refetchPositions,
    isLoading: positionsLoading,
  } = useQuery<PositionData[]>({
    queryKey: ["/api/positions/open"],
    refetchInterval: 30000,
  });

  const {
    data: systemMetrics,
    refetch: refetchSystemMetrics,
    isLoading: metricsLoading,
  } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"],
    refetchInterval: 10000,
  });

  const {
    data: auditLogs,
    refetch: refetchAuditLogs,
    isLoading: auditLogsLoading,
  } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    refetchInterval: 15000,
  });

  const {
    data: strategies,
    refetch: refetchStrategies,
    isLoading: strategiesLoading,
  } = useQuery({
    queryKey: ["/api/strategies"],
    refetchInterval: 20000,
  });

  const updatePipelineStage = useCallback(
    (stageName: string, status: string, data: any, correlationId?: string) => {
      setAiPipelineStages((current) => {
        const stageKey = stageName.toLowerCase().replace(/_/g, " ");
        const newStages = current.map((stage) => {
          if (stage.name.toLowerCase() === stageKey) {
            let newStatus: PipelineStage["status"] = "pending";
            let description = stage.description;

            switch (status.toLowerCase()) {
              case "started":
                newStatus = "active";
                description = "Processing...";
                break;
              case "completed":
                newStatus = "completed";
                description = `Completed ${new Date().toLocaleTimeString()}`;
                break;
              case "failed":
                newStatus = "failed";
                description = `Failed: ${data?.error || "Unknown"}`;
                break;
            }
            return { ...stage, status: newStatus, description };
          }
          return stage;
        });

        // If a new cycle starts, reset all stages to pending
        if (stageKey === "market scan" && status.toLowerCase() === "started") {
          return [
            {
              name: "Market Scan",
              description: "Processing...",
              status: "active",
              icon: "fas fa-search",
            },
            ...newStages.slice(1).map(
              (s) =>
                ({
                  ...s,
                  status: "pending",
                  description: "Waiting...",
                } as PipelineStage)
            ),
          ];
        }
        return newStages;
      });
    },
    []
  );

  useEffect(() => {
    if (lastMessage) {
      const { type, data } = lastMessage;
      switch (type) {
        case "portfolio_update":
          queryClient.setQueryData(["/api/portfolio/status"], data);
          break;
        case "position_update":
          queryClient.invalidateQueries({ queryKey: ["/api/positions/open"] });
          break;
        case "trade_executed":
          queryClient.invalidateQueries({ queryKey: ["/api/positions/open"] });
          queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
          break;
        case "system_event":
          if (data.event.startsWith("AI_PIPELINE")) {
            const match = data.event.match(/AI_PIPELINE_(\w+)_(\w+)/);
            if (match) {
              const [, stageName, status] = match;
              updatePipelineStage(
                stageName,
                status,
                data.data,
                data.correlationId
              );
            }
          }
          break;
      }
    }
  }, [lastMessage, queryClient, updatePipelineStage]);

  const isLoading = portfolioLoading || positionsLoading || metricsLoading;
  const isApiConnected = !portfolioError && !isLoading && !!portfolioStatus;

  return {
    portfolioStatus,
    positions,
    systemMetrics,
    auditLogs,
    strategies,
    aiPipelineStages,
    portfolioHistory,
    wsConnected,
    isLoading,
    portfolioLoading,
    positionsLoading,
    metricsLoading,
    auditLogsLoading,
    strategiesLoading,
    historyLoading,
    isApiConnected,
    activeTimeframe,
    setActiveTimeframe,
    refetchPortfolio,
    refetchPositions,
    refetchSystemMetrics,
    refetchAuditLogs,
    refetchStrategies,
    refetchHistory,
  };
}
