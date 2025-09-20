import { useTradingData } from "@/hooks/use-trading-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Activity,
  Wifi,
  WifiOff,
  Bot,
  BotOff,
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Settings,
  Zap
} from "lucide-react";

interface HeaderProps {
  className?: string;
  wsConnected?: boolean;
  isApiConnected?: boolean;
  botStatus?: "active" | "stopped" | "error";
}

export function Header({
  className,
  wsConnected = false,
  isApiConnected = false,
  botStatus = "stopped"
}: HeaderProps) {
  const queryClient = useQueryClient();

  // Bot control mutations
  const startBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start bot');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Started",
        description: "AI trading bot is now active",
      });
      queryClient.invalidateQueries({ queryKey: ['bot-status'] });
    },
    onError: (error) => {
      toast({
        title: "Start Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const stopBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bot/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to stop bot');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Stopped",
        description: "AI trading bot has been stopped",
      });
      queryClient.invalidateQueries({ queryKey: ['bot-status'] });
    },
    onError: (error) => {
      toast({
        title: "Stop Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Status calculation functions
  const getConnectionIcon = () => {
    if (wsConnected && isApiConnected) return CheckCircle;
    if (wsConnected || isApiConnected) return Activity;
    return AlertTriangle;
  };

  const getConnectionColor = () => {
    if (wsConnected && isApiConnected) return "bg-green-50 text-green-700 border-green-200";
    if (wsConnected || isApiConnected) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getBotIcon = () => {
    return botStatus === "active" ? Bot : BotOff;
  };

  const getBotColor = () => {
    switch (botStatus) {
      case "active": return "bg-blue-50 text-blue-700 border-blue-200";
      case "error": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const ConnectionIcon = getConnectionIcon();
  const BotIcon = getBotIcon();

  return (
    <header className={`bg-card border-b border-border p-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Brand and Trading Mode */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            🚀 Smart Alpaca Trading Platform
          </h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Paper Trading
          </Badge>
        </div>

        {/* Right side - Status and Controls */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <Badge variant="outline" className={`px-3 py-1 ${getConnectionColor()}`}>
            <ConnectionIcon className="w-4 h-4 mr-2" />
            {wsConnected && isApiConnected ? "Connected" :
              wsConnected || isApiConnected ? "Partial" : "Disconnected"}
          </Badge>

          {/* Bot Status and Controls */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`px-3 py-1 ${getBotColor()}`}>
              <BotIcon className={`w-4 h-4 mr-2 ${botStatus === "active" ? "animate-pulse" : ""}`} />
              Bot {botStatus === "active" ? "Active" : botStatus === "error" ? "Error" : "Stopped"}
            </Badge>

            {/* Bot Control Buttons */}
            {botStatus === "stopped" || botStatus === "error" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startBotMutation.mutate()}
                disabled={startBotMutation.isPending || !isApiConnected}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              >
                <Play className="w-4 h-4 mr-1" />
                Start Bot
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => stopBotMutation.mutate()}
                disabled={stopBotMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop Bot
              </Button>
            )}
          </div>

          {/* Detailed Status Indicators (Desktop only) */}
          <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>WebSocket:</span>
              {wsConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span>API:</span>
              {isApiConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Disconnected</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Quick Access */}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => window.location.href = '/settings'}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}