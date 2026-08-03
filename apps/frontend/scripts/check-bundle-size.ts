import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface RouteBudget {
  route: string;
  budgetKb: number;
  critical: boolean;
}

const BUDGETS: RouteBudget[] = [
  { route: "/", budgetKb: 150, critical: true },
  { route: "/search", budgetKb: 200, critical: true },
  { route: "/checkout", budgetKb: 180, critical: true },
  { route: "/assistant", budgetKb: 200, critical: false },
];

const NEXT_DIR = join(process.cwd(), ".next");

function readBuildManifest(): Record<string, string[]> | null {
  const manifestPath = join(NEXT_DIR, "build-manifest.json");
  if (!existsSync(manifestPath)) return null;

  const raw = readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as { pages?: Record<string, string[]> };
  return manifest.pages ?? null;
}

function readAnalyzeManifest(): Record<string, number> | null {
  const analyzePath = join(NEXT_DIR, "analyze", "client.json");
  if (!existsSync(analyzePath)) return null;

  const raw = readFileSync(analyzePath, "utf-8");
  return JSON.parse(raw) as Record<string, number>;
}

function estimateRouteSizeKb(
  route: string,
  pages: Record<string, string[]>,
): number | null {
  const files = pages[route];
  if (!files) return null;

  let totalBytes = 0;
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const filePath = join(NEXT_DIR, file.startsWith("/") ? file.slice(1) : file);
    if (existsSync(filePath)) {
      totalBytes += readFileSync(filePath).byteLength;
    }
  }

  return totalBytes / 1024;
}

function main(): void {
  const analyze = readAnalyzeManifest();
  const pages = readBuildManifest();

  if (!analyze && !pages) {
    console.warn("[bundle-check] No .next/analyze or .next/build-manifest.json found — skipping.");
    process.exit(0);
  }

  let criticalExceeded = false;

  for (const { route, budgetKb, critical } of BUDGETS) {
    let sizeKb: number | null = null;

    if (analyze && analyze[route] !== undefined) {
      sizeKb = analyze[route] / 1024;
    } else if (pages) {
      sizeKb = estimateRouteSizeKb(route, pages);
    }

    if (sizeKb === null) {
      console.log(`[bundle-check] ${route}: no data available`);
      continue;
    }

    const rounded = Math.round(sizeKb);
    if (sizeKb > budgetKb) {
      const level = critical ? "CRITICAL" : "WARNING";
      console.warn(
        `[bundle-check] ${level}: ${route} is ${rounded}KB JS (budget: ${budgetKb}KB)`,
      );
      if (critical) criticalExceeded = true;
    } else {
      console.log(`[bundle-check] OK: ${route} is ${rounded}KB JS (budget: ${budgetKb}KB)`);
    }
  }

  if (criticalExceeded) {
    process.exit(1);
  }
}

main();
