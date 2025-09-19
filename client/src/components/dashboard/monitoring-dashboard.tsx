import React from "react";
import { Card } from "../ui/card";
import { useMetrics } from "../../hooks/use-metrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
}) => {
  const isWarning = threshold && value > threshold;

  return (
    <Card className={`p-4 ${isWarning ? "bg-red-50" : ""}`}>
      <h3 className="text-lg font-medium">{title}</h3>
      <p
        className={`text-2xl font-bold ${
          isWarning ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value.toFixed(2)} {unit}
      </p>
    </Card>
  );
};

const MonitoringDashboard: React.FC = () => {
  const { metrics, historicalMetrics } = useMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics.system.cpu}
          unit="%"
          threshold={80}
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.system.memory}
          unit="%"
          threshold={90}
        />
        <MetricCard
          title="Response Time"
          value={metrics.application.responseTime}
          unit="ms"
          threshold={1000}
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">System Performance Trends</h3>
        <LineChart
          width={800}
          height={400}
          data={historicalMetrics}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cpu"
            stroke="#8884d8"
            name="CPU Usage"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="memory"
            stroke="#82ca9d"
            name="Memory Usage"
          />
        </LineChart>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Trading Metrics</h3>
          <div className="space-y-4">
            <MetricCard
              title="Trade Success Rate"
              value={metrics.trading.successRate}
              unit="%"
              threshold={95}
            />
            <MetricCard
              title="Average Slippage"
              value={metrics.trading.slippage * 100}
              unit="%"
              threshold={0.1}
            />
            <MetricCard
              title="Execution Time"
              value={metrics.trading.executionTime}
              unit="ms"
              threshold={500}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Application Health</h3>
          <div className="space-y-4">
            <MetricCard
              title="Request Rate"
              value={metrics.application.requestRate}
              unit="req/s"
            />
            <MetricCard
              title="Error Rate"
              value={metrics.application.errorRate}
              unit="err/s"
              threshold={1}
            />
            <MetricCard
              title="Average Response Time"
              value={metrics.application.responseTime}
              unit="ms"
              threshold={1000}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
