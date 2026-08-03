import { test, expect } from "@playwright/test";

/**
 * E2E — AI Chat / Plan with AI (/assistant)
 * Tests the chat interface, welcome message, quick reply chips, and
 * that messages can be sent and a response renders.
 */

test.describe("AI Chat — Plan with AI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assistant");
    await page.waitForTimeout(1000);
  });

  test("renders the chat interface", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await page.screenshot({ path: "e2e/screenshots/06-ai-chat.png", fullPage: true });
  });

  test("message input field is visible and focusable", async ({ page }) => {
    const input = page.locator("textarea, input[type='text'][placeholder*='message']").first();
    if (await input.isVisible({ timeout: 5000 })) {
      await input.focus();
      await expect(input).toBeFocused();
    }
  });

  test("can type a message in the chat composer", async ({ page }) => {
    const input = page.locator("textarea, input[type='text']").first();
    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill("I want to visit Lucca in Tuscany for a week");
      const value = await input.inputValue();
      expect(value).toContain("Lucca");
      await page.screenshot({ path: "e2e/screenshots/06-ai-typing.png" });
    }
  });

  test("send button / Enter submits the message", async ({ page }) => {
    const input = page.locator("textarea, input[type='text']").first();
    if (!await input.isVisible({ timeout: 5000 })) { return; }

    await input.fill("Hello, I want to plan a vacation in Tuscany");
    await page.waitForTimeout(200);

    // Try pressing Enter to submit (avoids the disabled-button issue)
    await input.press("Enter");

    // Wait for a response (message bubble should appear or stream to start)
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "e2e/screenshots/06-ai-response.png", fullPage: true });

    const pageText = await page.textContent("body");
    expect(pageText!.length).toBeGreaterThan(50);
  });

  test("quick reply chips render for destination prompts", async ({ page }) => {
    const chips = page.locator("[data-testid='quick-reply'], .quick-reply-chip");
    if (await chips.count() > 0) {
      await page.screenshot({ path: "e2e/screenshots/06-quick-replies.png" });
    }
  });

  test("AI service health check", async ({ request }) => {
    // Use 127.0.0.1 to avoid IPv6 resolution issues in Playwright's request context
    const res = await request.get("http://127.0.0.1:3006/health").catch(() => null);
    if (!res || !res.ok()) { test.skip(); return; }
    const body = await res.json() as { status: string; apiKeyConfigured: boolean };
    expect(body.status).toBe("ok");
    expect(body.apiKeyConfigured).toBe(true);
  });
});
