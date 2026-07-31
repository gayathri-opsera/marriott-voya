import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");

const PII_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { name: "phone", regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: "credit-card", regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/ },
];

const FORBIDDEN_PAYLOAD_KEYS = ["userId", "email", "phone", "passport"];
const TARGETS = ["lib/vitals.ts", "lib/analytics.ts"];

function scanForPii(): number {
  let violations = 0;
  for (const target of TARGETS) {
    const content = readFileSync(resolve(ROOT, target), "utf-8");
    for (const { regex } of PII_PATTERNS) {
      if (regex.test(content)) violations++;
    }
    for (const key of FORBIDDEN_PAYLOAD_KEYS) {
      if (content.includes(key)) violations++;
    }
  }
  return violations;
}

describe("PII scan gate", () => {
  it("scan-pii script exists", () => {
    expect(existsSync(resolve(ROOT, "scripts/scan-pii.ts"))).toBe(true);
  });

  it("analytics and vitals files contain no PII patterns or forbidden keys", () => {
    expect(scanForPii()).toBe(0);
  });
});
