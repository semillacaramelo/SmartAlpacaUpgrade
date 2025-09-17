import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

interface AIPipelineProps {
  className?: string;
  botStatus: string;
  pipelineStages?: PipelineStage[];
  'data-testid'?: string;
}

interface PipelineStage {
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  icon: string;
  timestamp?: string;
}

const defaultStages: PipelineStage[] = [
  { name: "Market Scan", description: "Waiting to start", status: "pending", icon: "fas fa-search" },
  { name: "Asset Selection", description: "Waiting for market data", status: "pending", icon: "fas fa-chart-line" },
  { name: "Strategy Generation", description: "Waiting for asset selection", status: "pending", icon: "fas fa-brain" },
  { name: "Risk Validation", description: "Waiting for strategy", status: "pending", icon: "fas fa-shield-alt" },
  { name: "Trade Staging", description: "Waiting for validation", status: "pending", icon: "fas fa-cog" },
  { name: "Execution", description: "Waiting for staging", status: "pending", icon: "fas fa-play" },
];

export default function AIPipeline({
  className,
  botStatus,
  pipelineStages,
  'data-testid': dataTestId
}: AIPipelineProps) {
  const [stages, setStages] = useState<PipelineStage[]>(pipelineStages || defaultStages);
  const [nextCycleTime, setNextCycleTime] = useState("15:00");
  const { lastMessage } = useWebSocket();

  // Update pipeline stages based on real-time WebSocket data
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'ai_pipeline_update') {
      const { stage, status, correlationId } = lastMessage.data;

      setStages(current => {
        const newStages = [...current];
        const stageIndex = newStages.findIndex(s =>
          s.name.toLowerCase().replace(' ', '_') === stage
        );

        if (stageIndex >= 0) {
          // Update the specific stage status
          newStages[stageIndex].status = status;
          newStages[stageIndex].timestamp = new Date().toLocaleTimeString();

          // Update descriptions based on status
          switch (status) {
            case 'started':
              newStages[stageIndex].description = `Started at ${newStages[stageIndex].timestamp}`;
              break;
            case 'completed':
              newStages[stageIndex].description = `Completed at ${newStages[stageIndex].timestamp}`;
              break;
            case 'failed':
              newStages[stageIndex].description = `Failed at ${newStages[stageIndex].timestamp}`;
              break;
          }

          // If a stage completed, mark the next pending stage as active
          if (status === 'completed' && stageIndex < newStages.length - 1) {
            const nextStageIndex = stageIndex + 1;
            if (newStages[nextStageIndex].status === 'pending') {
              newStages[nextStageIndex].status = 'active';
              newStages[nextStageIndex].description = 'Processing...';
            }
          }
        }

        return newStages;
      });
    }
  }, [lastMessage]);

  // Update countdown timer based on bot status
  useEffect(() => {
    if (botStatus === 'running') {
      // Reset timer when bot starts running
      setNextCycleTime("15:00");
    }

    const interval = setInterval(() => {
      setNextCycleTime(prev => {
        const [minutes, seconds] = prev.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds <= 1) {
          // When timer reaches zero, reset to 15 minutes if bot is running
          return botStatus === 'running' ? "15:00" : "00:00";
        }

        const newTotal = totalSeconds - 1;
        const newMinutes = Math.floor(newTotal / 60);
        const newSeconds = newTotal % 60;
        return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [botStatus]);

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
