/**
 * Warns when frontend files re-declare contract types instead of importing them.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface RestatedContractViolation {
  file: string;
  line: number;
  typeName: string;
  rule: "no-restated-contracts";
}

const CONTRACT_TYPES = [
  "UnifiedOffer",
  "SearchResponse",
  "BookingRequest",
  "CreateBookingRequest",
  "BookingResponse",
  "Itinerary",
  "ItineraryItem",
];

const TYPE_PATTERN = new RegExp(
  `(?:export\\s+)?(?:type|interface)\\s+(${CONTRACT_TYPES.join("|")})\\b`,
  "g",
);

const SCAN_DIR = "apps/frontend";

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const skip = new Set(["node_modules", ".next", "dist", "test"]);

  function walk(current: string) {
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const full = join(current, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (/\.(tsx|ts)$/.test(entry)) {
          results.push(full);
        }
      } catch {
        // skip unreadable
      }
    }
  }

  walk(dir);
  return results;
}

export function checkRestatedContracts(rootDir: string): RestatedContractViolation[] {
  const violations: RestatedContractViolation[] = [];
  const absDir = join(rootDir, SCAN_DIR);

  for (const file of findSourceFiles(absDir)) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const matches = line.matchAll(TYPE_PATTERN);
      for (const m of matches) {
        violations.push({
          file: relative(rootDir, file),
          line: i + 1,
          typeName: m[1]!,
          rule: "no-restated-contracts",
        });
      }
    }
  }

  return violations;
}

export function formatRestatedContractReport(violations: RestatedContractViolation[]): string {
  if (violations.length === 0) {
    return "✓ no-restated-contracts: 0 violations";
  }
  const lines = [`✗ no-restated-contracts: ${violations.length} violation(s)\n`];
  for (const v of violations) {
    lines.push(`  ${v.file}:${v.line} — redefines ${v.typeName} (import from @travel/contracts instead)`);
  }
  return lines.join("\n");
}
