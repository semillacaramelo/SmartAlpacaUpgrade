declare global {
  var testUtils: {
    waitFor: (ms: number) => Promise<void>;
    createMockBar: (overrides?: any) => any;
    createMockMarketData: (overrides?: any) => any;
  };
}

export {};
