import { useState } from "react";
import { useTradingData } from "@/hooks/use-trading-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Play, BarChart3, TrendingUp, TrendingDown, Calendar, Target, DollarSign, AlertCircle } from "lucide-react";

export default function Backtest() {
  const { strategies, strategiesLoading } = useTradingData();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  if (strategiesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleRunBacktest = async () => {
    if (!selectedStrategyData || !dateRange.startDate || !dateRange.endDate) {
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setBacktestResults(null);

    try {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedStrategyData.symbol,
          entryRules: selectedStrategyData.entryRules,
          exitRules: selectedStrategyData.exitRules,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run backtest');
      }

      const data = await response.json();
      setBacktestResults(data);
    } catch (error) {
      console.error('Error running backtest:', error);
      // Handle error appropriately
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const selectedStrategyData = strategies && Array.isArray(strategies)
    ? strategies.find((s: any) => s.id === selectedStrategy)
    : null;

  // Safely handle strategies array
  const strategiesArray = Array.isArray(strategies) ? strategies as any[] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategy Backtesting</h1>
          <p className="text-muted-foreground">Test your trading strategies against historical data</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Historical Data Analysis
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backtest Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Backtest Configuration</CardTitle>
            <CardDescription>Configure your backtest parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Select Strategy</Label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a strategy to backtest" />
                </SelectTrigger>
                <SelectContent>
                  {strategiesArray.map((strategy: any) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name} - {strategy.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {selectedStrategyData && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Strategy Details</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {selectedStrategyData.name}</p>
                  <p><strong>Symbol:</strong> {selectedStrategyData.symbol}</p>
                  <p><strong>Status:</strong> <Badge className="ml-1">{selectedStrategyData.status}</Badge></p>
                </div>
              </div>
            )}

            <Button
              onClick={handleRunBacktest}
              disabled={!selectedStrategy || !dateRange.startDate || !dateRange.endDate || isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backtest Results */}
        <Card>
          <CardHeader>
            <CardTitle>Backtest Results</CardTitle>
            <CardDescription>Performance metrics from the backtest</CardDescription>
          </CardHeader>
          <CardContent>
            {backtestResults ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercent(backtestResults.totalReturn * 100)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Return</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {(backtestResults.winRate * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Sharpe Ratio</span>
                    <span className="text-sm">{backtestResults.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Max Drawdown</span>
                    <span className="text-sm text-red-600">{formatPercent(backtestResults.maxDrawdown * 100)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Total Trades</span>
                    <span className="text-sm">{backtestResults.totalTrades}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Profitable Trades</span>
                    <span className="text-sm text-green-600">{backtestResults.profitableTrades}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">Average Return per Trade</span>
                    <span className="text-sm">{formatPercent(backtestResults.averageReturn * 100)}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Report
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Configure your backtest parameters and run the analysis to see results
                </p>
                {!selectedStrategy && (
                  <p className="text-sm text-amber-600">
                    Please select a strategy first
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Backtests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Backtests</CardTitle>
          <CardDescription>Your latest backtest results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategiesArray.length > 0 ? (
              strategiesArray.slice(0, 5).map((strategy: any) => (
                <div key={strategy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      strategy.backtestResults?.totalReturn > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {strategy.backtestResults?.totalReturn > 0 ? (
                        <TrendingUp className={`h-5 w-5 ${
                          strategy.backtestResults?.totalReturn > 0 ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{strategy.name} - {strategy.symbol}</h4>
                      <p className="text-sm text-muted-foreground">
                        {strategy.backtestResults ? 'Backtested' : 'Not backtested yet'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {strategy.backtestResults ? (
                      <>
                        <div className={`font-semibold ${
                          strategy.backtestResults.totalReturn > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercent(strategy.backtestResults.totalReturn * 100)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(strategy.backtestResults.winRate * 100).toFixed(1)}% win rate
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No results</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No strategies available for backtesting</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
