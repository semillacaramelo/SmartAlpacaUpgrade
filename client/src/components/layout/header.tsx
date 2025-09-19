import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  TestTube,
} from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  botStatus: string;
}

export default function Header({ isConnected, botStatus }: HeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiSettings, setShowApiSettings] = useState(false);

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    alpacaApiKey: "",
    alpacaSecretKey: "",
    geminiApiKey: "",
  });

  const [showApiKeys, setShowApiKeys] = useState({
    alpaca: false,
    gemini: false,
  });

  const [connectionStatus, setConnectionStatus] = useState({
    alpaca: { status: "unknown", message: "" },
    gemini: { status: "unknown", message: "" },
  });

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

  const testApiConnection = async (service: "alpaca" | "gemini") => {
    setConnectionStatus((prev) => ({
      ...prev,
      [service]: { status: "testing", message: "Testing connection..." },
    }));

    try {
      let response;
      if (service === "alpaca") {
        response = await fetch("/api/test/alpaca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: apiSettings.alpacaApiKey,
            secretKey: apiSettings.alpacaSecretKey,
          }),
        });
      } else {
        response = await fetch("/api/test/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: apiSettings.geminiApiKey }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Connection failed.");
      }

      setConnectionStatus((prev) => ({
        ...prev,
        [service]: { status: "success", message: "Connection successful!" },
      }));
      queryClient.invalidateQueries();
    } catch (error: any) {
      setConnectionStatus((prev) => ({
        ...prev,
        [service]: { status: "error", message: error.message },
      }));
    }
  };

  const isRunning = botStatus === "running";

  return (
    <header
      className="bg-card border-b border-border px-6 py-4 flex items-center justify-between"
      data-testid="header"
    >
      <div className="flex items-center space-x-6">
        <div>
          <h2 className="text-2xl font-bold">Trading Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Real-time AI-powered trading system
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isRunning ? "bg-success/10" : "bg-muted"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isRunning ? "text-success" : "text-muted-foreground"
              }`}
            >
              Bot {isRunning ? "Active" : "Stopped"}
            </span>
          </div>
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isConnected ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            <i
              className={`fas fa-wifi text-sm ${
                isConnected ? "text-primary" : "text-destructive"
              }`}
            ></i>
            <span
              className={`text-sm font-medium ${
                isConnected ? "text-primary" : "text-destructive"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="destructive"
          onClick={() => stopBotMutation.mutate()}
          disabled={!isRunning || stopBotMutation.isPending}
          data-testid="button-stop-bot"
        >
          <i className="fas fa-stop mr-2"></i>
          {stopBotMutation.isPending ? "Stopping..." : "Stop Bot"}
        </Button>
        <Button
          variant="default"
          onClick={() => startBotMutation.mutate()}
          disabled={isRunning || startBotMutation.isPending}
          data-testid="button-start-bot"
        >
          <i className="fas fa-play mr-2"></i>
          {startBotMutation.isPending ? "Starting..." : "Start Bot"}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          data-testid="button-notifications"
        >
          <i className="fas fa-bell"></i>
        </Button>

        <Dialog open={showApiSettings} onOpenChange={setShowApiSettings}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              data-testid="button-api-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>API Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Configure API keys for Alpaca and Gemini. Keys are stored
                  locally for testing and are not persisted on the server.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alpaca Trading API</h3>
                <div className="space-y-2">
                  <Label htmlFor="header-alpaca-api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="header-alpaca-api-key"
                      type={showApiKeys.alpaca ? "text" : "password"}
                      value={apiSettings.alpacaApiKey}
                      onChange={(e) =>
                        setApiSettings((p) => ({
                          ...p,
                          alpacaApiKey: e.target.value,
                        }))
                      }
                      placeholder="Enter your Alpaca API Key"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowApiKeys((p) => ({ ...p, alpaca: !p.alpaca }))
                      }
                    >
                      {showApiKeys.alpaca ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="header-alpaca-secret-key">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="header-alpaca-secret-key"
                      type={showApiKeys.alpaca ? "text" : "password"}
                      value={apiSettings.alpacaSecretKey}
                      onChange={(e) =>
                        setApiSettings((p) => ({
                          ...p,
                          alpacaSecretKey: e.target.value,
                        }))
                      }
                      placeholder="Enter your Alpaca Secret Key"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowApiKeys((p) => ({ ...p, alpaca: !p.alpaca }))
                      }
                    >
                      {showApiKeys.alpaca ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Status:</span>
                    <span className="font-medium">
                      {connectionStatus.alpaca.status === "success"
                        ? "Connected"
                        : connectionStatus.alpaca.status === "error"
                        ? "Failed"
                        : connectionStatus.alpaca.status === "testing"
                        ? "Testing..."
                        : "Not Tested"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testApiConnection("alpaca")}
                    disabled={connectionStatus.alpaca.status === "testing"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
                {connectionStatus.alpaca.message && (
                  <Alert
                    variant={
                      connectionStatus.alpaca.status === "success"
                        ? "default"
                        : "destructive"
                    }
                  >
                    <AlertDescription className="flex items-center gap-2">
                      {connectionStatus.alpaca.status === "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {connectionStatus.alpaca.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Google Gemini AI API</h3>
                <div className="space-y-2">
                  <Label htmlFor="header-gemini-api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="header-gemini-api-key"
                      type={showApiKeys.gemini ? "text" : "password"}
                      value={apiSettings.geminiApiKey}
                      onChange={(e) =>
                        setApiSettings((p) => ({
                          ...p,
                          geminiApiKey: e.target.value,
                        }))
                      }
                      placeholder="Enter your Gemini API Key"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowApiKeys((p) => ({ ...p, gemini: !p.gemini }))
                      }
                    >
                      {showApiKeys.gemini ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Status:</span>
                    <span className="font-medium">
                      {connectionStatus.gemini.status === "success"
                        ? "Connected"
                        : connectionStatus.gemini.status === "error"
                        ? "Failed"
                        : connectionStatus.gemini.status === "testing"
                        ? "Testing..."
                        : "Not Tested"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testApiConnection("gemini")}
                    disabled={connectionStatus.gemini.status === "testing"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
                {connectionStatus.gemini.message && (
                  <Alert
                    variant={
                      connectionStatus.gemini.status === "success"
                        ? "default"
                        : "destructive"
                    }
                  >
                    <AlertDescription className="flex items-center gap-2">
                      {connectionStatus.gemini.status === "success" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {connectionStatus.gemini.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
