import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const contracts = (sub: string) =>
  path.resolve(__dirname, "../../packages/contracts/src", sub);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      ["test/components/**", "jsdom"],
      ["test/routes/**", "jsdom"],
    ],
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
  resolve: {
    alias: [
      { find: "@travel/contracts/search", replacement: contracts("search/index.ts") },
      { find: "@travel/contracts/booking", replacement: contracts("booking/index.ts") },
      { find: "@travel/contracts/payment", replacement: contracts("payment/index.ts") },
      { find: "@travel/contracts/auth", replacement: contracts("auth/index.ts") },
      { find: "@travel/contracts/user", replacement: contracts("user/index.ts") },
      { find: "@travel/contracts/events", replacement: contracts("events/index.ts") },
      { find: "@travel/contracts/errors", replacement: contracts("errors/index.ts") },
      { find: "@travel/contracts", replacement: contracts("index.ts") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
});
