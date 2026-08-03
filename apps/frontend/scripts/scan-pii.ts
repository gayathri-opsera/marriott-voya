#!/usr/bin/env tsx
/**
 * PII scan gate — checks analytics and vitals payloads for sensitive data patterns.
 * Exits 0 if clean, 1 if violations found.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TARGETS = ["lib/vitals.ts", "lib/analytics.ts"];

const PII_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { name: "phone", regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: "credit-card", regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/ },
];

const FORBIDDEN_PAYLOAD_KEYS = ["userId", "email", "phone", "passport"];

let violations = 0;

for (const target of TARGETS) {
  const content = readFileSync(resolve(ROOT, target), "utf-8");

  for (const { name, regex } of PII_PATTERNS) {
    const matches = content.match(regex);
    if (matches) {
      console.error(`[PII] ${target}: potential ${name} pattern found: ${matches[0]}`);
      violations++;
    }
  }

  for (const key of FORBIDDEN_PAYLOAD_KEYS) {
    if (content.includes(key)) {
      console.error(`[PII] ${target}: forbidden payload key "${key}" found`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\nPII scan failed with ${violations} violation(s).`);
  process.exit(1);
}

console.log("PII scan passed — no sensitive patterns detected.");
process.exit(0);
