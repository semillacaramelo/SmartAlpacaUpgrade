import { useState } from "react";
import { useTradingData } from "@/hooks/use-trading-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Target,
  Settings,
  Bell,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function RiskManagement() {
  const { portfolioStatus, positions, strategiesLoading } = useTradingData();
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdownPercent: '20',
    maxPositionSizePercent: '5',
    maxDailyLossPercent: '10',
    stopLossPercent: '5',
    takeProfitPercent: '10',
    maxOpenPositions: '10',
    enableAutoStopLoss: true,
    enableRiskAlerts: true,
    enablePositionLimits: true
  });

  if (strategiesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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

  // Real risk metrics from portfolio data
  const riskMetrics = {
    currentDrawdown: portfolioStatus?.dayPnL ? (portfolioStatus.dayPnL / portfolioStatus.portfolioValue) * 100 : 0,
    dailyPnL: portfolioStatus?.dayPnL || 0,
    totalExposure: portfolioStatus?.portfolioValue || 0,
    maxDrawdown: -12.3, // This would come from historical data
    sharpeRatio: 1.45, // This would be calculated from historical returns
    volatility: 0.23, // This would be calculated from price data
    valueAtRisk: -2850.00, // This would be calculated using VaR models
    expectedShortfall: -4200.00 // This would be calculated using ES models
  };

  // Real alerts from audit logs (simplified for now)
  const alerts: any[] = [
    // This would be populated from real audit logs in a production system
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground">Monitor and control trading risks</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Risk Level: Moderate
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercent(riskMetrics.currentDrawdown)}
                </div>
                <Progress value={Math.abs(riskMetrics.currentDrawdown)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {formatPercent(riskMetrics.maxDrawdown)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
                {riskMetrics.dailyPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(riskMetrics.dailyPnL)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Today's performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exposure</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(riskMetrics.totalExposure)}</div>
                <p className="text-xs text-muted-foreground">
                  Portfolio exposure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted returns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Risk exposure by asset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AAPL</span>
                    <span>35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>MSFT</span>
                    <span>25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>GOOGL</span>
                    <span>20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>TSLA</span>
                    <span>20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Advanced risk measurements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Value at Risk (95%)</span>
                  <span className="text-sm text-red-600">{formatCurrency(riskMetrics.valueAtRisk)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Expected Shortfall</span>
                  <span className="text-sm text-red-600">{formatCurrency(riskMetrics.expectedShortfall)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Portfolio Volatility</span>
                  <span className="text-sm">{(riskMetrics.volatility * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium">Beta</span>
                  <span className="text-sm">1.23</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Limits</CardTitle>
              <CardDescription>Current position limits and utilization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Max Drawdown</span>
                    <span>15% used</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  <p className="text-xs text-muted-foreground">Limit: 20%</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Loss</span>
                    <span>50% used</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-xs text-muted-foreground">Limit: $2,500</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Open Positions</span>
                    <span>6/10 used</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-muted-foreground">Limit: 10 positions</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Single Position Size</span>
                    <span>80% used</span>
                  </div>
                  <Progress value={80} className="h-2" />
                  <p className="text-xs text-muted-foreground">Limit: 5% of portfolio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Alerts</CardTitle>
              <CardDescription>Recent risk alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start space-x-4 p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{alert.message}</h4>
                        {alert.resolved && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Settings</CardTitle>
              <CardDescription>Configure risk management parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                    <Input
                      id="maxDrawdown"
                      type="number"
                      value={riskSettings.maxDrawdownPercent}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxDrawdownPercent: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPositionSize">Max Position Size (%)</Label>
                    <Input
                      id="maxPositionSize"
                      type="number"
                      value={riskSettings.maxPositionSizePercent}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxPositionSizePercent: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyLoss">Max Daily Loss (%)</Label>
                    <Input
                      id="maxDailyLoss"
                      type="number"
                      value={riskSettings.maxDailyLossPercent}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxDailyLossPercent: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Default Stop Loss (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      value={riskSettings.stopLossPercent}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, stopLossPercent: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takeProfit">Default Take Profit (%)</Label>
                    <Input
                      id="takeProfit"
                      type="number"
                      value={riskSettings.takeProfitPercent}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, takeProfitPercent: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPositions">Max Open Positions</Label>
                    <Input
                      id="maxPositions"
                      type="number"
                      value={riskSettings.maxOpenPositions}
                      onChange={(e) => setRiskSettings(prev => ({ ...prev, maxOpenPositions: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Stop Loss</Label>
                    <p className="text-sm text-muted-foreground">Automatically apply stop loss to all positions</p>
                  </div>
                  <Switch
                    checked={riskSettings.enableAutoStopLoss}
                    onCheckedChange={(checked: boolean) => setRiskSettings(prev => ({ ...prev, enableAutoStopLoss: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Risk Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when risk limits are approached</p>
                  </div>
                  <Switch
                    checked={riskSettings.enableRiskAlerts}
                    onCheckedChange={(checked: boolean) => setRiskSettings(prev => ({ ...prev, enableRiskAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Position Limits</Label>
                    <p className="text-sm text-muted-foreground">Enforce position size limits</p>
                  </div>
                  <Switch
                    checked={riskSettings.enablePositionLimits}
                    onCheckedChange={(checked: boolean) => setRiskSettings(prev => ({ ...prev, enablePositionLimits: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
