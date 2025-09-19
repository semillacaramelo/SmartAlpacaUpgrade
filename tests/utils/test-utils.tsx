import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }
  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock data generators
export const generateMockPosition = (overrides = {}) => ({
  symbol: 'AAPL',
  qty: 100,
  avg_entry_price: 150.00,
  current_price: 155.00,
  market_value: 15500.00,
  unrealized_pl: 500.00,
  unrealized_plpc: 0.0333,
  ...overrides,
});

export const generateMockPortfolio = (overrides = {}) => ({
  equity: 100000.00,
  cash: 50000.00,
  buying_power: 150000.00,
  positions: [generateMockPosition()],
  ...overrides,
});

export const generateMockTrade = (overrides = {}) => ({
  id: 'trade-1',
  symbol: 'AAPL',
  qty: 100,
  side: 'buy',
  type: 'market',
  status: 'filled',
  filled_at: new Date().toISOString(),
  filled_price: 150.00,
  ...overrides,
});

// API mocking utilities
export const mockApiResponse = <T,>(data: T, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
};

// Wait utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// WebSocket mock helpers
export const createMockWebSocket = () => {
  const listeners: Record<string, Set<Function>> = {
    message: new Set(),
    open: new Set(),
    close: new Set(),
    error: new Set(),
  };

  return {
    addEventListener: (event: string, callback: Function) => {
      listeners[event]?.add(callback);
    },
    removeEventListener: (event: string, callback: Function) => {
      listeners[event]?.delete(callback);
    },
    send: jest.fn(),
    close: jest.fn(),
    triggerEvent: (event: string, data?: any) => {
      listeners[event]?.forEach(callback => callback(data));
    },
  };
};

// Test cleanup utility
export const clearMocks = () => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
};