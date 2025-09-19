# Smart Alpaca Upgrade - GitHub Copilot Instructions

## Project Status: Development Phase (90% Complete)

**Current Focus**: Test infrastructure stabilization and final error handling improvements.
See `REMAINING_TASKS.md` for task tracking. Major components implemented: error handling, monitoring, testing framework.
**Next Priority**: Fix test configuration issues and complete comprehensive test coverage.

## Project Architecture

This is an AI-powered algorithmic trading platform with a full-stack TypeScript architecture:

- **Frontend**: React 18 + Vite (client/) with Wouter routing, React Query, and Radix UI components
- **Backend**: Express.js server with WebSocket (server/) for real-time updates
- **Database**: PostgreSQL with Drizzle ORM (shared/schema.ts)
- **AI Pipeline**: BullMQ job queue system with separate worker process
- **Shared**: Common types and schemas (shared/)

## Critical Workflows

### Development Setup

```bash
# Start services (PostgreSQL + Redis)
npm run start-services  # or: ./scripts/start-services.sh

# Development with hot reload
npm run dev              # Main server (port 5000)
npm run dev:worker       # AI pipeline worker

# Database operations
npm run db:push          # Apply schema changes
```

### AI Pipeline Architecture

The core trading logic runs through a **6-stage BullMQ pipeline**:

1. **Market Scan** → 2. **Asset Selection** → 3. **Strategy Generation** → 4. **Validation** → 5. **Staging** → 6. **Execution**

- Each stage is a separate queue job in `server/worker.ts`
- Pipeline state tracked via Redis with correlation IDs
- Real-time updates broadcast via WebSocket (`server/services/websocket.ts`)
- Start pipeline: `POST /api/ai/trigger-pipeline`

### Backtesting Engine Workflow

The backtesting system (`server/services/trading.ts`) provides high-fidelity portfolio simulation:

```typescript
// Backtest execution pattern
const backtestResult = await tradingService.runBacktest({
  symbols: ["AAPL", "GOOGL"],
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  strategy: strategyConfig,
  initialCapital: 100000,
});
// Returns: totalReturn, sharpeRatio, maxDrawdown, winRate, totalTrades
```

- **Historical data**: Fetched via Alpaca API with 1-minute bars
- **Position tracking**: Full lifecycle from entry to exit with P&L calculation
- **Risk metrics**: Sharpe ratio, max drawdown, win rate analysis
- **Portfolio simulation**: Realistic order execution with slippage modeling

### Database Patterns

- All tables use UUID primary keys with `gen_random_uuid()`
- **Critical tables**: `users`, `portfolios`, `positions`, `trades`, `strategies`, `ai_decisions`, `audit_logs`
- Correlation IDs link trades to AI decisions across tables
- Use Drizzle queries, not raw SQL: `storage.db.select().from(positions)`

## Key Service Boundaries

### Trading Services (`server/services/`)

- **`alpaca.ts`**: External API integration (paper/live trading)
- **`trading.ts`**: Core trading logic, backtesting engine
- **`gemini.ts`**: AI strategy generation via Google Gemini
- **`portfolio.ts`**: Portfolio management and P&L calculations
- **`websocket.ts`**: Real-time data broadcasting

### Frontend Components (`client/src/components/`)

- **`dashboard/`**: Main trading dashboard widgets
- **`ui/`**: Radix-based design system components
- **`layout/`**: App shell and navigation

## Project-Specific Conventions

### File Organization

- **Absolute imports**: Use `@/` for client, `@shared` for shared types
- **Service pattern**: Each major feature has dedicated service file
- **Component co-location**: Related components grouped in feature directories

### Data Flow

- **Real-time updates**: WebSocket broadcasts on port 5000/ws
- **API structure**: RESTful with `/api` prefix, WebSocket for live data
- **State management**: React Query for server state, local state for UI

### Testing Strategy

- **Unit tests**: `tests/unit/` for service logic
- **Integration tests**: `tests/integration/` for workflow testing
- **E2E tests**: `e2e/` with Playwright for full user journeys
- **Error state coverage**: Focus on network failures, API timeouts, invalid inputs
- **WebSocket testing**: Use `tests/utils/websocket-test-utils.ts` for real-time data testing

### Error Handling Workflows

Current development focus on comprehensive error coverage:

```typescript
// API error handling pattern
try {
  const result = await apiCall();
} catch (error) {
  await logAuditEvent(correlationId, "api_error", { error: error.message });
  wsManager.broadcastSystemError(error, correlationId);
  throw new APIError(error.message, error.status);
}
```

- **Correlation tracking**: All errors linked via UUID correlation IDs
- **Toast notifications**: User-facing error display via `use-error-toast.ts`
- **Error boundaries**: React error boundaries in `client/src/components/error-boundary.tsx`
- **Retry logic**: Configurable retry strategies in `client/src/lib/retry-strategy.ts`

### Environment Configuration

- **Paper trading**: Default mode (ALPACA_BASE_URL=paper-api.alpaca.markets)
- **Database**: PostgreSQL required (`DATABASE_URL`)
- **Redis**: Required for BullMQ job processing
- **AI**: Google Gemini API key for strategy generation

## Common Patterns

### Error Handling

Use correlation IDs for tracing across services:

```typescript
const correlationId = uuidv4();
await logAuditEvent(correlationId, "trade_executed", tradeData);
```

### WebSocket Updates

Broadcast real-time events:

```typescript
wsManager.broadcastPortfolioUpdate(portfolioData);
wsManager.broadcastAIPipelineUpdate(stage, status, data, correlationId);
```

### Database Transactions

Use Drizzle transactions for complex operations:

```typescript
await storage.db.transaction(async (tx) => {
  await tx.insert(trades).values(tradeData);
  await tx.update(positions).set(positionUpdate);
});
```

## Integration Points

- **Alpaca API**: Live market data and trade execution
- **Google Gemini**: AI-powered strategy generation
- **Redis**: Job queue and real-time event broadcasting
- **PostgreSQL**: Persistent data storage with audit trails

## Development & Deployment Patterns

### Development Workflow

```bash
# Check development status
npm run check                    # TypeScript validation
npm test                        # Run all tests
npm run test:integration        # Integration tests only
npm run test:unit              # Unit tests only

# Development services (requires PostgreSQL + Redis running)
npm run dev                     # Main server (localhost:5000)
npm run dev:worker             # AI pipeline worker process
```

### Current Development Phase (90% Complete)

**Active work**: Test infrastructure stabilization, configuration fixes, final testing

- See `REMAINING_TASKS.md` for progress tracking
- Recent completion: Error handling system, monitoring dashboard, performance metrics
- Current issues: Jest configuration needs fixing, some test dependencies missing
- Focus areas: Test configuration, module resolution, TypeScript compatibility

### Production Deployment

```bash
npm run deploy:phase-a          # Production deployment script
npm run deploy:check           # Pre-deployment validation
```

- **Paper trading default**: All trading operations use Alpaca paper API
- **Environment isolation**: Separate configs for dev/staging/production
- **Service dependencies**: PostgreSQL, Redis, external APIs (Alpaca, Gemini)

When modifying trading logic, always consider the correlation between AI decisions, trade execution, and audit logging for regulatory compliance.
