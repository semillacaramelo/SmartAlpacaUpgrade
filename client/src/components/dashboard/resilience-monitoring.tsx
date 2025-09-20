import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  totalRequests: number;
  totalFailures: number;
  uptime: number;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  errorRate: number;
  consecutiveFailures: number;
  lastSuccess?: string;
  lastFailure?: string;
  uptime: number;
}

interface DeadLetterItem {
  id: string;
  operationName: string;
  payload: any;
  originalError: any;
  attempts: number;
  timestamp: string;
  scheduledRetry?: string;
}

interface AlertEvent {
  serviceName: string;
  alertType: 'high_error_rate' | 'slow_response' | 'consecutive_failures' | 'service_down';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export default function ResilienceMonitoring() {
  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, CircuitBreakerStats>>({});
  const [serviceHealth, setServiceHealth] = useState<Record<string, { status: ServiceHealth; metrics: PerformanceMetrics }>>({});
  const [deadLetterQueue, setDeadLetterQueue] = useState<{ items: DeadLetterItem[]; stats: any }>({ items: [], stats: {} });
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all monitoring data in parallel
      const [cbResponse, healthResponse, dlqResponse, alertsResponse] = await Promise.all([
        fetch('/api/monitoring/circuit-breakers'),
        fetch('/api/monitoring/health'),
        fetch('/api/monitoring/dead-letter-queue'),
        fetch('/api/monitoring/health/alerts?limit=20')
      ]);

      if (cbResponse.ok) {
        const cbData = await cbResponse.json();
        setCircuitBreakers(cbData.data);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setServiceHealth(healthData.data.services);
        setSystemHealth(healthData.data.systemHealth);
      }

      if (dlqResponse.ok) {
        const dlqData = await dlqResponse.json();
        setDeadLetterQueue(dlqData.data);
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const resetCircuitBreakers = async () => {
    try {
      const response = await fetch('/api/monitoring/circuit-breakers/reset', {
        method: 'POST'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reset circuit breakers:', error);
    }
  };

  const clearDeadLetterQueue = async () => {
    try {
      const response = await fetch('/api/monitoring/dead-letter-queue/clear', {
        method: 'POST'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to clear dead letter queue:', error);
    }
  };

  const clearAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/health/alerts/clear', {
        method: 'POST'
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'HALF_OPEN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'OPEN':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      case 'degraded':
      case 'HALF_OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Resilience Monitoring</h1>
          <p className="text-gray-600">Monitor circuit breakers, service health, and system resilience</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemHealth.summary?.healthyServices || 0}</div>
              <div className="text-sm text-gray-500">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{systemHealth.summary?.degradedServices || 0}</div>
              <div className="text-sm text-gray-500">Degraded Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{systemHealth.summary?.unhealthyServices || 0}</div>
              <div className="text-sm text-gray-500">Unhealthy Services</div>
            </div>
            <div className="text-center">
              <Badge className={getStatusColor(systemHealth.overall || 'unknown')}>
                {getStatusIcon(systemHealth.overall || 'unknown')}
                <span className="ml-1">{systemHealth.overall || 'Unknown'}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="circuit-breakers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="service-health">Service Health</TabsTrigger>
          <TabsTrigger value="dead-letter-queue">Failed Operations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="circuit-breakers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Circuit Breaker Status</h2>
            <Button onClick={resetCircuitBreakers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
          
          <div className="grid gap-4">
            {Object.entries(circuitBreakers).map(([service, stats]) => (
              <Card key={service}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{service}</CardTitle>
                    <Badge className={getStatusColor(stats.state)}>
                      {getStatusIcon(stats.state)}
                      <span className="ml-1">{stats.state}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Requests</div>
                      <div className="text-2xl font-bold">{stats.totalRequests}</div>
                    </div>
                    <div>
                      <div className="font-medium">Success Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.totalRequests > 0 ? (((stats.totalRequests - stats.totalFailures) / stats.totalRequests) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Failures</div>
                      <div className="text-2xl font-bold text-red-600">{stats.totalFailures}</div>
                    </div>
                    <div>
                      <div className="font-medium">Uptime</div>
                      <div className="text-lg font-bold">{formatUptime(stats.uptime)}</div>
                    </div>
                  </div>
                  
                  {stats.lastFailureTime && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-500">
                        Last failure: {new Date(stats.lastFailureTime).toLocaleString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="service-health" className="space-y-4">
          <h2 className="text-xl font-semibold">Service Health Monitoring</h2>
          
          <div className="grid gap-4">
            {Object.entries(serviceHealth).map(([service, data]) => (
              <Card key={service}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{service}</CardTitle>
                    <Badge className={getStatusColor(data.status.status)}>
                      {getStatusIcon(data.status.status)}
                      <span className="ml-1">{data.status.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Response Time</div>
                      <div className="text-xl font-bold">{data.status.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Avg Response Time</div>
                      <div className="text-xl font-bold">{data.metrics.averageResponseTime.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Error Rate</div>
                      <div className="text-xl font-bold text-red-600">{data.metrics.errorRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Consecutive Failures</div>
                      <div className="text-xl font-bold">{data.metrics.consecutiveFailures}</div>
                    </div>
                  </div>
                  
                  {data.status.error && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{data.status.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dead-letter-queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Failed Operations ({deadLetterQueue.items.length})</h2>
            <Button onClick={clearDeadLetterQueue} variant="outline" size="sm" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          </div>
          
          {deadLetterQueue.items.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No failed operations in the dead letter queue
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {deadLetterQueue.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.operationName}</div>
                        <div className="text-sm text-gray-500">
                          Failed after {item.attempts} attempts • {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="destructive">{item.attempts} failures</Badge>
                    </div>
                    
                    {item.originalError && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        {typeof item.originalError === 'string' ? item.originalError : JSON.stringify(item.originalError)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Alerts ({alerts.length})</h2>
            <Button onClick={clearAlerts} variant="outline" size="sm" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Alerts
            </Button>
          </div>
          
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No recent alerts
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {alert.severity === 'critical' ? <XCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                            {alert.severity}
                          </Badge>
                          <span className="font-medium capitalize">{alert.serviceName}</span>
                          <span className="text-sm text-gray-500">{alert.alertType.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 text-sm">{alert.message}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}