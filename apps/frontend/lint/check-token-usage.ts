/**
 * Scans frontend components and app routes for raw hex colors and palette utilities.
 * Exits with code 1 if violations are found.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

const SCAN_DIRS = ["components", "app"];

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

const PALETTE_PATTERN =
  /\b(?:text|bg|border|ring|from|to|via|fill|stroke|outline|decoration|divide|placeholder|caret|accent|shadow)-(?:gray|blue|red|green|yellow|slate|zinc|emerald|indigo|purple|pink|orange|teal|cyan|lime|amber|rose|violet|fuchsia|sky|neutral|stone)-(?:\d{2,3}|50)\b/g;

export interface TokenViolation {
  file: string;
  line: number;
  match: string;
  kind: "hex" | "palette";
}

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const skip = new Set(["node_modules", ".next"]);

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

export function scanTokenUsage(): TokenViolation[] {
  const violations: TokenViolation[] = [];

  for (const scanDir of SCAN_DIRS) {
    const absDir = join(FRONTEND_ROOT, scanDir);
    for (const file of findSourceFiles(absDir)) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (!line.includes("className")) continue;

        for (const m of line.matchAll(HEX_PATTERN)) {
          violations.push({
            file: relative(FRONTEND_ROOT, file),
            line: i + 1,
            match: m[0],
            kind: "hex",
          });
        }
        for (const m of line.matchAll(PALETTE_PATTERN)) {
          violations.push({
            file: relative(FRONTEND_ROOT, file),
            line: i + 1,
            match: m[0],
            kind: "palette",
          });
        }
      }
    }
  }

  return violations;
}

export function formatTokenReport(violations: TokenViolation[]): string {
  if (violations.length === 0) {
    return "✓ lint:tokens — 0 violations";
  }
  const lines = [`✗ lint:tokens — ${violations.length} violation(s)\n`];
  for (const v of violations) {
    lines.push(`  ${v.file}:${v.line} [${v.kind}] ${v.match}`);
  }
  return lines.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url).endsWith(process.argv[1]?.split("/").pop() ?? "")) {
  const violations = scanTokenUsage();
  console.log(formatTokenReport(violations));
  process.exit(violations.length > 0 ? 1 : 0);
}
