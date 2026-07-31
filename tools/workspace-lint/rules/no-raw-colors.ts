/**
 * Warns on raw Tailwind palette classes in frontend components.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface RawColorViolation {
  file: string;
  line: number;
  match: string;
  rule: "no-raw-colors";
}

const PALETTE_PATTERN =
  /\b(?:text|bg|border|ring|from|to|via|fill|stroke|outline|decoration|divide|placeholder|caret|accent|shadow)-(?:gray|blue|red|green|yellow|slate|zinc|emerald|indigo|purple|pink|orange|teal|cyan|lime|amber|rose|violet|fuchsia|sky|neutral|stone)-(?:\d{2,3}|50)\b/g;

const SCAN_DIRS = ["apps/frontend/components", "apps/frontend/app"];

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  const skip = new Set(["node_modules", ".next", "dist"]);

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

export function checkRawColors(rootDir: string): RawColorViolation[] {
  const violations: RawColorViolation[] = [];

  for (const scanDir of SCAN_DIRS) {
    const absDir = join(rootDir, scanDir);
    for (const file of findTsxFiles(absDir)) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const matches = line.matchAll(PALETTE_PATTERN);
        for (const m of matches) {
          violations.push({
            file: relative(rootDir, file),
            line: i + 1,
            match: m[0],
            rule: "no-raw-colors",
          });
        }
      }
    }
  }

  return violations;
}

export function formatRawColorReport(violations: RawColorViolation[]): string {
  if (violations.length === 0) {
    return "✓ no-raw-colors: 0 violations";
  }
  const lines = [`✗ no-raw-colors: ${violations.length} violation(s)\n`];
  for (const v of violations) {
    lines.push(`  ${v.file}:${v.line} — ${v.match}`);
  }
  return lines.join("\n");
}
