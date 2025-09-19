import { Page } from "@playwright/test";

export class AuthHelper {
  constructor(private page: Page) {}

  async login(username: string, password: string): Promise<void> {
    await this.page.goto("/");
    await this.page.getByRole("button", { name: "Login" }).click();
    await this.page.getByLabel("Username").fill(username);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Submit" }).click();
  }

  async logout(): Promise<void> {
    await this.page.getByRole("button", { name: "Logout" }).click();
  }
}

export class ApiHelper {
  private baseUrl: string;

  constructor(private page: Page) {
    this.baseUrl = process.env.API_URL || "http://localhost:3001";
  }

  async createTestUser(userData: {
    username: string;
    password: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create test user: ${response.statusText}`);
    }
  }
}
