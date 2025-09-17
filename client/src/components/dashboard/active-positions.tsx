import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: string;
  currentPrice?: string;
  marketValue?: string;
  unrealizedPnL?: string;
}

interface ActivePositionsProps {
  className?: string;
  positions: Position[];
  'data-testid'?: string;
}

export default function ActivePositions({
  className,
  positions,
  'data-testid': dataTestId
}: ActivePositionsProps) {
  // Show empty state if no positions
  if (!positions || positions.length === 0) {
    return (
      <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Positions</h3>
              <p className="text-muted-foreground text-sm">Real-time position monitoring with exit signals</p>
            </div>
            <Button variant="ghost" size="sm" data-testid="view-all-positions">
              View All
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active positions</p>
          </div>
        </div>
      </div>
    );
  }

  const getSymbolColor = (symbol: string) => {
    const colors = {
      TSLA: "bg-primary",
      NVDA: "bg-success", 
      AAPL: "bg-accent",
      GOOGL: "bg-chart-4",
      MSFT: "bg-chart-5"
    };
    return colors[symbol as keyof typeof colors] || "bg-muted";
  };

  const getSignalStyles = (signalType: string) => {
    switch (signalType) {
      case 'success':
        return "bg-success/10 text-success";
      case 'destructive':
        return "bg-destructive/10 text-destructive animate-pulse";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Active Positions</h3>
            <p className="text-muted-foreground text-sm">Real-time position monitoring with exit signals</p>
          </div>
          <Button variant="ghost" size="sm" data-testid="view-all-positions">
            View All
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {positions.map((position, index) => (
            <div
              key={position.symbol || index}
              className="flex items-center justify-between p-4 bg-secondary rounded-lg"
              data-testid={`position-${position.symbol.toLowerCase()}`}
            >
              <div className="flex items-center space-x-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getSymbolColor(position.symbol))}>
                  <span className="font-bold text-white text-sm">{position.symbol}</span>
                </div>
                <div>
                  <p className="font-medium">{position.symbol}</p>
                  <p className="text-muted-foreground text-sm">
                    {position.quantity} shares • ${position.entryPrice} avg
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-medium">{position.marketValue || '$0.00'}</p>
                <p className={cn(
                  "text-sm font-medium",
                  position.unrealizedPnL?.includes('+') ? "text-success" : "text-destructive"
                )}>
                  {position.unrealizedPnL || '$0.00'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="px-2 py-1 rounded text-xs font-medium bg-muted/10 text-muted-foreground">
                  Monitor
                </div>
                <Button variant="ghost" size="sm" data-testid={`position-menu-${position.symbol.toLowerCase()}`}>
                  <i className="fas fa-ellipsis-v"></i>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
