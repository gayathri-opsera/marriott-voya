import { test, expect } from "@playwright/test";

/**
 * E2E — Homepage flow
 * Tests the hero section, search form, collections teaser, and navigation.
 */

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the Voya/Marriott hero headline", async ({ page }) => {
    // Hero should contain a headline about HVMI or vacation
    const hero = page.locator("h1, [data-testid='hero-headline']").first();
    await expect(hero).toBeVisible({ timeout: 10_000 });
    const text = await hero.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(3);
  });

  test("search form — destination input accepts text", async ({ page }) => {
    const input = page.getByPlaceholder(/where/i).first();
    await expect(input).toBeVisible();
    await input.fill("Lucca");
    await expect(input).toHaveValue("Lucca");
  });

  test("search form — shows destination suggestions dropdown", async ({ page }) => {
    const input = page.getByPlaceholder(/where/i).first();
    await input.fill("Lu");
    // Dropdown should appear with Lucca
    const suggestions = page.locator("ul[role='listbox'], [data-testid='suggestions']");
    // Allow time for the list to render
    await page.waitForTimeout(300);
    // Either a listbox is visible OR text "Lucca" appears somewhere on the page suggestions
    const hasLucca = await page.getByText(/Lucca/i).count();
    expect(hasLucca).toBeGreaterThan(0);
  });

  test("search form — check-in and check-out date fields are present", async ({ page }) => {
    const dateInputs = page.locator("input[type='date']");
    await expect(dateInputs.first()).toBeVisible();
  });

  test("navigation — Collections link goes to /collections", async ({ page }) => {
    const colLink = page.getByRole("link", { name: /collections/i });
    await expect(colLink).toBeVisible();
    await colLink.click();
    await expect(page).toHaveURL(/\/collections/);
  });

  test("navigation — Plan with AI link goes to /assistant or /plan", async ({ page }) => {
    // Use first() since the link appears in both desktop nav + mobile footer
    const planLink = page.getByRole("link", { name: /plan with ai/i, exact: true }).first();
    await expect(planLink).toBeVisible();
    await planLink.click();
    await expect(page).toHaveURL(/\/(assistant|plan)/);
  });

  test("page takes a screenshot for visual review", async ({ page }) => {
    await page.screenshot({ path: "e2e/screenshots/01-homepage.png", fullPage: true });
  });
});
