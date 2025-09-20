import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useMetrics } from "../../hooks/use-metrics";
import { Activity, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import ResilienceMonitoring from "./resilience-monitoring";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold?: number;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
  icon,
}) => {
  const isWarning = threshold && value > threshold;

  return (
    <Card className={`${isWarning ? "border-red-200 bg-red-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-gray-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isWarning ? "text-red-600" : "text-gray-900"}`}>
          {value.toFixed(2)} {unit}
        </div>
        {threshold && (
          <p className="text-xs text-gray-500 mt-1">
            Threshold: {threshold} {unit}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const SystemPerformanceTab: React.FC = () => {
  const { metrics, historicalMetrics } = useMetrics();

  const formatMetricsForChart = () => {
    if (!historicalMetrics || historicalMetrics.length === 0) {
      return [];
    }

    return historicalMetrics.map((metric, index) => ({
      time: new Date(Date.now() - (historicalMetrics.length - index) * 60000).toLocaleTimeString(),
      cpu: metric.cpu || 0,
      memory: metric.memory || 0,
      responseTime: metric.responseTime || 0,
    }));
  };

  return (
    <div className="space-y-6">
      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics?.system?.cpu || 0}
          unit="%"
          threshold={80}
          icon={<Activity />}
        />
        <MetricCard
          title="Memory Usage"
          value={metrics?.system?.memory || 0}
          unit="%"
          threshold={85}
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Response Time"
          value={metrics?.application?.responseTime || 0}
          unit="ms"
          threshold={1000}
          icon={<Activity />}
        />
        <MetricCard
          title="Error Rate"
          value={metrics?.application?.errorRate || 0}
          unit="%"
          threshold={5}
          icon={<AlertTriangle />}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatMetricsForChart()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="CPU Usage (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Memory Usage (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatMetricsForChart()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>CPU Usage:</span>
                <span className="font-bold">{metrics?.system?.cpu || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Usage:</span>
                <span className="font-bold">{metrics?.system?.memory || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-bold">{metrics?.system?.latency || 0}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Request Rate:</span>
                <span className="font-bold">{metrics?.application?.requestRate || 0}/min</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className="font-bold text-red-600">{metrics?.application?.errorRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className="font-bold">{metrics?.application?.responseTime || 0}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trading Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Execution Time:</span>
                <span className="font-bold">{metrics?.trading?.executionTime || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-bold text-green-600">{metrics?.trading?.successRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage:</span>
                <span className="font-bold">{metrics?.trading?.slippage || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const EnhancedMonitoringDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Monitor system performance, health, and resilience</p>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="resilience" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Resilience</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <SystemPerformanceTab />
        </TabsContent>

        <TabsContent value="resilience">
          <ResilienceMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedMonitoringDashboard;