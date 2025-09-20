import { Router } from 'express';
import { db } from '../db.js';
import { portfolios } from '@shared/schema.js';

const router = Router();

// Basic API status
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Smart Alpaca Upgrade',
    version: '1.0.0'
  });
});

// Get user portfolios
router.get('/portfolios', async (req, res) => {
  try {
    const userPortfolios = await db.select().from(portfolios);
    res.json({ success: true, data: userPortfolios });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch portfolios' 
    });
  }
});

// Get trading metrics
router.get('/metrics', async (req, res) => {
  try {
    // Return basic mock metrics for now
    const metrics = {
      totalPortfolioValue: 100000,
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      positions: 0,
      availableCash: 100000,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch metrics' 
    });
  }
});

// AI Pipeline trigger endpoint
router.post('/ai/trigger-pipeline', async (req, res) => {
  try {
    // Basic response for now
    res.json({
      success: true,
      message: 'AI pipeline trigger received',
      correlationId: `ai_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering AI pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger AI pipeline' 
    });
  }
});

export default router;