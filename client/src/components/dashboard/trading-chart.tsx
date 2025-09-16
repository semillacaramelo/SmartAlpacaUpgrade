import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TradingChartProps {
  className?: string;
  portfolioValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  'data-testid'?: string;
}

const timeframes = [
  { label: "1D", value: "1d", active: true },
  { label: "1W", value: "1w", active: false },
  { label: "1M", value: "1m", active: false },
  { label: "1Y", value: "1y", active: false },
];

export default function TradingChart({
  className,
  portfolioValue,
  dayPnL,
  dayPnLPercent,
  'data-testid': dataTestId,
}: TradingChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState("1d");

  return (
    <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Portfolio Performance</h3>
            <p className="text-muted-foreground text-sm">Real-time portfolio value with AI trade markers</p>
          </div>
          <div className="flex items-center space-x-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={activeTimeframe === timeframe.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTimeframe(timeframe.value)}
                data-testid={`chart-timeframe-${timeframe.value}`}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 h-96 trading-chart relative rounded-b-lg">
        <div className="w-full h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-10">
            <div className="col-span-full row-span-full border-r border-b border-muted-foreground"></div>
          </div>
          
          {/* Sample Chart Line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor: "hsl(var(--primary))", stopOpacity: 0.3}} />
                <stop offset="100%" style={{stopColor: "hsl(var(--primary))", stopOpacity: 0}} />
              </linearGradient>
            </defs>
            <path 
              d="M0,150 Q50,120 100,130 T200,110 T300,90 T400,85" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2" 
              fill="none"
            />
            <path 
              d="M0,200 L0,150 Q50,120 100,130 T200,110 T300,90 T400,85 L400,200 Z" 
              fill="url(#chartGradient)"
            />
            
            {/* Trade markers */}
            <circle cx="120" cy="128" r="4" fill="hsl(var(--success))" className="animate-pulse" />
            <circle cx="220" cy="108" r="4" fill="hsl(var(--destructive))" className="animate-pulse" />
            <circle cx="320" cy="88" r="4" fill="hsl(var(--success))" className="animate-pulse" />
          </svg>
          
          {/* Chart Legend */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-success">Buy Signal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span className="text-destructive">Sell Signal</span>
            </div>
          </div>
          
          {/* Current Value Display */}
          <div className="absolute top-4 left-4">
            <p className="text-2xl font-bold" data-testid="chart-current-value">
              ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={cn("text-sm", dayPnL >= 0 ? "text-success" : "text-destructive")}>
              {dayPnL >= 0 ? '+' : ''}${Math.abs(dayPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({dayPnLPercent >= 0 ? '+' : ''}{dayPnLPercent.toFixed(2)}%) today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
