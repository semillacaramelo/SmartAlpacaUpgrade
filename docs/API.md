# Smart Alpaca Upgrade API Documentation

## Overview

The Smart Alpaca Upgrade API provides comprehensive endpoints for algorithmic trading, portfolio management, AI-driven strategy generation, and real-time market data. The API is built with Express.js and uses WebSocket for real-time updates.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently uses demo user authentication. In production, implement proper JWT or session-based authentication.

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

## Endpoints

### Health & System

#### GET /health
Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-16T21:16:00.000Z",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "lastCheck": "2025-09-16T21:16:00.000Z"
    }
  ]
}
```

#### GET /system/metrics
Get comprehensive system metrics.

**Response:**
```json
{
  "active_cycles": 2,
  "staged_strategies": 5,
  "bot_status": "running",
  "last_activity": "2025-09-16T21:16:00.000Z",
  "system_health": [...],
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

### Portfolio Management

#### GET /portfolio/status
Get portfolio overview and key metrics.

**Response:**
```json
{
  "portfolioValue": 105000.50,
  "dayPnL": 1250.75,
  "dayPnLPercent": 1.21,
  "activePositions": 3,
  "winRate": 68.5,
  "cashBalance": 25000.00,
  "totalPnL": 5000.50,
  "open_positions": 3,
  "positions": [...]
}
```

#### GET /positions/open
Get all open positions for the current portfolio.

**Response:**
```json
[
  {
    "id": "pos_123",
    "symbol": "AAPL",
    "quantity": 100,
    "entryPrice": "150.25",
    "currentPrice": "152.10",
    "marketValue": "15210.00",
    "unrealizedPnL": "185.00",
    "isOpen": true,
    "entryDate": "2025-09-15T10:30:00.000Z",
    "strategyId": "strat_456"
  }
]
```

### Trading Operations

#### POST /trade/execute
Execute a trade order.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "quantity": 100,
  "side": "buy",
  "type": "market",
  "price": 150.25,
  "correlationId": "corr_123",
  "strategyName": "AI_Generated_Strategy_1",
  "aiReasoning": "Strong bullish signal with RSI divergence"
}
```

**Response:**
```json
{
  "orderId": "order_789",
  "status": "filled",
  "executedPrice": 150.25,
  "executedQuantity": 100,
  "executedAt": "2025-09-16T21:16:00.000Z"
}
```

#### POST /backtest/run
Run a backtest for a trading strategy.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "entryRules": "RSI < 30 AND MACD crossover",
  "exitRules": "RSI > 70 OR stop loss 2%",
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-09-16T00:00:00.000Z"
}
```

**Response:**
```json
{
  "totalReturn": 0.156,
  "sharpeRatio": 1.23,
  "maxDrawdown": 0.085,
  "winRate": 0.67,
  "totalTrades": 45,
  "profitableTrades": 30,
  "averageReturn": 0.034
}
```

### AI Pipeline Control

#### POST /bot/start
Start the AI trading cycle.

**Response:**
```json
{
  "success": true,
  "correlationId": "corr_123",
  "message": "AI trading cycle started"
}
```

#### POST /bot/stop
Stop the AI trading cycle.

**Response:**
```json
{
  "success": true,
  "status": "stopped",
  "message": "AI trading cycle stopped"
}
```

#### GET /bot/status
Get current bot status.

**Response:**
```json
{
  "status": "running"
}
```

### Strategy Management

#### GET /strategies
Get all trading strategies.

**Query Parameters:**
- `status` (optional): Filter by status (`staged`, `active`, `completed`, `failed`)

**Response:**
```json
[
  {
    "id": "strat_123",
    "name": "Momentum Strategy AAPL",
    "symbol": "AAPL",
    "entryRules": "RSI < 30 AND volume > average_volume * 1.5",
    "exitRules": "RSI > 70 OR trailing stop 5%",
    "riskParameters": {
      "maxPositionSize": 0.1,
      "stopLoss": 0.05,
      "takeProfit": 0.15
    },
    "confidence": "0.85",
    "status": "staged",
    "createdAt": "2025-09-16T20:00:00.000Z",
    "correlationId": "corr_123"
  }
]
```

#### GET /ai-decisions/:correlationId
Get AI decisions for a specific correlation ID.

**Response:**
```json
[
  {
    "id": "decision_123",
    "correlationId": "corr_123",
    "stage": "market_scan",
    "input": { ... },
    "output": {
      "trend": "bullish",
      "volatility": "moderate",
      "keyFactors": ["earnings", "fed_policy"],
      "confidence": 0.82
    },
    "confidence": "0.82",
    "status": "success",
    "createdAt": "2025-09-16T20:00:00.000Z"
  }
]
```

### Data & Analytics

#### GET /audit-logs
Get system audit logs.

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 100)

**Response:**
```json
[
  {
    "id": "log_123",
    "correlationId": "corr_123",
    "eventType": "ORDER_EXECUTED",
    "eventData": {
      "orderId": "order_789",
      "symbol": "AAPL",
      "quantity": 100
    },
    "source": "trading_service",
    "level": "info",
    "timestamp": "2025-09-16T21:16:00.000Z"
  }
]
```

#### GET /market-data
Get current market data.

**Query Parameters:**
- `symbols` (optional): Comma-separated list of symbols (default: AAPL,GOOGL,MSFT)

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "price": 152.10,
    "volume": 45230000,
    "change": 1.85,
    "changePercent": 1.23,
    "high": 153.50,
    "low": 150.25,
    "open": 150.75,
    "previousClose": 150.25
  }
]
```

### User Management

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "username": "trader123",
  "password": "secure_password",
  "email": "trader@example.com"
}
```

**Response:**
```json
{
  "id": "user_123",
  "username": "trader123",
  "email": "trader@example.com",
  "createdAt": "2025-09-16T21:16:00.000Z"
}
```

## WebSocket Events

The API uses WebSocket for real-time updates. Connect to `/ws` endpoint.

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
```

### Incoming Events

#### Portfolio Updates
```json
{
  "type": "portfolio_update",
  "data": {
    "portfolioValue": 105250.75,
    "dayPnL": 1250.75,
    "dayPnLPercent": 1.21
  },
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

#### Position Updates
```json
{
  "type": "position_update",
  "data": {
    "symbol": "AAPL",
    "quantity": 100,
    "currentPrice": 152.10,
    "unrealizedPnL": 185.00
  },
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

#### Trade Execution
```json
{
  "type": "trade_executed",
  "data": {
    "orderId": "order_789",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 100,
    "price": 152.10,
    "strategy": "AI_Generated_Strategy_1"
  },
  "correlationId": "corr_123",
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

#### AI Pipeline Updates
```json
{
  "type": "ai_pipeline_update",
  "stage": "strategy_generation",
  "status": "completed",
  "data": {
    "strategiesGenerated": 3,
    "confidence": 0.85
  },
  "correlationId": "corr_123",
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

#### System Events
```json
{
  "type": "system_event",
  "event": "BOT_STARTED",
  "data": {
    "correlationId": "corr_123",
    "status": "running"
  },
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

### Outgoing Messages

#### Ping/Pong
```json
{
  "type": "ping"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-09-16T21:16:00.000Z"
}
```

## Rate Limiting

- API endpoints are rate limited to prevent abuse
- WebSocket connections have connection limits
- Implement exponential backoff for failed requests

## Data Types

### MarketData
```typescript
interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}
```

### OrderRequest
```typescript
interface OrderRequest {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price?: number;
  correlationId?: string;
  strategyName?: string;
  aiReasoning?: string;
}
```

### BacktestResult
```typescript
interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
}
```

## Best Practices

1. **Error Handling**: Always check response status and handle errors gracefully
2. **WebSocket Management**: Implement reconnection logic for WebSocket connections
3. **Rate Limiting**: Respect API rate limits and implement backoff strategies
4. **Data Validation**: Validate all input data using the provided schemas
5. **Logging**: Use correlation IDs for tracking requests across services
6. **Security**: Never expose API keys in client-side code

## Testing

Use the included demo user for testing:
- Username: `demo-user`
- Portfolio is automatically created with $100,000 starting balance

## Support

For API issues or questions:
- Check the audit logs endpoint for detailed error information
- Review WebSocket events for real-time debugging
- Use correlation IDs to trace requests through the system
