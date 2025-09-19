import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/hooks/use-trading-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TradingChartProps {
  className?: string;
  portfolioValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  "data-testid"?: string;
  chartData?: { time: string; value: number }[];
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
  "data-testid": dataTestId,
}: TradingChartProps) {
  const { portfolioHistory, activeTimeframe, setActiveTimeframe } =
    useTradingData();

  return (
    <div
      className={cn("bg-card rounded-lg border border-border", className)}
      data-testid={dataTestId}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Portfolio Performance</h3>
            <p className="text-muted-foreground text-sm">
              Real-time portfolio value with AI trade markers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={
                  activeTimeframe === timeframe.value ? "default" : "ghost"
                }
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

      <div className="p-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={portfolioHistory || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis
              domain={["dataMin - 100", "dataMax + 100"]}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`,
                "Portfolio Value",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Current Value Display */}
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-2xl font-bold">
              $
              {portfolioValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p
              className={cn(
                "text-sm",
                dayPnL >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {dayPnL >= 0 ? "+" : ""}$
              {Math.abs(dayPnL).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ({dayPnLPercent >= 0 ? "+" : ""}
              {dayPnLPercent.toFixed(2)}%) today
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Trade signals:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-success">Buy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span className="text-destructive">Sell</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
