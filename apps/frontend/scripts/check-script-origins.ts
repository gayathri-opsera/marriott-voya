#!/usr/bin/env tsx
/**
 * Validates CSP script-src directives against the expected Stripe allowlist
 * and flags unsafe-inline drift.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const HEADERS_PATH = resolve(ROOT, "lib/headers.js");

const REQUIRED_STRIPE_ORIGINS = ["js.stripe.com", "m.stripe.com"];

function extractScriptSrc(csp: string): string[] {
  const match = csp.match(/script-src\s+([^;]+)/);
  if (!match?.[1]) return [];
  return match[1].trim().split(/\s+/);
}

function main(): void {
  const headersSource = readFileSync(HEADERS_PATH, "utf8");
  const cspMatch = headersSource.match(/const CSP_POLICY = \[([\s\S]*?)\]\.join/);
  if (!cspMatch?.[1]) {
    console.error("Could not locate CSP_POLICY in lib/headers.js");
    process.exit(1);
  }

  const cspLines = cspMatch[1]
    .split("\n")
    .map((line) => line.replace(/^[\s"]|[",\s]+$/g, ""))
    .filter(Boolean);
  const csp = cspLines.join("; ");
  const scriptSrc = extractScriptSrc(csp);

  if (scriptSrc.length === 0) {
    console.error("No script-src directive found in CSP");
    process.exit(1);
  }

  let hasDrift = false;

  for (const origin of REQUIRED_STRIPE_ORIGINS) {
    const present = scriptSrc.some((entry) => entry.includes(origin));
    if (!present) {
      console.error(`Missing required Stripe origin in script-src: ${origin}`);
      hasDrift = true;
    }
  }

  if (scriptSrc.includes("'unsafe-inline'")) {
    console.error("script-src contains 'unsafe-inline' — not permitted");
    hasDrift = true;
  }

  if (hasDrift) {
    process.exit(1);
  }

  console.log("CSP script-src inventory is clean.");
  process.exit(0);
}

main();
