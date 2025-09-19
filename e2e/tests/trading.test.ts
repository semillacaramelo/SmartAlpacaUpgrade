import { test, expect } from "@playwright/test";

test.describe("Trading Workflow", () => {
  test("should create and execute a trade", async ({ page }) => {
    await page.goto("/trading");
    await page.getByRole("button", { name: "New Trade" }).click();
    await page.getByLabel("Symbol").fill("AAPL");
    await page.getByLabel("Quantity").fill("100");
    await page.getByRole("radio", { name: "Buy" }).check();
    await page.getByRole("button", { name: "Submit Order" }).click();
    await expect(page.getByText("Order submitted successfully")).toBeVisible();
  });

  test("should show position in portfolio after trade", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByText("AAPL")).toBeVisible();
    await expect(page.getByText("100")).toBeVisible();
  });
});
