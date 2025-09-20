import { useTradingData } from "@/hooks/use-trading-data.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

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
  const {
    portfolioStatus,
    positions,
    isLoading,
    isApiConnected,
    wsConnected,
  } = useTradingData();

  // Show API connection prompt if not connected
  if (!isApiConnected && !isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        
        <Alert className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p className="font-medium">API Connection Required</p>
            <p>
              To view your portfolio data, you need to configure your API credentials first.
            </p>
            <Link 
              href="/settings" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to Settings →
            </Link>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border opacity-50">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-muted-foreground">--</p>
            <p className="text-sm text-muted-foreground">API Required</p>
          </div>
          <div className="bg-card p-6 rounded-lg border opacity-50">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Today's P&L</h3>
            <p className="text-3xl font-bold text-muted-foreground">--</p>
            <p className="text-sm text-muted-foreground">API Required</p>
          </div>
          <div className="bg-card p-6 rounded-lg border opacity-50">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Available Cash</h3>
            <p className="text-3xl font-bold text-muted-foreground">--</p>
            <p className="text-sm text-muted-foreground">API Required</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-muted-foreground">
            {wsConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(portfolioStatus?.portfolioValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Today's P&L</p>
            <div className="flex items-center justify-center space-x-2">
              {(portfolioStatus?.dayPnL || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p className={`text-2xl font-bold ${
                (portfolioStatus?.dayPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {formatCurrency(portfolioStatus?.dayPnL)}
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Available Cash</p>
            <p className="text-2xl font-bold">
              {formatCurrency(portfolioStatus?.cashBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-xl font-semibold mb-4">Current Positions</h3>
        {!positions || positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active positions</p>
            <p className="text-sm">Your positions will appear here when you have open trades</p>
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-semibold">{position.symbol}</h4>
                  <p className="text-sm text-muted-foreground">
                    {position.quantity} shares @ {formatCurrency(position.averageEntryPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(position.marketValue)}</p>
                  <p className={`text-sm ${
                    (position.unrealizedPnL || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(position.unrealizedPnL)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}