import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Activity {
  id?: string;
  eventType: string;
  eventData?: any;
  correlationId?: string;
  timestamp: string;
  level?: string;
}

interface ActivityFeedProps {
  className?: string;
  activities: Activity[];
  'data-testid'?: string;
}

const mockActivities = [
  {
    type: "success",
    icon: "fas fa-check",
    title: "Trade Executed Successfully",
    correlationId: "COR-7f8d9e2a",
    description: "Bought 50 shares of TSLA at $245.12 • Strategy: AI-RSI-Momentum-v2.1",
    timestamp: "2 minutes ago"
  },
  {
    type: "primary",
    icon: "fas fa-brain",
    title: "AI Strategy Generated", 
    correlationId: "COR-3a1b8c5d",
    description: "Generated momentum strategy for NVDA • Confidence: 87.3% • Backtest: +12.4%",
    timestamp: "5 minutes ago"
  },
  {
    type: "warning",
    icon: "fas fa-exclamation-triangle",
    title: "Strategy Validation Failed",
    correlationId: "COR-9e4f2a8b", 
    description: "MSFT strategy rejected • Reason: Insufficient historical performance (-2.3%)",
    timestamp: "8 minutes ago"
  },
  {
    type: "primary",
    icon: "fas fa-search",
    title: "Market Scan Completed",
    correlationId: "COR-1c7e5b9f",
    description: "Analyzed 2,847 assets • Market trend: Bullish • Volatility: Moderate", 
    timestamp: "12 minutes ago"
  },
  {
    type: "destructive",
    icon: "fas fa-times",
    title: "Position Closed",
    correlationId: "COR-4d8a1f3e",
    description: "Sold 75 shares of META at $312.45 • P&L: +$1,247.80 (+5.23%) • Held: 3.2 days",
    timestamp: "18 minutes ago"
  }
];

const filterOptions = [
  { label: "All", value: "all", active: true },
  { label: "Trades", value: "trades", active: false },
  { label: "AI Decisions", value: "ai_decisions", active: false },
  { label: "Errors", value: "errors", active: false },
];

export default function ActivityFeed({ 
  className, 
  activities,
  'data-testid': dataTestId 
}: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Use mock data if no activities provided
  const displayActivities = activities.length > 0 ? activities : mockActivities;

  const getActivityIcon = (type: string) => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
    switch (type) {
      case 'success':
        return cn(baseClasses, "bg-success/10");
      case 'primary':
        return cn(baseClasses, "bg-primary/10");
      case 'warning':
        return cn(baseClasses, "bg-chart-4/10");
      case 'destructive':
        return cn(baseClasses, "bg-destructive/10");
      default:
        return cn(baseClasses, "bg-muted/10");
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return "text-success";
      case 'primary':
        return "text-primary";
      case 'warning':
        return "text-chart-4";
      case 'destructive':
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Activity Feed</h3>
            <p className="text-muted-foreground text-sm">Real-time system events with correlation tracking</p>
          </div>
          <div className="flex items-center space-x-2">
            {filterOptions.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
                data-testid={`activity-filter-${filter.value}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6 max-h-64 overflow-auto">
        <div className="space-y-3">
          {displayActivities.map((activity, index) => (
            <div 
              key={index}
              className="flex items-start space-x-4 p-3 hover:bg-secondary rounded-lg transition-colors animate-slide-up"
              data-testid={`activity-item-${index}`}
            >
              <div className={getActivityIcon(activity.type || 'primary')}>
                <i className={cn(activity.icon, "text-sm", getActivityIconColor(activity.type || 'primary'))}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  {activity.correlationId && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-mono">
                      {activity.correlationId}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{activity.description}</p>
                <p className="text-muted-foreground text-xs mt-1">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
