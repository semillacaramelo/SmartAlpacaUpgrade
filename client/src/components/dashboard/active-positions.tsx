import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnL: string;
  unrealizedPnLPercent: number;
}

interface PositionSignal {
  type: "buy" | "sell" | "monitor";
  reason?: string;
}

function getPositionSignal(position: Position): PositionSignal {
  // Example signal logic based on unrealized P&L %
  const threshold = 5; // 5% threshold for signals
  if (position.unrealizedPnLPercent <= -threshold) {
    return { type: "buy", reason: "Position down significantly" };
  } else if (position.unrealizedPnLPercent >= threshold) {
    return { type: "sell", reason: "Take profit opportunity" };
  }
  return { type: "monitor" };
}

interface ActivePositionsProps {
  className?: string;
  positions: Position[];
  "data-testid"?: string;
}

export default function ActivePositions({
  className,
  positions,
  "data-testid": dataTestId,
}: ActivePositionsProps) {
  // Show empty state if no positions
  if (!positions || positions.length === 0) {
    return (
      <div
        className={cn("bg-card rounded-lg border border-border", className)}
        data-testid={dataTestId}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Positions</h3>
              <p className="text-muted-foreground text-sm">
                Real-time position monitoring with exit signals
              </p>
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

  // Generate consistent color based on symbol string
  const getSymbolColor = (symbol: string) => {
    const colors = [
      "bg-primary",
      "bg-success",
      "bg-accent",
      "bg-chart-4",
      "bg-chart-5",
    ];
    // Use string hash to consistently pick a color
    const hash = symbol
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const getSignalStyles = (signal: PositionSignal) => {
    switch (signal.type) {
      case "buy":
        return "bg-success/10 text-success";
      case "sell":
        return "bg-destructive/10 text-destructive animate-pulse";
      case "monitor":
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <div
      className={cn("bg-card rounded-lg border border-border", className)}
      data-testid={dataTestId}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Active Positions</h3>
            <p className="text-muted-foreground text-sm">
              Real-time position monitoring with exit signals
            </p>
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
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    getSymbolColor(position.symbol)
                  )}
                >
                  <span className="font-bold text-white text-sm">
                    {position.symbol}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{position.symbol}</p>
                  <p className="text-muted-foreground text-sm">
                    {position.quantity} shares • ${position.entryPrice} avg
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-medium">{position.marketValue || "$0.00"}</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    position.unrealizedPnL?.includes("+")
                      ? "text-success"
                      : "text-destructive"
                  )}
                >
                  {position.unrealizedPnL || "$0.00"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {(() => {
                  const signal = getPositionSignal(position);
                  const signalStyle = getSignalStyles(signal);
                  return (
                    <div
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        signalStyle
                      )}
                      title={signal.reason}
                    >
                      {signal.type.charAt(0).toUpperCase() +
                        signal.type.slice(1)}
                    </div>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid={`position-menu-${position.symbol.toLowerCase()}`}
                >
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
