import { useTradingData } from "@/hooks/use-trading-data.tsx";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Brain, BarChart3, DollarSign, Target, Zap, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0.00%";
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function Dashboard() {
  const {
    portfolioStatus,
    positions,
    systemMetrics,
    aiPipelineStages,
    isLoading,
    isApiConnected,
    wsConnected,
  } = useTradingData();

  // Show API connection prompt if not connected
  if (!isApiConnected && !isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Smart Alpaca Dashboard</h1>
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-4 h-4 mr-2" />
            System Status: Offline
          </Badge>
        </div>

        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="space-y-4">
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">API Configuration Required</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                To unlock the full power of Smart Alpaca's AI trading platform, configure your API credentials.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/settings">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure APIs
                </Button>
              </Link>
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                View Documentation
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Skeleton Dashboard */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Portfolio Value", icon: DollarSign, value: "Configure API", desc: "Total account value" },
            { title: "Daily P&L", icon: TrendingUp, value: "Configure API", desc: "Today's performance" },
            { title: "Active Positions", icon: Target, value: "Configure API", desc: "Open positions" },
            { title: "AI Status", icon: Brain, value: "Offline", desc: "Trading bot status" }
          ].map((metric, index) => (
            <Card key={index} className="border-dashed border-gray-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="text-muted-foreground">AI Trading Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">AI pipeline awaiting configuration</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trading activity yet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard when connected
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Smart Alpaca Dashboard</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className={`px-3 py-1 ${wsConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <Activity className="w-4 h-4 mr-2" />
            {wsConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
            Paper Trading
          </Badge>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioStatus?.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(portfolioStatus?.totalReturnPercent)} from start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(portfolioStatus?.dayPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioStatus?.dayPL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(portfolioStatus?.dayPLPercent)} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(positions?.reduce((sum, p) => sum + (p.unrealizedPL || 0), 0))} unrealized P&L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Status</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Next scan in 15 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Trading Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiPipelineStages && aiPipelineStages.length > 0 ? (
              aiPipelineStages.map((stage, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stage.status === 'completed' ? 'bg-green-500' :
                        stage.status === 'active' ? 'bg-blue-500 animate-pulse' :
                          'bg-gray-300'
                      }`} />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <Badge variant={
                    stage.status === 'completed' ? 'default' :
                      stage.status === 'active' ? 'secondary' :
                        'outline'
                  }>
                    {stage.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No active pipeline stages
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Positions and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {positions && positions.length > 0 ? (
              <div className="space-y-3">
                {positions.slice(0, 5).map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{position.symbol}</p>
                      <p className="text-sm text-muted-foreground">{position.qty} shares</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${(position.unrealizedPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPL)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercent(position.unrealizedPLPercent)}
                      </p>
                    </div>
                  </div>
                ))}
                {positions.length > 5 && (
                  <Link href="/portfolio">
                    <Button variant="outline" className="w-full">
                      View All Positions ({positions.length})
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active positions</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics?.cpuUsage || 0}%</span>
                </div>
                <Progress value={systemMetrics?.cpuUsage || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics?.memoryUsage || 0}%</span>
                </div>
                <Progress value={systemMetrics?.memoryUsage || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">API Latency</span>
                  <span className="text-sm text-muted-foreground">{systemMetrics?.apiLatency || 0}ms</span>
                </div>
                <Progress value={Math.min((systemMetrics?.apiLatency || 0) / 10, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Link href="/strategies">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Strategies
              </Button>
            </Link>
            <Link href="/backtest">
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                Run Backtest
              </Button>
            </Link>
            <Link href="/monitoring">
              <Button variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                System Monitor
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}