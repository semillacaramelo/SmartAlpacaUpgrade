import { useTradingData } from "@/hooks/use-trading-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

function PortfolioSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function Portfolio() {
  const { portfolioStatus, positions, isLoading, isApiConnected } =
    useTradingData();

  if (isLoading && !isApiConnected) {
    return <PortfolioSkeleton />;
  }

  if (!isApiConnected) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 p-8 bg-card rounded-lg border shadow-lg max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="text-2xl font-bold">Portfolio Data Unavailable</h2>
          <p className="text-muted-foreground">
            Please connect to the Alpaca API via the settings panel (top-right
            icon) to view your live portfolio data.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const totalValue = portfolioStatus?.portfolioValue || 0;
  const dayPnL = portfolioStatus?.dayPnL || 0;
  const dayPnLPercent = portfolioStatus?.dayPnLPercent || 0;
  const cashBalance = portfolioStatus?.cashBalance || 0;
  const winRate = portfolioStatus?.winRate || 0;

  const assetAllocation =
    positions?.reduce((acc, position) => {
      const value = (position as any).marketValue;
      acc[position.symbol] = (acc[position.symbol] || 0) + value;
      return acc;
    }, {} as Record<string, number>) || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(cashBalance)} cash available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day P&L</CardTitle>
            {dayPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                dayPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(dayPnL)}
            </div>
            <p
              className={`text-xs ${
                dayPnL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatPercent(dayPnLPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Positions
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Open trades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>
            Distribution of your portfolio by asset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(assetAllocation).length > 0 ? (
            Object.entries(assetAllocation).map(([symbol, value]) => {
              const percentage =
                totalValue > 0 ? (value / totalValue) * 100 : 0;
              return (
                <div key={symbol} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No positions yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Positions</CardTitle>
          <CardDescription>Your active trading positions</CardDescription>
        </CardHeader>
        <CardContent>
          {positions && positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((p) => {
                const pos = p as any;
                const pnl = pos.unrealizedPnL || 0;
                const pnlPercent = (pos.unrealizedPnLPercent || 0) * 100;
                return (
                  <div
                    key={pos.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold">{pos.symbol}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pos.quantity} shares @{" "}
                          {formatCurrency(pos.entryPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(pos.marketValue)}
                      </div>
                      <div
                        className={`text-sm ${
                          pnl >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(pnl)} ({formatPercent(pnlPercent)})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active positions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
