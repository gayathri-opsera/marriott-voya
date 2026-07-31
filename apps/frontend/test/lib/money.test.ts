import { describe, it, expect } from "vitest";
import { formatMoney } from "../../lib/money";

describe("formatMoney", () => {
  it("formats USD amounts", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats EUR amounts with de-DE locale", () => {
    const formatted = formatMoney(99.99, "EUR", "de-DE");
    expect(formatted).toContain("99,99");
    expect(formatted).toContain("€");
  });

  it("formats GBP amounts with en-GB locale", () => {
    const formatted = formatMoney(50, "GBP", "en-GB");
    expect(formatted).toBe("£50.00");
  });
});
