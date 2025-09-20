import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, Settings, TrendingDown, Activity } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RiskSettings {
    maxPositionSize: number;
    stopLossThreshold: number;
    portfolioExposureLimit: number;
    riskPerTrade: number;
    enableAutoStopLoss: boolean;
}

interface RiskMetrics {
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    winRate: number;
    currentExposure: number;
    portfolioVar: number; // Value at Risk
}

export default function RiskManagement() {
    const [riskSettings, setRiskSettings] = useState<RiskSettings>({
        maxPositionSize: 10,
        stopLossThreshold: 5,
        portfolioExposureLimit: 80,
        riskPerTrade: 2,
        enableAutoStopLoss: true,
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch current risk metrics
    const { data: riskMetrics, isLoading: metricsLoading } = useQuery<RiskMetrics>({
        queryKey: ["risk-metrics"],
        queryFn: async () => {
            const response = await fetch("/api/risk/metrics");
            if (!response.ok) throw new Error("Failed to fetch risk metrics");
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch current risk settings
    const { data: currentSettings, isLoading: settingsLoading } = useQuery<RiskSettings>({
        queryKey: ["risk-settings"],
        queryFn: async () => {
            const response = await fetch("/api/risk/settings");
            if (!response.ok) throw new Error("Failed to fetch risk settings");
            return response.json();
        },
    });

    // Update risk settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (settings: RiskSettings) => {
            const response = await fetch("/api/risk/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!response.ok) throw new Error("Failed to update risk settings");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["risk-settings"] });
            toast({
                title: "Risk Settings Updated",
                description: "Your risk management settings have been saved.",
            });
        },
        onError: (error) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Emergency stop all positions mutation
    const emergencyStopMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/risk/emergency-stop", {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to execute emergency stop");
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Emergency Stop Executed",
                description: "All open positions have been closed.",
                variant: "destructive",
            });
        },
    });

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate(riskSettings);
    };

    const handleEmergencyStop = () => {
        if (confirm("Are you sure you want to close all positions? This action cannot be undone.")) {
            emergencyStopMutation.mutate();
        }
    };

    const getRiskLevel = (metrics: RiskMetrics | undefined) => {
        if (!metrics) return { level: "Unknown", color: "text-muted-foreground" };

        if (metrics.currentExposure > 70 || metrics.maxDrawdown > 15) {
            return { level: "High", color: "text-red-500" };
        } else if (metrics.currentExposure > 50 || metrics.maxDrawdown > 10) {
            return { level: "Medium", color: "text-yellow-500" };
        } else {
            return { level: "Low", color: "text-green-500" };
        }
    };

    const riskLevel = getRiskLevel(riskMetrics);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Risk Management</h1>
                </div>
                <Button
                    onClick={handleEmergencyStop}
                    variant="destructive"
                    disabled={emergencyStopMutation.isPending}
                    className="flex items-center space-x-2"
                >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Emergency Stop</span>
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${riskLevel.color}`}>
                                    {riskLevel.level}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Overall portfolio risk
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Exposure</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {riskMetrics?.currentExposure?.toFixed(1) || "0.0"}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Portfolio exposure
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {riskMetrics?.maxDrawdown?.toFixed(2) || "0.00"}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Maximum loss from peak
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {riskMetrics?.sharpeRatio?.toFixed(2) || "0.00"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Risk-adjusted return
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Settings className="h-5 w-5" />
                                <span>Risk Parameters</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="maxPositionSize">Max Position Size (%)</Label>
                                    <Input
                                        id="maxPositionSize"
                                        type="number"
                                        value={riskSettings.maxPositionSize}
                                        onChange={(e) =>
                                            setRiskSettings({
                                                ...riskSettings,
                                                maxPositionSize: Number(e.target.value),
                                            })
                                        }
                                        min="1"
                                        max="50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="stopLossThreshold">Stop Loss Threshold (%)</Label>
                                    <Input
                                        id="stopLossThreshold"
                                        type="number"
                                        value={riskSettings.stopLossThreshold}
                                        onChange={(e) =>
                                            setRiskSettings({
                                                ...riskSettings,
                                                stopLossThreshold: Number(e.target.value),
                                            })
                                        }
                                        min="1"
                                        max="20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="portfolioExposureLimit">Portfolio Exposure Limit (%)</Label>
                                    <Input
                                        id="portfolioExposureLimit"
                                        type="number"
                                        value={riskSettings.portfolioExposureLimit}
                                        onChange={(e) =>
                                            setRiskSettings({
                                                ...riskSettings,
                                                portfolioExposureLimit: Number(e.target.value),
                                            })
                                        }
                                        min="10"
                                        max="100"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
                                    <Input
                                        id="riskPerTrade"
                                        type="number"
                                        value={riskSettings.riskPerTrade}
                                        onChange={(e) =>
                                            setRiskSettings({
                                                ...riskSettings,
                                                riskPerTrade: Number(e.target.value),
                                            })
                                        }
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveSettings}
                                disabled={updateSettingsMutation.isPending}
                                className="w-full"
                            >
                                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Risk Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {metricsLoading ? (
                                <div className="text-center py-8">Loading metrics...</div>
                            ) : riskMetrics ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span>Volatility:</span>
                                            <span className="font-mono">{riskMetrics.volatility?.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Win Rate:</span>
                                            <span className="font-mono">{riskMetrics.winRate?.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Value at Risk (VaR):</span>
                                            <span className="font-mono">{riskMetrics.portfolioVar?.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span>Sharpe Ratio:</span>
                                            <span className="font-mono">{riskMetrics.sharpeRatio?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Max Drawdown:</span>
                                            <span className="font-mono">{riskMetrics.maxDrawdown?.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Current Exposure:</span>
                                            <span className="font-mono">{riskMetrics.currentExposure?.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No risk metrics available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}