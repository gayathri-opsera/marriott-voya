import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Pool-per-file keeps module caches isolated between test suites,
    // which prevents the node:sqlite module resolution issue.
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
  resolve: {
    alias: {
      "@travel/contracts/provenance": resolve(__dirname, "../../packages/contracts/src/provenance/index.ts"),
    },
  },
});
