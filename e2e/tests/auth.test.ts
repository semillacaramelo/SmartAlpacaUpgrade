import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should successfully log in with valid credentials", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByLabel("Username").fill("testuser");
    await page.getByLabel("Password").fill("testpass");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByLabel("Username").fill("invalid");
    await page.getByLabel("Password").fill("invalid");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });
});
