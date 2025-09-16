import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AIPipelineProps {
  className?: string;
  botStatus: string;
  'data-testid'?: string;
}

interface PipelineStage {
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  icon: string;
  timestamp?: string;
}

export default function AIPipeline({ 
  className, 
  botStatus,
  'data-testid': dataTestId 
}: AIPipelineProps) {
  const [stages, setStages] = useState<PipelineStage[]>([
    { name: "Market Scan", description: "Completed 2 min ago", status: "completed", icon: "fas fa-check" },
    { name: "Asset Selection", description: "TSLA, NVDA, AAPL selected", status: "completed", icon: "fas fa-check" },
    { name: "Strategy Generation", description: "AI generating strategy...", status: "active", icon: "fas fa-brain" },
    { name: "Risk Validation", description: "Waiting for strategy...", status: "pending", icon: "fas fa-clock" },
    { name: "Trade Staging", description: "Pending validation...", status: "pending", icon: "fas fa-clock" },
    { name: "Execution", description: "Ready for deployment", status: "pending", icon: "fas fa-clock" },
  ]);

  const [nextCycleTime, setNextCycleTime] = useState("14:32");

  useEffect(() => {
    if (botStatus === 'running') {
      // Simulate pipeline progression when bot is running
      const interval = setInterval(() => {
        setStages(current => {
          const newStages = [...current];
          const activeIndex = newStages.findIndex(s => s.status === 'active');
          const pendingIndex = newStages.findIndex(s => s.status === 'pending');
          
          if (activeIndex >= 0 && Math.random() > 0.7) {
            newStages[activeIndex].status = 'completed';
            if (pendingIndex >= 0) {
              newStages[pendingIndex].status = 'active';
            }
          }
          
          return newStages;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [botStatus]);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNextCycleTime(prev => {
        const [minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds <= 1) return "15:00"; // Reset to 15 minutes
        
        const newTotal = totalSeconds - 1;
        const newMinutes = Math.floor(newTotal / 60);
        const newSeconds = newTotal % 60;
        return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStageStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          container: "bg-success/10",
          icon: "bg-success text-success-foreground",
          text: "text-success",
          indicator: "✓"
        };
      case 'active':
        return {
          container: "bg-primary/10",
          icon: "bg-primary text-primary-foreground animate-pulse",
          text: "text-primary",
          indicator: "●"
        };
      case 'failed':
        return {
          container: "bg-destructive/10",
          icon: "bg-destructive text-destructive-foreground",
          text: "text-destructive",
          indicator: "✗"
        };
      default:
        return {
          container: "bg-muted opacity-60",
          icon: "bg-muted-foreground text-background",
          text: "text-muted-foreground",
          indicator: "○"
        };
    }
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border", className)} data-testid={dataTestId}>
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">AI Decision Pipeline</h3>
        <p className="text-muted-foreground text-sm">6-stage autonomous trading process</p>
      </div>
      
      <div className="p-6 space-y-4">
        {stages.map((stage, index) => {
          const styles = getStageStyles(stage.status);
          return (
            <div 
              key={index}
              className={cn("flex items-center space-x-3 p-3 rounded-lg", styles.container)}
              data-testid={`pipeline-stage-${stage.name.toLowerCase().replace(' ', '-')}`}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", styles.icon)}>
                <i className={cn(stage.icon, "text-sm")}></i>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{stage.name}</p>
                <p className="text-muted-foreground text-xs">{stage.description}</p>
              </div>
              <div className={cn("text-xs font-medium", styles.text)}>
                {styles.indicator}
              </div>
            </div>
          );
        })}
        
        {/* Next Cycle Timer */}
        <div className="mt-6 p-3 bg-secondary rounded-lg text-center">
          <p className="text-muted-foreground text-xs">Next AI cycle in</p>
          <p className="font-mono font-bold text-lg" data-testid="next-cycle-countdown">{nextCycleTime}</p>
        </div>
      </div>
    </div>
  );
}
