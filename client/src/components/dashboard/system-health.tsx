import { cn } from "@/lib/utils";

interface SystemHealthItem {
  service: string;
  status: string;
  metrics?: any;
}

interface SystemHealthProps {
  className?: string;
  systemHealth?: SystemHealthItem[];
  services?: Array<{ name: string; status: string; statusType: string }>;
  performanceMetrics?: Array<{ name: string; value: number; color: string }>;
  recentAlerts?: Array<{ type: string; icon: string; title: string; description: string; color: string }>;
  'data-testid'?: string;
}

const defaultServices = [
  { name: "API Server", status: "Unknown", statusType: "warning" },
  { name: "Worker Process", status: "Unknown", statusType: "warning" },
  { name: "Redis", status: "Unknown", statusType: "warning" },
  { name: "Database", status: "Unknown", statusType: "warning" },
  { name: "Alpaca API", status: "Unknown", statusType: "warning" },
  { name: "Gemini AI", status: "Unknown", statusType: "warning" },
];

const defaultPerformanceMetrics = [
  { name: "CPU Usage", value: 0, color: "bg-muted" },
  { name: "Memory Usage", value: 0, color: "bg-muted" },
  { name: "API Quota", value: 0, color: "bg-muted" },
];

export default function SystemHealth({
  className,
  systemHealth,
  services,
  performanceMetrics,
  recentAlerts = [],
  'data-testid': dataTestId
}: SystemHealthProps) {
  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'success':
        return "text-success";
      case 'warning':
        return "text-chart-4 animate-pulse";
      case 'error':
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusDot = (statusType: string) => {
    const baseClasses = "w-2 h-2 rounded-full";
    switch (statusType) {
      case 'success':
        return cn(baseClasses, "bg-success");
      case 'warning':
        return cn(baseClasses, "bg-chart-4 animate-pulse");
      case 'error':
        return cn(baseClasses, "bg-destructive");
      default:
        return cn(baseClasses, "bg-muted-foreground");
    }
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">System Health</h3>
        <p className="text-muted-foreground text-sm">Real-time monitoring and alerts</p>
      </div>
      
      <div className="p-6 space-y-6">
        
        {/* Service Status */}
        <div>
          <h4 className="font-medium mb-3">Service Status</h4>
          <div className="space-y-2">
            {(services || defaultServices).map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{service.name}</span>
                <div className="flex items-center space-x-2">
                  <div className={getStatusDot(service.statusType)}></div>
                  <span className={cn("text-xs", getStatusColor(service.statusType))}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="font-medium mb-3">Performance</h4>
          <div className="space-y-3">
            {(performanceMetrics || defaultPerformanceMetrics).map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{metric.name}</span>
                  <span>{metric.value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full", metric.color)}
                    style={{ width: `${metric.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Alerts */}
        <div>
          <h4 className="font-medium mb-3">Recent Alerts</h4>
          <div className="space-y-2 text-sm">
            {recentAlerts.map((alert, index) => (
              <div key={index} className={cn("flex items-start space-x-2 p-2 rounded", alert.color)}>
                <i className={cn(alert.icon, "mt-0.5")}></i>
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-muted-foreground text-xs">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
