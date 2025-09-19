import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MetricCard from "@/components/dashboard/metric-card";
import TradingChart from "@/components/dashboard/trading-chart";
import AIPipeline from "@/components/dashboard/ai-pipeline";
import ActivePositions from "@/components/dashboard/active-positions";
import SystemHealth from "@/components/dashboard/system-health";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { useTradingData } from "@/hooks/use-trading-data";
import { useWebSocket } from "@/hooks/use-websocket";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full animate-pulse">
      <div className="col-span-12 grid grid-cols-4 gap-4 mb-2">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="col-span-8 h-96 rounded-lg" />
      <Skeleton className="col-span-4 h-96 rounded-lg" />
      <Skeleton className="col-span-7 h-64 rounded-lg" />
      <Skeleton className="col-span-5 h-64 rounded-lg" />
      <Skeleton className="col-span-12 h-64 rounded-lg" />
    </div>
  );
}

export default function Dashboard() {
  const {
    portfolioStatus,
    positions,
    auditLogs,
    systemMetrics,
    aiPipelineStages,
    isLoading,
    isApiConnected,
  } = useTradingData();

  if (isLoading && !isApiConnected) {
    return <DashboardSkeleton />;
  }

  if (!isApiConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 p-8 bg-card rounded-lg border shadow-lg max-w-md">
          <div className="text-6xl opacity-50">🔌</div>
          <h2 className="text-2xl font-bold">API Connection Required</h2>
          <p className="text-muted-foreground">
            Please configure your Alpaca API keys to access the trading
            dashboard. Click the settings icon in the top right to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Portfolio Overview Cards */}
      <div className="col-span-12 grid grid-cols-4 gap-4 mb-2">
        <MetricCard
          title="Portfolio Value"
          value={`$${
            portfolioStatus?.portfolioValue?.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            }) || "0.00"
          }`}
          change={portfolioStatus?.dayPnLPercent || 0}
          changeLabel={`${
            (portfolioStatus?.dayPnL ?? 0) >= 0 ? "+" : ""
          }$${Math.abs(portfolioStatus?.dayPnL || 0).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}`}
          icon="wallet"
          isPositive={(portfolioStatus?.dayPnL ?? 0) >= 0}
          data-testid="metric-portfolio-value"
        />
        <MetricCard
          title="Today's P&L"
          value={`${(portfolioStatus?.dayPnL ?? 0) >= 0 ? "+" : ""}${(
            portfolioStatus?.dayPnL ?? 0
          ).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          change={portfolioStatus?.dayPnLPercent ?? 0}
          changeLabel={`${
            (portfolioStatus?.dayPnLPercent ?? 0) >= 0 ? "+" : ""
          }${(portfolioStatus?.dayPnLPercent ?? 0).toFixed(2)}%`}
          icon="chart-line"
          isPositive={(portfolioStatus?.dayPnL ?? 0) >= 0}
          data-testid="metric-daily-pnl"
        />
        <MetricCard
          title="Active Positions"
          value={portfolioStatus?.activePositions?.toString() || "0"}
          change={0}
          changeLabel="Total open trades"
          icon="list"
          data-testid="metric-active-positions"
        />
        <MetricCard
          title="Win Rate (30D)"
          value={`${portfolioStatus?.winRate?.toFixed(1) || "0.0"}%`}
          change={0}
          changeLabel="From completed trades"
          icon="bullseye"
          data-testid="metric-win-rate"
        />
      </div>

      <TradingChart
        className="col-span-8"
        portfolioValue={portfolioStatus?.portfolioValue || 0}
        dayPnL={portfolioStatus?.dayPnL || 0}
        dayPnLPercent={portfolioStatus?.dayPnLPercent || 0}
        data-testid="trading-chart"
      />

      <AIPipeline
        className="col-span-4"
        botStatus={systemMetrics?.bot_status || "stopped"}
        pipelineStages={aiPipelineStages}
        data-testid="ai-pipeline"
      />

      <ActivePositions
        className="col-span-7"
        positions={(positions as any[]) || []}
        data-testid="active-positions"
      />

      <SystemHealth
        className="col-span-5"
        services={
          (systemMetrics as any)?.system_health?.map((item: any) => ({
            name: item.service,
            status: item.status,
            statusType: item.status === "healthy" ? "success" : "error",
          })) || []
        }
        performanceMetrics={[
          {
            name: "Active Cycles",
            value: (systemMetrics as any)?.active_cycles || 0,
            color: "bg-primary",
          },
          {
            name: "Queue Size",
            value: (systemMetrics as any)?.queue_stats?.total || 0,
            color: "bg-chart-2",
          },
          {
            name: "Staged Strategies",
            value: (systemMetrics as any)?.staged_strategies || 0,
            color: "bg-chart-3",
          },
        ]}
        data-testid="system-health"
      />

      <ActivityFeed
        className="col-span-12"
        activities={(auditLogs as any[])?.slice(0, 50) || []}
        data-testid="activity-feed"
      />
    </div>
  );
}
