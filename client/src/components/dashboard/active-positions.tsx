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

const mockPositions = [
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    quantity: 50,
    entryPrice: "242.15",
    currentValue: "$12,350.00",
    pnl: "+$425.50",
    pnlPercent: "+3.57%",
    signal: "Hold",
    signalType: "success"
  },
  {
    symbol: "NVDA", 
    name: "NVIDIA Corp",
    quantity: 25,
    entryPrice: "418.92",
    currentValue: "$10,847.50",
    pnl: "+$374.00",
    pnlPercent: "+3.57%",
    signal: "Exit Signal",
    signalType: "destructive"
  },
  {
    symbol: "AAPL",
    name: "Apple Inc", 
    quantity: 75,
    entryPrice: "175.32",
    currentValue: "$13,224.00",
    pnl: "-$125.25",
    pnlPercent: "-0.94%",
    signal: "Monitor",
    signalType: "muted"
  }
];

export default function ActivePositions({ 
  className, 
  positions,
  'data-testid': dataTestId 
}: ActivePositionsProps) {
  // Use mock data if no positions provided
  const displayPositions = positions.length > 0 ? positions : mockPositions;

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
          {displayPositions.map((position, index) => (
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
                  <p className="font-medium">{position.name || position.symbol}</p>
                  <p className="text-muted-foreground text-sm">
                    {position.quantity} shares • ${position.entryPrice} avg
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-medium">{position.currentValue || '$0.00'}</p>
                <p className={cn(
                  "text-sm font-medium",
                  position.pnl?.includes('+') ? "text-success" : "text-destructive"
                )}>
                  {position.pnl} ({position.pnlPercent})
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  getSignalStyles(position.signalType || 'muted')
                )}>
                  {position.signal || 'Monitor'}
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
