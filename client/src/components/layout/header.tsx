import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isConnected: boolean;
  botStatus: string;
}

export default function Header({ isConnected, botStatus }: HeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/start"),
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "AI trading bot has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start bot: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bot/stop"),
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "AI trading bot has been stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to stop bot: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isRunning = botStatus === 'running';

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between" data-testid="header">
      <div className="flex items-center space-x-6">
        <div>
          <h2 className="text-2xl font-bold">Trading Dashboard</h2>
          <p className="text-muted-foreground text-sm">Real-time AI-powered trading system</p>
        </div>
        
        {/* System Status */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isRunning ? "bg-success/10" : "bg-muted"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"
            }`}></div>
            <span className={`text-sm font-medium ${
              isRunning ? "text-success" : "text-muted-foreground"
            }`}>
              Bot {isRunning ? 'Active' : 'Stopped'}
            </span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isConnected ? "bg-primary/10" : "bg-destructive/10"
          }`}>
            <i className={`fas fa-wifi text-sm ${
              isConnected ? "text-primary" : "text-destructive"
            }`}></i>
            <span className={`text-sm font-medium ${
              isConnected ? "text-primary" : "text-destructive"
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="flex items-center space-x-3">
        <Button
          variant="destructive"
          onClick={() => stopBotMutation.mutate()}
          disabled={!isRunning || stopBotMutation.isPending}
          data-testid="button-stop-bot"
        >
          <i className="fas fa-stop mr-2"></i>
          {stopBotMutation.isPending ? 'Stopping...' : 'Stop Bot'}
        </Button>
        <Button
          variant="default"
          onClick={() => startBotMutation.mutate()}
          disabled={isRunning || startBotMutation.isPending}
          data-testid="button-start-bot"
        >
          <i className="fas fa-play mr-2"></i>
          {startBotMutation.isPending ? 'Starting...' : 'Start Bot'}
        </Button>
        <Button variant="secondary" size="icon" data-testid="button-notifications">
          <i className="fas fa-bell"></i>
        </Button>
      </div>
    </header>
  );
}
