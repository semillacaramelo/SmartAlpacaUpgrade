import { test, expect } from "@playwright/test";

test.describe("System Monitoring", () => {
  test("should display system health indicators", async ({ page }) => {
    await page.goto("/monitoring");
    await expect(page.getByTestId("cpu-usage")).toBeVisible();
    await expect(page.getByTestId("memory-usage")).toBeVisible();
    await expect(page.getByTestId("network-latency")).toBeVisible();
  });

  test("should show alerts for abnormal conditions", async ({ page }) => {
    await page.goto("/monitoring");
    // Simulate high CPU usage
    await page.evaluate(() => {
      window.postMessage({ type: "TEST_CPU_ALERT", value: 95 }, "*");
    });
    await expect(page.getByText("High CPU Usage Alert")).toBeVisible();
  });
});
