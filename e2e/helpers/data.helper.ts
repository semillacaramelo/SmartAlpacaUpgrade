import { Page } from "@playwright/test";

export class DataHelper {
  constructor(private page: Page) {}

  async generateTestData() {
    return {
      user: {
        username: `test_user_${Date.now()}`,
        password: "Test@123",
      },
      trade: {
        symbol: "AAPL",
        quantity: 100,
        side: "buy",
      },
    };
  }

  async cleanupTestData() {
    // Cleanup test data from the database
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:3001"}/api/cleanup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to cleanup test data: ${response.statusText}`);
    }
  }
}

export class StateHelper {
  constructor(private page: Page) {}

  async saveState() {
    // Save the current state (e.g., local storage, cookies)
    await this.page.context().storageState({ path: "./e2e/state.json" });
  }

  async loadState() {
    // Load a previously saved state
    await this.page.context().storageState({ path: "./e2e/state.json" });
  }
}
