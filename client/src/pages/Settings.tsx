import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Key, Bot, Zap, Shield, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  message: string;
  loading: boolean;
}

interface ApiSettings {
  alpacaApiKey: string;
  alpacaSecret: string;
  geminiApiKey: string;
}

interface TradingSettings {
  tradingMode: 'paper' | 'live';
  autoTrading: boolean;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
  enableAIRisk: boolean;
}

export default function Settings() {
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiSettings>({
    alpacaApiKey: "",
    alpacaSecret: "",
    geminiApiKey: ""
  });

  // Trading settings state
  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    tradingMode: 'paper',
    autoTrading: false,
    maxPositionSize: 10,
    stopLoss: 5,
    takeProfit: 15,
    enableAIRisk: false
  });

  // UI state
  const [showKeys, setShowKeys] = useState({
    alpacaApiKey: false,
    alpacaSecret: false,
    geminiApiKey: false
  });

  // Test results state
  const [alpacaTest, setAlpacaTest] = useState<TestResult>({
    success: false,
    message: "",
    loading: false
  });

  const [geminiTest, setGeminiTest] = useState<TestResult>({
    success: false,
    message: "",
    loading: false
  });

  const queryClient = useQueryClient();

  // Load settings query
  const { data: loadedSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/api');
      if (!response.ok) throw new Error('Failed to load settings');
      return response.json();
    },
    retry: false,
    meta: {
      errorMessage: 'Failed to load settings'
    }
  });

  // Update API keys when loaded
  useEffect(() => {
    if (loadedSettings) {
      setApiKeys({
        alpacaApiKey: loadedSettings.alpacaApiKey || "",
        alpacaSecret: loadedSettings.alpacaSecret || "",
        geminiApiKey: loadedSettings.geminiApiKey || ""
      });
      setTradingSettings({
        tradingMode: loadedSettings.tradingMode || 'paper',
        autoTrading: loadedSettings.autoTrading || false,
        maxPositionSize: loadedSettings.maxPositionSize || 10,
        stopLoss: loadedSettings.stopLoss || 5,
        takeProfit: loadedSettings.takeProfit || 15,
        enableAIRisk: loadedSettings.enableAIRisk || false
      });
    }
  }, [loadedSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: ApiSettings & TradingSettings) => {
      const response = await fetch('/api/settings/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Saved",
        description: "Your configuration has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test API connections
  const testAlpacaConnection = async () => {
    setAlpacaTest({ success: false, message: "", loading: true });

    try {
      const response = await fetch('/api/test/alpaca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeys.alpacaApiKey,
          secret: apiKeys.alpacaSecret
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAlpacaTest({
          success: true,
          message: result.message || "Connection successful",
          loading: false
        });
      } else {
        setAlpacaTest({
          success: false,
          message: result.message || "Connection failed",
          loading: false
        });
      }
    } catch (error) {
      setAlpacaTest({
        success: false,
        message: "Network error occurred",
        loading: false
      });
    }
  };

  const testGeminiConnection = async () => {
    setGeminiTest({ success: false, message: "", loading: true });

    try {
      const response = await fetch('/api/test/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeys.geminiApiKey
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setGeminiTest({
          success: true,
          message: result.message || "Connection successful",
          loading: false
        });
      } else {
        setGeminiTest({
          success: false,
          message: result.message || "Connection failed",
          loading: false
        });
      }
    } catch (error) {
      setGeminiTest({
        success: false,
        message: "Network error occurred",
        loading: false
      });
    }
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({ ...apiKeys, ...tradingSettings });
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return "*".repeat(key.length - 4) + key.slice(-4);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your trading platform settings</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Configuration
        </Badge>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Risk Management
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Alpaca API Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="https://alpaca.markets/favicon.ico" alt="Alpaca" className="w-5 h-5" />
                  Alpaca API Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alpaca-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="alpaca-key"
                      type={showKeys.alpacaApiKey ? "text" : "password"}
                      placeholder={apiKeys.alpacaApiKey ? maskApiKey(apiKeys.alpacaApiKey) : "Enter Alpaca API key"}
                      value={showKeys.alpacaApiKey ? apiKeys.alpacaApiKey : maskApiKey(apiKeys.alpacaApiKey)}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, alpacaApiKey: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys(prev => ({ ...prev, alpacaApiKey: !prev.alpacaApiKey }))}
                    >
                      {showKeys.alpacaApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alpaca-secret">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="alpaca-secret"
                      type={showKeys.alpacaSecret ? "text" : "password"}
                      placeholder={apiKeys.alpacaSecret ? maskApiKey(apiKeys.alpacaSecret) : "Enter Alpaca secret key"}
                      value={showKeys.alpacaSecret ? apiKeys.alpacaSecret : maskApiKey(apiKeys.alpacaSecret)}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, alpacaSecret: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys(prev => ({ ...prev, alpacaSecret: !prev.alpacaSecret }))}
                    >
                      {showKeys.alpacaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={testAlpacaConnection}
                  disabled={!apiKeys.alpacaApiKey || !apiKeys.alpacaSecret || alpacaTest.loading}
                  className="w-full"
                >
                  {alpacaTest.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Alpaca Connection'
                  )}
                </Button>

                {alpacaTest.message && (
                  <Alert variant={alpacaTest.success ? "default" : "destructive"}>
                    {alpacaTest.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{alpacaTest.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Gemini AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Gemini AI Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="gemini-key"
                      type={showKeys.geminiApiKey ? "text" : "password"}
                      placeholder={apiKeys.geminiApiKey ? maskApiKey(apiKeys.geminiApiKey) : "Enter Gemini API key"}
                      value={showKeys.geminiApiKey ? apiKeys.geminiApiKey : maskApiKey(apiKeys.geminiApiKey)}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKeys(prev => ({ ...prev, geminiApiKey: !prev.geminiApiKey }))}
                    >
                      {showKeys.geminiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={testGeminiConnection}
                  disabled={!apiKeys.geminiApiKey || geminiTest.loading}
                  className="w-full"
                >
                  {geminiTest.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Gemini Connection'
                  )}
                </Button>

                {geminiTest.message && (
                  <Alert variant={geminiTest.success ? "default" : "destructive"}>
                    {geminiTest.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{geminiTest.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Server</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trading Mode</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Paper Trading
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trading-mode">Trading Mode</Label>
                  <Select
                    value={tradingSettings.tradingMode}
                    onValueChange={(value: 'paper' | 'live') =>
                      setTradingSettings(prev => ({ ...prev, tradingMode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trading mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paper">Paper Trading</SelectItem>
                      <SelectItem value="live">Live Trading</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paper trading uses virtual money for testing strategies
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-trading">Auto Trading</Label>
                    <p className="text-sm text-muted-foreground">Enable automated trading execution</p>
                  </div>
                  <Switch
                    id="auto-trading"
                    checked={tradingSettings.autoTrading}
                    onCheckedChange={(checked) =>
                      setTradingSettings(prev => ({ ...prev, autoTrading: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">AI Risk Management</Label>
                  <p className="text-muted-foreground">Enable AI-powered dynamic risk management</p>
                </div>
                <Switch
                  checked={tradingSettings.enableAIRisk}
                  onCheckedChange={(checked) =>
                    setTradingSettings(prev => ({ ...prev, enableAIRisk: checked }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="max-position">Max Position Size (%)</Label>
                  <Input
                    id="max-position"
                    type="number"
                    value={tradingSettings.maxPositionSize}
                    onChange={(e) => setTradingSettings(prev => ({
                      ...prev,
                      maxPositionSize: parseFloat(e.target.value) || 0
                    }))}
                    disabled={tradingSettings.enableAIRisk}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tradingSettings.enableAIRisk
                      ? "AI-managed based on market conditions"
                      : "Maximum percentage of portfolio per position"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                  <Input
                    id="stop-loss"
                    type="number"
                    value={tradingSettings.stopLoss}
                    onChange={(e) => setTradingSettings(prev => ({
                      ...prev,
                      stopLoss: parseFloat(e.target.value) || 0
                    }))}
                    disabled={tradingSettings.enableAIRisk}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tradingSettings.enableAIRisk
                      ? "AI-managed based on volatility"
                      : "Automatic sell when loss exceeds this percentage"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="take-profit">Take Profit (%)</Label>
                  <Input
                    id="take-profit"
                    type="number"
                    value={tradingSettings.takeProfit}
                    onChange={(e) => setTradingSettings(prev => ({
                      ...prev,
                      takeProfit: parseFloat(e.target.value) || 0
                    }))}
                    disabled={tradingSettings.enableAIRisk}
                  />
                  <p className="text-xs text-muted-foreground">
                    {tradingSettings.enableAIRisk
                      ? "AI-managed based on market momentum"
                      : "Automatic sell when profit reaches this percentage"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">System settings coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending || isLoadingSettings}
          size="lg"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}