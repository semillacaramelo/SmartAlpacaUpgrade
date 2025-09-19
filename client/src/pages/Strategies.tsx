import { useState } from "react";
import { useTradingData } from "@/hooks/use-trading-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingUp, TrendingDown, Play, Pause, Settings, BarChart3, Target } from "lucide-react";

export default function Strategies() {
  const { strategies, strategiesLoading } = useTradingData();
  const [isGenerating, setIsGenerating] = useState(false);

  if (strategiesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'staged': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateAIStrategy = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start AI strategy generation');
      }

      const data = await response.json();
      console.log('AI strategy generation started:', data);
    } catch (error) {
      console.error('Error generating AI strategy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Safely handle strategies array
  const strategiesArray = Array.isArray(strategies) ? strategies as any[] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Strategies</h1>
          <p className="text-muted-foreground">Manage and monitor your automated trading strategies</p>
        </div>
        <Button onClick={handleGenerateAIStrategy} disabled={isGenerating}>
          <Plus className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating AI Strategy...' : 'Generate AI Strategy'}
        </Button>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategiesArray.length > 0 ? (
          strategiesArray.map((strategy: any) => (
            <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <Badge className={getStatusColor(strategy.status)}>
                    {strategy.status}
                  </Badge>
                </div>
                <CardDescription>{strategy.symbol}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="font-semibold text-green-600">
                      {strategy.backtestResults?.winRate ? `${(strategy.backtestResults.winRate * 100).toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Return</p>
                    <p className="font-semibold">
                      {strategy.backtestResults?.totalReturn ? formatPercent(strategy.backtestResults.totalReturn * 100) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Risk Parameters */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Risk Parameters</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Max Risk: {strategy.riskParameters?.riskPerTrade || 'N/A'}%</p>
                    <p>Stop Loss: {strategy.riskParameters?.stopLossPercent || 'N/A'}%</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Backtest
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  {strategy.status === 'staged' ? (
                    <Button size="sm" className="flex-1">
                      <Play className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  ) : strategy.status === 'active' ? (
                    <Button size="sm" variant="secondary" className="flex-1">
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Strategies Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first trading strategy to start automated trading
                </p>
                <Button onClick={handleGenerateAIStrategy} disabled={isGenerating}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating AI Strategy...' : 'Generate AI Strategy'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Strategy Statistics */}
      {strategiesArray.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{strategiesArray.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {strategiesArray.filter((s: any) => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {strategiesArray.length > 0
                  ? `${(strategiesArray
                      .filter((s: any) => s.backtestResults?.winRate)
                      .reduce((sum: number, s: any) => sum + (s.backtestResults.winRate * 100), 0) /
                      strategiesArray.filter((s: any) => s.backtestResults?.winRate).length || 0).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
