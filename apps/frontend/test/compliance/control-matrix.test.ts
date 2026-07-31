import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

const CONTROL_MATRIX: Array<{ control: string; files: string[]; exports?: string[] }> = [
  {
    control: "SOC2/CC6.1 Authentication",
    files: ["lib/session.ts", "app/auth/login/page.tsx"],
    exports: ["setSession", "getSession", "clearSession"],
  },
  {
    control: "SOC2/CC7.2 Encryption",
    files: ["lib/idempotency.ts", "lib/headers.ts"],
    exports: ["generateIdempotencyKey"],
  },
  {
    control: "GDPR Art.17 Right to Erasure",
    files: ["app/profile/privacy/page.tsx"],
  },
  {
    control: "GDPR Art.20 Portability",
    files: ["app/profile/privacy/page.tsx"],
  },
  {
    control: "PCI-DSS Stripe isolation",
    files: ["app/checkout/page.tsx"],
  },
  {
    control: "PII telemetry scan",
    files: ["scripts/scan-pii.ts", "lib/analytics.ts", "lib/vitals.ts"],
    exports: ["trackEvent", "reportWebVitals"],
  },
];

describe("compliance control matrix", () => {
  for (const entry of CONTROL_MATRIX) {
    it(`${entry.control} — required files exist`, () => {
      for (const file of entry.files) {
        expect(existsSync(resolve(ROOT, file)), `Missing: ${file}`).toBe(true);
      }
    });
  }

  it("session.ts exports authentication symbols", async () => {
    const session = await import("../../lib/session");
    expect(typeof session.setSession).toBe("function");
    expect(typeof session.getSession).toBe("function");
    expect(typeof session.clearSession).toBe("function");
  });

  it("analytics and vitals export telemetry functions without PII keys", async () => {
    const analytics = await import("../../lib/analytics");
    const vitals = await import("../../lib/vitals");
    expect(typeof analytics.trackEvent).toBe("function");
    expect(typeof vitals.reportWebVitals).toBe("function");

    const analyticsSrc = await import("node:fs").then((fs) =>
      fs.readFileSync(resolve(ROOT, "lib/analytics.ts"), "utf-8"),
    );
    expect(analyticsSrc).not.toContain("userId");
    expect(analyticsSrc).not.toContain("passport");
  });
});
