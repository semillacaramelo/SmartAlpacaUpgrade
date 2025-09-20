/**
 * API routes for system monitoring and resilience patterns
 */

import { Router } from 'express';
import { circuitBreakerManager } from '../services/circuit-breaker';
import { retryService } from '../services/retry';
import { apiHealthMonitor } from '../services/health-monitor';

const router = Router();

/**
 * Circuit Breaker endpoints
 */

// Get all circuit breaker stats
router.get('/circuit-breakers', (req, res) => {
  try {
    const stats = circuitBreakerManager.getAllStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system health based on circuit breakers
router.get('/circuit-breakers/health', (req, res) => {
  try {
    const health = circuitBreakerManager.getSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset all circuit breakers
router.post('/circuit-breakers/reset', (req, res) => {
  try {
    circuitBreakerManager.resetAll();
    res.json({
      success: true,
      message: 'All circuit breakers have been reset'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Dead Letter Queue endpoints
 */

// Get dead letter queue items
router.get('/dead-letter-queue', (req, res) => {
  try {
    const dlq = retryService.getDeadLetterQueue();
    const items = dlq.getItems();
    const stats = dlq.getStats();
    
    res.json({
      success: true,
      data: {
        items,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Remove item from dead letter queue
router.delete('/dead-letter-queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dlq = retryService.getDeadLetterQueue();
    const removed = dlq.removeItem(id);
    
    if (removed) {
      res.json({
        success: true,
        message: `Item ${id} removed from dead letter queue`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Item ${id} not found in dead letter queue`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear dead letter queue
router.post('/dead-letter-queue/clear', (req, res) => {
  try {
    const dlq = retryService.getDeadLetterQueue();
    dlq.clear();
    
    res.json({
      success: true,
      message: 'Dead letter queue cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health Monitoring endpoints
 */

// Get all service health statuses
router.get('/health', (req, res) => {
  try {
    const statuses = apiHealthMonitor.getAllStatuses();
    const systemHealth = apiHealthMonitor.getSystemHealth();
    
    res.json({
      success: true,
      data: {
        systemHealth,
        services: statuses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get system health summary
router.get('/health/summary', (req, res) => {
  try {
    const systemHealth = apiHealthMonitor.getSystemHealth();
    
    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent alerts
router.get('/health/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = apiHealthMonitor.getRecentAlerts(limit);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear alert history
router.post('/health/alerts/clear', (req, res) => {
  try {
    apiHealthMonitor.clearAlertHistory();
    
    res.json({
      success: true,
      message: 'Alert history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * System metrics endpoint (combined view)
 */
router.get('/system/metrics', (req, res) => {
  try {
    const circuitBreakerStats = circuitBreakerManager.getAllStats();
    const circuitBreakerHealth = circuitBreakerManager.getSystemHealth();
    const dlq = retryService.getDeadLetterQueue();
    const dlqStats = dlq.getStats();
    const healthStatuses = apiHealthMonitor.getAllStatuses();
    const systemHealth = apiHealthMonitor.getSystemHealth();
    const recentAlerts = apiHealthMonitor.getRecentAlerts(10);
    
    res.json({
      success: true,
      data: {
        timestamp: new Date(),
        circuitBreakers: {
          stats: circuitBreakerStats,
          health: circuitBreakerHealth
        },
        deadLetterQueue: dlqStats,
        serviceHealth: {
          summary: systemHealth,
          services: healthStatuses
        },
        recentAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;