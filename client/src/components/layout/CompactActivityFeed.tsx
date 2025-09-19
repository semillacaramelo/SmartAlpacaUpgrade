import { useEffect, useState } from "react";
import { useTradingData } from "@/hooks/use-trading-data";
import { cn } from "@/lib/utils";
import { X, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id?: string;
  eventType: string;
  eventData?: any;
  correlationId?: string;
  timestamp: string;
  level?: string;
}

interface CompactActivityFeedProps {
  className?: string;
  maxHeight?: number;
  isVisible?: boolean;
  onToggle?: () => void;
}

const getActivityIcon = (level: string = "primary") => {
  const baseClasses =
    "w-2 h-2 rounded-full flex items-center justify-center flex-shrink-0";
  switch (level) {
    case "success":
      return <div className={cn(baseClasses, "bg-green-500")}></div>;
    case "warning":
      return <div className={cn(baseClasses, "bg-yellow-500")}></div>;
    case "error":
    case "destructive":
      return <div className={cn(baseClasses, "bg-red-500")}></div>;
    case "info":
      return <div className={cn(baseClasses, "bg-blue-500")}></div>;
    default:
      return <div className={cn(baseClasses, "bg-gray-500")}></div>;
  }
};

const formatEventType = (type: string) => {
  // Remove common prefixes and format nicely
  return type
    .replace(/^BOT_/, "")
    .replace(/^AI_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function CompactActivityFeed({
  className,
  maxHeight = 200,
  isVisible = true,
  onToggle,
}: CompactActivityFeedProps) {
  const { auditLogs } = useTradingData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNewActivityIndicator, setShowNewActivityIndicator] =
    useState(false);

  // Get recent activities (last 10) and format them
  const activities: ActivityItem[] =
    (auditLogs as any[])?.slice(0, 10)?.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      eventData: log.eventData,
      correlationId: log.correlationId,
      timestamp:
        log.timestamp instanceof Date
          ? log.timestamp.toISOString()
          : log.timestamp || new Date().toISOString(),
      level: log.level,
    })) || [];

  useEffect(() => {
    // Show new activity indicator briefly when new logs arrive
    if (activities.length > 0) {
      setShowNewActivityIndicator(true);
      const timer = setTimeout(() => setShowNewActivityIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [activities.length]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) onToggle();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        onClick={handleToggle}
        size="sm"
        variant="outline"
        className={cn(
          "rounded-full p-2 shadow-lg border-2 relative",
          isExpanded ? "mb-2" : "mb-0",
          showNewActivityIndicator && "border-blue-400 animate-pulse"
        )}
        data-testid="compact-activity-toggle"
      >
        {showNewActivityIndicator && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
        )}
        <ActivityIcon className="w-4 h-4" />
      </Button>

      {/* Activity Feed Panel */}
      <div
        className={cn(
          "bg-card/95 backdrop-blur-sm border rounded-lg shadow-xl transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded
            ? `w-80 opacity-100 scale-100`
            : "w-0 opacity-0 scale-95 pointer-events-none"
        )}
        style={{ maxHeight: isExpanded ? `${maxHeight}px` : "0px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <h6 className="text-sm font-semibold flex items-center gap-2">
            {showNewActivityIndicator && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            Activity Feed
            {activities.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({activities.length})
              </span>
            )}
          </h6>
          <Button
            onClick={() => setIsExpanded(false)}
            size="sm"
            variant="ghost"
            className="h-auto p-1"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Activities List */}
        <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              No recent activities
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50 text-xs"
              >
                {getActivityIcon(activity.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium truncate">
                      {formatEventType(activity.eventType)}
                    </span>
                    {activity.correlationId && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-mono truncate max-w-24">
                        {activity.correlationId.split("_").pop()}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(activity.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with timestamp */}
        {activities.length > 0 && (
          <div className="text-xs text-muted-foreground text-center py-1 px-2 border-t bg-muted/50">
            Last updated:{" "}
            {new Date(activities[0]?.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
