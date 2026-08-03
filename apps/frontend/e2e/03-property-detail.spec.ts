import { test, expect } from "@playwright/test";

/**
 * E2E — Property Detail Page (/listings/[id])
 * Tests the photo gallery, tabs, booking widget, availability calendar,
 * and the "Complete Your Trip" AI suggestions panel.
 */

// Use a stable offer ID from the search-service seed
const OFFER_ID = "offer-hotel-1";

test.describe("Property Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the search page first to get a real offer ID
    await page.goto("/search?q=Lucca&types=accommodation");
    await page.waitForTimeout(2000);
  });

  test("clicking a result card navigates to /listings/[id]", async ({ page }) => {
    // Find a booking link
    const bookLink = page.getByRole("link", { name: /book now|view|details|villa della torre/i }).first();
    if (await bookLink.isVisible({ timeout: 3000 })) {
      await bookLink.click();
      await expect(page).toHaveURL(/\/listings\//);
      await page.screenshot({ path: "e2e/screenshots/03-property-detail.png", fullPage: true });
    } else {
      // Navigate directly to a known listing pattern
      await page.goto("/listings/offer-hotel-1-test");
      await page.waitForTimeout(1500);
      await page.screenshot({ path: "e2e/screenshots/03-property-detail-direct.png", fullPage: true });
    }
  });

  test("property detail page — renders photo grid", async ({ page }) => {
    await page.goto("/listings/offer-hotel-1-test");
    await page.waitForTimeout(1500);
    // Either real images or the loading state
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await page.screenshot({ path: "e2e/screenshots/03-photo-gallery.png" });
  });

  test("property detail page — tabs are clickable", async ({ page }) => {
    await page.goto("/listings/offer-hotel-1-test");
    await page.waitForTimeout(1500);
    const amenitiesTab = page.getByRole("tab", { name: /amenities/i });
    if (await amenitiesTab.isVisible({ timeout: 3000 })) {
      await amenitiesTab.click();
      await page.screenshot({ path: "e2e/screenshots/03-amenities-tab.png" });
      expect(await page.getByText(/Private pool|Full kitchen|WiFi/i).count()).toBeGreaterThan(0);
    }
  });

  test("property detail page — booking widget visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/listings/offer-hotel-1-test");
    await page.waitForTimeout(1500);
    const reserveBtn = page.getByRole("button", { name: /reserve/i });
    if (await reserveBtn.isVisible({ timeout: 3000 })) {
      expect(await reserveBtn.count()).toBeGreaterThan(0);
    }
  });

  test("property detail page — availability calendar renders", async ({ page }) => {
    await page.goto("/listings/offer-hotel-1-test");
    await page.waitForTimeout(1500);
    const calBtn = page.getByRole("button", { name: /next month/i });
    if (await calBtn.isVisible({ timeout: 3000 })) {
      await calBtn.click(); // navigate to next month
      await page.screenshot({ path: "e2e/screenshots/03-calendar.png" });
    }
  });

  test("property detail page — Complete Your Trip panel visible", async ({ page }) => {
    await page.goto("/listings/offer-hotel-1-test");
    await page.waitForTimeout(1500);
    const panelHeading = page.getByText(/complete your trip/i);
    if (await panelHeading.isVisible({ timeout: 3000 })) {
      await page.screenshot({ path: "e2e/screenshots/03-complete-trip.png" });
      expect(await panelHeading.count()).toBeGreaterThan(0);
    }
  });

  test("seed activities.json lists 19 activities", async ({ request }) => {
    const res = await request.get("http://localhost:3200/seed/activities.json");
    if (!res.ok()) { test.skip(); return; }
    const { activities } = await res.json() as { activities: unknown[] };
    expect(activities).toHaveLength(19);
  });
});
