import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings as SettingsIcon,
  Key,
  Bell,
  Palette,
  Shield,
  Database,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Settings() {
  const [apiSettings, setApiSettings] = useState({
    alpacaApiKey: "",
    alpacaSecretKey: "",
    geminiApiKey: "",
    enablePaperTrading: true,
    enableRealTrading: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    tradeAlerts: true,
    riskAlerts: true,
    systemAlerts: true,
    emailAddress: "",
  });

  const [uiSettings, setUiSettings] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    itemsPerPage: "25",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "5",
  });

  const [showApiKeys, setShowApiKeys] = useState({
    alpaca: false,
    gemini: false,
  });

  const [connectionStatus, setConnectionStatus] = useState({
    alpaca: { status: "unknown", message: "" },
    gemini: { status: "unknown", message: "" },
  });

  // Load current settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/settings/api?userId=demo-user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings");
        }

        // Populate the form with loaded settings
        setApiSettings({
          alpacaApiKey: data.alpacaApiKey || "",
          alpacaSecretKey: data.alpacaSecretKey || "",
          geminiApiKey: data.geminiApiKey || "",
          enablePaperTrading:
            data.enablePaperTrading !== undefined
              ? data.enablePaperTrading
              : true,
          enableRealTrading:
            data.enableRealTrading !== undefined
              ? data.enableRealTrading
              : false,
        });

        console.log("Settings loaded successfully:", {
          alpacaApiKey: !!data.alpacaApiKey,
          alpacaSecretKey: !!data.alpacaSecretKey,
          geminiApiKey: !!data.geminiApiKey,
          enablePaperTrading: data.enablePaperTrading,
          enableRealTrading: data.enableRealTrading,
        });
      } catch (error: any) {
        console.error("Load settings error:", error);
        setError(`Failed to load settings: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: apiSettings.alpacaApiKey,
            secretKey: apiSettings.alpacaSecretKey,
          }),
        });
      } else {
        response = await fetch("/api/test/gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: apiSettings.geminiApiKey,
          }),
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
    } catch (error: any) {
      setConnectionStatus((prev) => ({
        ...prev,
        [service]: { status: "error", message: error.message },
      }));
    }
  };

  const saveApiSettings = async () => {
    try {
      console.log("Sending settings:", {
        userId: "demo-user",
        alpacaApiKey: !!apiSettings.alpacaApiKey, // Don't log actual keys
        alpacaSecretKey: !!apiSettings.alpacaSecretKey,
        geminiApiKey: !!apiSettings.geminiApiKey,
        enablePaperTrading: apiSettings.enablePaperTrading,
        enableRealTrading: apiSettings.enableRealTrading,
      });

      const response = await fetch("/api/settings/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user", // For now, using demo-user as the userId
          alpacaApiKey: apiSettings.alpacaApiKey,
          alpacaSecretKey: apiSettings.alpacaSecretKey,
          geminiApiKey: apiSettings.geminiApiKey,
          enablePaperTrading: apiSettings.enablePaperTrading,
          enableRealTrading: apiSettings.enableRealTrading,
        }),
      });

      const data = await response.json();

      console.log("Response received:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save settings.");
      }

      alert("API settings saved successfully!");
    } catch (error: any) {
      console.error("Save settings error:", error);
      alert(`Failed to save API settings: ${error.message}`);
    }
  };

  const getConnectionStatusIcon = (statusObj: {
    status: string;
    message: string;
  }) => {
    switch (statusObj.status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "testing":
        return (
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getConnectionStatusText = (statusObj: {
    status: string;
    message: string;
  }) => {
    switch (statusObj.status) {
      case "success":
        return "Connected";
      case "error":
        return "Connection Failed";
      case "testing":
        return "Testing...";
      default:
        return "Not Configured";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your trading application
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Configuration Center
        </Badge>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ui">Interface</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* API Settings Tab */}
        <TabsContent value="api" className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              API keys are encrypted and stored securely. Never share your API
              keys with anyone.
            </AlertDescription>
          </Alert>

          {/* Alpaca API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alpaca Trading API
              </CardTitle>
              <CardDescription>
                Configure your Alpaca brokerage API credentials for live trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alpacaApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="alpacaApiKey"
                      type={showApiKeys.alpaca ? "text" : "password"}
                      value={apiSettings.alpacaApiKey}
                      onChange={(e) =>
                        setApiSettings((prev) => ({
                          ...prev,
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
                        setShowApiKeys((prev) => ({
                          ...prev,
                          alpaca: !prev.alpaca,
                        }))
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
                  <Label htmlFor="alpacaSecretKey">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="alpacaSecretKey"
                      type={showApiKeys.alpaca ? "text" : "password"}
                      value={apiSettings.alpacaSecretKey}
                      onChange={(e) =>
                        setApiSettings((prev) => ({
                          ...prev,
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
                        setShowApiKeys((prev) => ({
                          ...prev,
                          alpaca: !prev.alpaca,
                        }))
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
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Paper Trading</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Alpaca's paper trading environment
                  </p>
                </div>
                <Switch
                  checked={apiSettings.enablePaperTrading}
                  onCheckedChange={(checked: boolean) =>
                    setApiSettings((prev) => ({
                      ...prev,
                      enablePaperTrading: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Live Trading</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable live trading with real money
                  </p>
                </div>
                <Switch
                  checked={apiSettings.enableRealTrading}
                  onCheckedChange={(checked: boolean) =>
                    setApiSettings((prev) => ({
                      ...prev,
                      enableRealTrading: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Connection Status</span>
                  {getConnectionStatusIcon(connectionStatus.alpaca)}
                  <span className="text-sm text-muted-foreground">
                    {getConnectionStatusText(connectionStatus.alpaca)}
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
                  {connectionStatus.alpaca.status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {connectionStatus.alpaca.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Gemini API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Google Gemini AI API
              </CardTitle>
              <CardDescription>
                Configure your Gemini API key for AI-powered trading analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="geminiApiKey"
                    type={showApiKeys.gemini ? "text" : "password"}
                    value={apiSettings.geminiApiKey}
                    onChange={(e) =>
                      setApiSettings((prev) => ({
                        ...prev,
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
                      setShowApiKeys((prev) => ({
                        ...prev,
                        gemini: !prev.gemini,
                      }))
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Connection Status</span>
                  {getConnectionStatusIcon(connectionStatus.gemini)}
                  <span className="text-sm text-muted-foreground">
                    {getConnectionStatusText(connectionStatus.gemini)}
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
                  {connectionStatus.gemini.status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {connectionStatus.gemini.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveApiSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save API Settings
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={notificationSettings.emailAddress}
                  onChange={(e) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailAddress: e.target.value,
                    }))
                  }
                  placeholder="Enter your email address"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked: boolean) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked: boolean) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        pushNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Trade Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for executed trades
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.tradeAlerts}
                    onCheckedChange={(checked: boolean) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        tradeAlerts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Risk Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for risk limit breaches
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.riskAlerts}
                    onCheckedChange={(checked: boolean) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        riskAlerts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for system events
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked: boolean) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        systemAlerts: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Settings Tab */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                User Interface
              </CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={uiSettings.theme}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={uiSettings.language}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={uiSettings.timezone}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={uiSettings.currency}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={uiSettings.dateFormat}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({ ...prev, dateFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemsPerPage">Items per Page</Label>
                  <Select
                    value={uiSettings.itemsPerPage}
                    onValueChange={(value: string) =>
                      setUiSettings((prev) => ({
                        ...prev,
                        itemsPerPage: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save UI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        sessionTimeout: e.target.value,
                      }))
                    }
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={securitySettings.passwordExpiry}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        passwordExpiry: e.target.value,
                      }))
                    }
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={securitySettings.loginAttempts}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        loginAttempts: e.target.value,
                      }))
                    }
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked: boolean) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        twoFactorAuth: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options for power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These settings are for advanced users. Incorrect configuration
                  may affect system performance.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-webhook-url.com"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive real-time notifications via webhook
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Select defaultValue="info">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customConfig">Custom Configuration</Label>
                  <Textarea
                    id="customConfig"
                    placeholder="Enter custom JSON configuration..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Advanced users can override default settings with custom
                    JSON
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Export Settings</Button>
                <Button>Save Advanced Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
