import { useQuery } from "@tanstack/react-query";

// Tipos básicos para el trading
interface SystemMetrics {
  bot_status: "running" | "stopped" | "error";
  total_value: number;
  daily_pnl: number;
  positions_count: number;
  win_rate: number;
}

interface TradingData {
  systemMetrics: SystemMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Hook simulado para datos de trading
export function useTradingData(): TradingData {
  const { data: systemMetrics, isLoading, error } = useQuery({
    queryKey: ["systemMetrics"],
    queryFn: async (): Promise<SystemMetrics> => {
      try {
        const response = await fetch("/api/system/metrics");
        if (!response.ok) {
          // Si la API no está disponible, devolver datos simulados
          return {
            bot_status: "stopped",
            total_value: 100000,
            daily_pnl: 0,
            positions_count: 0,
            win_rate: 0,
          };
        }
        return response.json();
      } catch (error) {
        // En caso de error, devolver datos simulados
        console.warn("Failed to fetch system metrics, using mock data:", error);
        return {
          bot_status: "stopped",
          total_value: 100000,
          daily_pnl: 0,
          positions_count: 0,
          win_rate: 0,
        };
      }
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
    retry: 1, // Solo reintentar 1 vez para evitar spam
  });

  return {
    systemMetrics,
    isLoading,
    error: error as Error | null,
  };
}

// Hook adicional para datos de portfolio
export function usePortfolioData() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/portfolio");
        if (!response.ok) {
          return { positions: [], total_value: 100000 };
        }
        return response.json();
      } catch (error) {
        console.warn("Failed to fetch portfolio data:", error);
        return { positions: [], total_value: 100000 };
      }
    },
    refetchInterval: 10000,
    retry: 1,
  });
}