import { useQuery } from "@tanstack/react-query";

export function useTradingData() {
  // Portfolio status query
  const {
    data: portfolioStatus,
    refetch: refetchPortfolio,
    isLoading: portfolioLoading
  } = useQuery({
    queryKey: ["/api/portfolio/status"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Open positions query
  const {
    data: positions,
    refetch: refetchPositions,
    isLoading: positionsLoading
  } = useQuery({
    queryKey: ["/api/positions/open"],
    refetchInterval: 30000,
  });

  // System metrics query
  const {
    data: systemMetrics,
    refetch: refetchSystemMetrics,
    isLoading: metricsLoading
  } = useQuery({
    queryKey: ["/api/system/metrics"],
    refetchInterval: 10000, // Refetch every 10 seconds for system metrics
  });

  // Audit logs query
  const {
    data: auditLogs,
    refetch: refetchAuditLogs,
    isLoading: auditLogsLoading
  } = useQuery({
    queryKey: ["/api/audit-logs"],
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Strategies query
  const {
    data: strategies,
    refetch: refetchStrategies,
    isLoading: strategiesLoading
  } = useQuery({
    queryKey: ["/api/strategies"],
    refetchInterval: 20000,
  });

  // Market data query
  const {
    data: marketData,
    refetch: refetchMarketData,
    isLoading: marketDataLoading
  } = useQuery({
    queryKey: ["/api/market-data"],
    refetchInterval: 60000, // Refetch every minute
  });

  const isLoading = portfolioLoading || positionsLoading || metricsLoading;

  return {
    // Data
    portfolioStatus,
    positions,
    systemMetrics,
    auditLogs,
    strategies,
    marketData,
    
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
