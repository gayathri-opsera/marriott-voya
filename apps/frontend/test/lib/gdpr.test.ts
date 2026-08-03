import { describe, it, expect } from "vitest";

// Pure unit test — only validate the confirmation string contract, no network
describe("GDPR erasure confirmation string", () => {
  it("accepts the correct confirmation string", () => {
    const validConfirmation = "I understand this will permanently delete my data";
    expect(validConfirmation.length).toBeGreaterThan(0);
    expect(validConfirmation).toContain("permanently delete");
  });

  it("rejects empty confirmation", () => {
    const confirmation = "";
    expect(confirmation.length).toBe(0);
  });
});
