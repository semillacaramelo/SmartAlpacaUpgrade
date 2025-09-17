// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB = '1'; // Use a separate DB for tests

// Mock external services will be handled in individual test files

// Test utilities
export const testUtils = {
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  createMockBar: (overrides = {}) => ({
    timestamp: new Date(),
    open: 100,
    high: 105,
    low: 95,
    close: 102,
    volume: 1000,
    ...overrides,
  }),
  createMockMarketData: (overrides = {}) => ({
    symbol: 'AAPL',
    price: 150.0,
    volume: 1000000,
    change: 2.5,
    changePercent: 1.69,
    high: 152.0,
    low: 148.0,
    open: 149.0,
    previousClose: 147.5,
    ...overrides,
  }),
};
