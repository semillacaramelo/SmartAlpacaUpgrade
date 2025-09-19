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
  source?: string;
}

interface ActivityFeedProps {
  className?: string;
  activities: Activity[];
  "data-testid"?: string;
}

function getEventIcon(eventType: string): string {
  if (eventType.includes("TRADE")) return "fa-dollar-sign";
  if (eventType.includes("AI")) return "fa-brain";
  if (eventType.includes("ERROR") || eventType.includes("FAILED"))
    return "fa-exclamation-triangle";
  if (eventType.includes("BOT")) return "fa-robot";
  return "fa-info-circle";
}

function formatEventData(data: any): string {
  if (!data) return "";

  try {
    if (typeof data === "string") return data;
    const formatted = Object.entries(data)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(" • ");
    return formatted;
  } catch {
    return JSON.stringify(data);
  }
}

const filterOptions = [
  { label: "All", value: "all", active: true },
  { label: "Trades", value: "trades", active: false },
  { label: "AI Decisions", value: "ai_decisions", active: false },
  { label: "Errors", value: "errors", active: false },
];

export default function ActivityFeed({
  className,
  activities,
  "data-testid": dataTestId,
}: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredActivities = activities.filter((activity) => {
    switch (activeFilter) {
      case "trades":
        return (
          activity.eventType.includes("TRADE") ||
          activity.eventType.includes("ORDER")
        );
      case "ai_decisions":
        return activity.eventType.includes("AI") || activity.source === "ai";
      case "errors":
        return (
          activity.level === "error" ||
          activity.eventType.includes("ERROR") ||
          activity.eventType.includes("FAILED")
        );
      default:
        return true;
    }
  });

  // Show empty state if no activities or no matching filtered activities
  if (
    !activities ||
    activities.length === 0 ||
    filteredActivities.length === 0
  ) {
    return (
      <div
        className={cn("bg-card rounded-lg border border-border", className)}
        data-testid={dataTestId}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Activity Feed</h3>
              <p className="text-muted-foreground text-sm">
                Real-time system events with correlation tracking
              </p>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {activities && activities.length > 0
                ? "No matching activities for the selected filter"
                : "No recent activities"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    const baseClasses =
      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
    switch (type) {
      case "success":
        return cn(baseClasses, "bg-success/10");
      case "primary":
        return cn(baseClasses, "bg-primary/10");
      case "warning":
        return cn(baseClasses, "bg-chart-4/10");
      case "destructive":
        return cn(baseClasses, "bg-destructive/10");
      default:
        return cn(baseClasses, "bg-muted/10");
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-success";
      case "primary":
        return "text-primary";
      case "warning":
        return "text-chart-4";
      case "destructive":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div
      className={cn("bg-card rounded-lg border border-border", className)}
      data-testid={dataTestId}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Activity Feed</h3>
            <p className="text-muted-foreground text-sm">
              Real-time system events with correlation tracking
            </p>
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
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.id || index}
              className="flex items-start space-x-4 p-3 hover:bg-secondary rounded-lg transition-colors animate-slide-up"
              data-testid={`activity-item-${index}`}
            >
              <div className={getActivityIcon(activity.level || "primary")}>
                <i
                  className={cn(
                    "fas",
                    getEventIcon(activity.eventType),
                    "text-sm",
                    getActivityIconColor(activity.level || "primary")
                  )}
                ></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm">{activity.eventType}</p>
                  {activity.correlationId && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-mono">
                      {activity.correlationId}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatEventData(activity.eventData)}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
