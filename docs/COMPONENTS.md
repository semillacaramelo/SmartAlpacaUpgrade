# Smart Alpaca Upgrade Component Documentation

## Overview

This document provides detailed information about the React components used in the Smart Alpaca Upgrade trading dashboard. All components are built with TypeScript, Tailwind CSS, and Radix UI primitives for accessibility and consistency.

## Core Components

### Dashboard Components

#### TradingChart

**File:** `client/src/components/dashboard/trading-chart.tsx`

A comprehensive portfolio performance visualization component with real-time data display and AI trade markers.

**Props:**
```typescript
interface TradingChartProps {
  className?: string;
  portfolioValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  'data-testid'?: string;
}
```

**Features:**
- Interactive timeframe selection (1D, 1W, 1M, 1Y)
- Real-time portfolio value display
- SVG-based chart with gradient fill
- AI trade signal markers (buy/sell indicators)
- Responsive design with grid overlay
- Test IDs for automated testing

**Usage:**
```tsx
<TradingChart
  portfolioValue={105000.50}
  dayPnL={1250.75}
  dayPnLPercent={1.21}
  data-testid="trading-chart"
/>
```

**Styling:**
- Uses Tailwind CSS for responsive layout
- Custom SVG gradients for visual appeal
- Animated trade markers with pulse effects
- Color-coded P&L indicators

#### AIPipeline

**File:** `client/src/components/dashboard/ai-pipeline.tsx`

Visual representation of the 6-stage AI decision pipeline with real-time status updates.

**Props:**
```typescript
interface AIPipelineProps {
  className?: string;
  botStatus: string;
  'data-testid'?: string;
}
```

**Pipeline Stages:**
1. **Market Scan** - AI analyzes current market conditions
2. **Asset Selection** - Selects optimal assets for trading
3. **Strategy Generation** - Creates trading strategies using AI
4. **Risk Validation** - Validates strategies through backtesting
5. **Trade Staging** - Prepares strategies for execution
6. **Execution** - Monitors and executes trades automatically

**Features:**
- Real-time stage progression simulation
- Status indicators (completed, active, pending, failed)
- Next cycle countdown timer
- FontAwesome icons for visual clarity
- Color-coded status system

**Status Colors:**
- **Completed**: Green with checkmark
- **Active**: Blue with brain icon and pulse animation
- **Pending**: Gray with clock icon
- **Failed**: Red with X mark

#### MetricCard

**File:** `client/src/components/dashboard/metric-card.tsx`

A standardized card component for displaying key trading metrics and KPIs.

**Props:**
```typescript
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  className?: string;
  isPositive?: boolean;
  'data-testid'?: string;
}
```

**Available Icons:**
- `wallet` - Portfolio value
- `chart-line` - P&L metrics
- `list` - Position counts
- `bullseye` - Performance metrics

**Features:**
- Consistent design language
- Color-coded positive/negative indicators
- FontAwesome icon integration
- Test-friendly with data attributes

**Usage:**
```tsx
<MetricCard
  title="Portfolio Value"
  value="$105,000.50"
  change={1.21}
  changeLabel="+1.21% vs yesterday"
  icon="wallet"
  isPositive={true}
  data-testid="metric-portfolio-value"
/>
```

#### ActivePositions

**File:** `client/src/components/dashboard/active-positions.tsx`

Displays a table of all currently open trading positions with real-time P&L updates.

**Props:**
```typescript
interface ActivePositionsProps {
  className?: string;
  positions: Position[];
  'data-testid'?: string;
}
```

**Position Data Structure:**
```typescript
interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnL: string;
  isOpen: boolean;
  entryDate: string;
  strategyId?: string;
}
```

**Features:**
- Sortable table columns
- Real-time P&L calculations
- Color-coded profit/loss indicators
- Strategy attribution
- Responsive design for mobile devices

#### SystemHealth

**File:** `client/src/components/dashboard/system-health.tsx`

Monitors and displays the health status of various system services and integrations.

**Props:**
```typescript
interface SystemHealthProps {
  className?: string;
  systemHealth: SystemHealthMetric[];
  'data-testid'?: string;
}
```

**Health Metrics:**
```typescript
interface SystemHealthMetric {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  metrics: Record<string, any>;
  lastCheck: string;
}
```

**Services Monitored:**
- Database connectivity
- Alpaca API integration
- Google Gemini AI service
- WebSocket connections
- Background task processing

#### ActivityFeed

**File:** `client/src/components/dashboard/activity-feed.tsx`

Real-time activity feed showing trading events, AI decisions, and system notifications.

**Props:**
```typescript
interface ActivityFeedProps {
  className?: string;
  activities: AuditLog[];
  'data-testid'?: string;
}
```

**Activity Types:**
- Trade executions
- AI pipeline updates
- Strategy activations
- System alerts
- Error notifications

### Layout Components

#### Header

**File:** `client/src/components/layout/header.tsx`

Top navigation bar with system status indicators and user controls.

**Features:**
- WebSocket connection status
- Bot status indicator
- User profile dropdown
- Notification center
- Responsive mobile menu

#### Sidebar

**File:** `client/src/components/layout/sidebar.tsx`

Main navigation sidebar with menu items and quick actions.

**Navigation Items:**
- Dashboard
- Portfolio
- Strategies
- Backtesting
- Settings
- Reports

**Features:**
- Collapsible design
- Active route highlighting
- Quick action buttons
- Mobile-responsive

### UI Components

#### Button

**File:** `client/src/components/ui/button.tsx`

Customizable button component built on Radix UI primitives.

**Variants:**
- `default` - Primary action button
- `destructive` - Delete/danger actions
- `outline` - Secondary actions
- `ghost` - Minimal styling
- `link` - Text-only links

**Sizes:**
- `sm` - Small buttons
- `default` - Standard size
- `lg` - Large buttons

#### Card

**File:** `client/src/components/ui/card.tsx`

Container component for grouping related content.

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Portfolio Overview</CardTitle>
    <CardDescription>Current portfolio performance</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Table

**File:** `client/src/components/ui/table.tsx`

Accessible data table component with sorting and pagination support.

**Features:**
- Keyboard navigation
- Screen reader support
- Customizable columns
- Row selection
- Pagination controls

### Custom Hooks

#### useTradingData

**File:** `client/src/hooks/use-trading-data.tsx`

Central hook for managing all trading-related data fetching and caching.

**Returns:**
```typescript
{
  // Data
  portfolioStatus,
  positions,
  systemMetrics,
  auditLogs,
  strategies,
  marketData,

  // Loading states
  isLoading,
  portfolioLoading,
  positionsLoading,
  metricsLoading,
  auditLogsLoading,
  strategiesLoading,
  marketDataLoading,

  // Refetch functions
  refetchPortfolio,
  refetchPositions,
  refetchSystemMetrics,
  refetchAuditLogs,
  refetchStrategies,
  refetchMarketData,

  // Utility functions
  refetchAll
}
```

**Features:**
- React Query integration for caching
- Automatic refetch intervals
- Error handling and retry logic
- Loading state management

#### useWebSocket

**File:** `client/src/hooks/use-websocket.tsx`

WebSocket connection management with automatic reconnection.

**Features:**
- Connection state management
- Automatic reconnection with exponential backoff
- Message parsing and type safety
- Ping/pong heartbeat monitoring
- Error handling and recovery

#### useMobile

**File:** `client/src/hooks/use-mobile.tsx`

Responsive breakpoint detection for mobile devices.

**Usage:**
```tsx
const isMobile = useMobile();
return (
  <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
    {/* Content */}
  </div>
);
```

### Utility Functions

#### cn (Class Name Utility)

**File:** `client/src/lib/utils.ts`

Combines Tailwind CSS classes with clsx and tailwind-merge for optimal styling.

**Usage:**
```typescript
import { cn } from "@/lib/utils";

const buttonClasses = cn(
  "px-4 py-2 rounded-md",
  variant === "primary" && "bg-blue-500 text-white",
  disabled && "opacity-50 cursor-not-allowed"
);
```

#### Query Client Configuration

**File:** `client/src/lib/queryClient.ts`

React Query client configuration with optimized settings for trading data.

**Features:**
- Custom stale time for different data types
- Background refetching
- Error retry logic
- Cache management

## Styling Guidelines

### Color Scheme
- **Primary**: Blue tones for active elements
- **Success**: Green for positive metrics
- **Destructive**: Red for negative metrics
- **Muted**: Gray tones for secondary content

### Typography
- **Headings**: Font-semibold with appropriate sizes
- **Body**: Regular weight with good contrast
- **Data**: Monospace for numbers and codes

### Spacing
- **Component padding**: 6 units (1.5rem)
- **Element spacing**: 4 units (1rem)
- **Grid gaps**: 6 units (1.5rem)

### Responsive Design
- **Mobile-first approach**
- **Breakpoint system**: sm, md, lg, xl
- **Flexible layouts** with CSS Grid and Flexbox

## Testing

### Test IDs
All components include `data-testid` attributes for reliable testing:

```tsx
<div data-testid="trading-chart">
  {/* Component content */}
</div>
```

### Component Testing
- Unit tests for individual components
- Integration tests for component interactions
- Visual regression testing
- Accessibility testing with axe-core

## Performance Considerations

### Optimization Techniques
- **React.memo** for expensive re-renders
- **useMemo** for computed values
- **useCallback** for event handlers
- **Lazy loading** for heavy components

### Bundle Splitting
- **Route-based code splitting**
- **Component lazy loading**
- **Vendor chunk separation**

## Accessibility

### ARIA Support
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Color Contrast
- WCAG AA compliance
- High contrast mode support
- Color-blind friendly palettes

## Future Enhancements

### Planned Components
- **Advanced Charting**: Integration with TradingView or similar
- **Strategy Builder**: Visual strategy creation interface
- **Risk Management**: Advanced position sizing tools
- **Reporting**: Comprehensive performance reports

### Performance Improvements
- **Virtual scrolling** for large data sets
- **Web Workers** for heavy calculations
- **Service Worker** for offline functionality
- **PWA features** for mobile app experience
