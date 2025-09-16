import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricCard from "@/components/dashboard/metric-card";
import TradingChart from "@/components/dashboard/trading-chart";
import AIPipeline from "@/components/dashboard/ai-pipeline";
import ActivePositions from "@/components/dashboard/active-positions";
import SystemHealth from "@/components/dashboard/system-health";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { useTradingData } from "@/hooks/use-trading-data";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  const { 
    portfolioStatus, 
    positions, 
    auditLogs, 
    systemMetrics,
    refetchPortfolio,
    refetchPositions
  } = useTradingData();
  
  const { isConnected, lastMessage } = useWebSocket();

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'portfolio_update':
          refetchPortfolio();
          break;
        case 'position_update':
        case 'trade_executed':
          refetchPositions();
          break;
        default:
          break;
      }
    }
  }, [lastMessage, refetchPortfolio, refetchPositions]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          isConnected={isConnected} 
          botStatus={systemMetrics?.bot_status || 'stopped'} 
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-12 gap-6 h-full">
            
            {/* Portfolio Overview Cards */}
            <div className="col-span-12 grid grid-cols-4 gap-4 mb-2">
              <MetricCard
                title="Portfolio Value"
                value={`$${portfolioStatus?.portfolioValue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
                change={portfolioStatus?.dayPnLPercent || 0}
                changeLabel={`+$${Math.abs(portfolioStatus?.dayPnL || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                icon="wallet"
                data-testid="metric-portfolio-value"
              />
              
              <MetricCard
                title="Today's P&L"
                value={`${portfolioStatus?.dayPnL >= 0 ? '+' : ''}$${portfolioStatus?.dayPnL?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`}
                change={portfolioStatus?.dayPnLPercent || 0}
                changeLabel={`${portfolioStatus?.dayPnLPercent >= 0 ? '+' : ''}${portfolioStatus?.dayPnLPercent?.toFixed(2) || '0.00'}%`}
                icon="chart-line"
                isPositive={portfolioStatus?.dayPnL >= 0}
                data-testid="metric-daily-pnl"
              />
              
              <MetricCard
                title="Active Positions"
                value={portfolioStatus?.activePositions?.toString() || '0'}
                change={0}
                changeLabel="Avg: 2.3 days"
                icon="list"
                data-testid="metric-active-positions"
              />
              
              <MetricCard
                title="Win Rate (30D)"
                value={`${portfolioStatus?.winRate?.toFixed(1) || '0.0'}%`}
                change={4.1}
                changeLabel="+4.1% vs last month"
                icon="bullseye"
                data-testid="metric-win-rate"
              />
            </div>
            
            {/* Main Chart Area */}
            <TradingChart 
              className="col-span-8"
              portfolioValue={portfolioStatus?.portfolioValue || 100000}
              dayPnL={portfolioStatus?.dayPnL || 0}
              dayPnLPercent={portfolioStatus?.dayPnLPercent || 0}
              data-testid="trading-chart"
            />
            
            {/* AI Decision Pipeline */}
            <AIPipeline 
              className="col-span-4"
              botStatus={systemMetrics?.bot_status || 'stopped'}
              data-testid="ai-pipeline"
            />
            
            {/* Active Positions */}
            <ActivePositions 
              className="col-span-7"
              positions={positions || []}
              data-testid="active-positions"
            />
            
            {/* System Health */}
            <SystemHealth 
              className="col-span-5"
              systemHealth={systemMetrics?.system_health || []}
              data-testid="system-health"
            />
            
            {/* Activity Feed */}
            <ActivityFeed 
              className="col-span-12"
              activities={auditLogs || []}
              data-testid="activity-feed"
            />
            
          </div>
        </div>
      </main>
    </div>
  );
}
