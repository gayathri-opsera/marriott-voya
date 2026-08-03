import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("tailwind animation plugin", () => {
  it("registers tailwindcss-animate in tailwind.config.ts", () => {
    const configPath = resolve(__dirname, "../../tailwind.config.ts");
    const source = readFileSync(configPath, "utf8");
    expect(source).toContain("tailwindcss-animate");
    expect(source).toMatch(/plugins:\s*\[/);
  });

  it("Modal overlay uses animate-in and animate-out utilities", () => {
    const modalPath = resolve(__dirname, "../../components/ui/Modal.tsx");
    const source = readFileSync(modalPath, "utf8");
    expect(source).toContain("animate-in");
    expect(source).toContain("animate-out");
  });

  it("Drawer content uses animate-in and animate-out utilities", () => {
    const drawerPath = resolve(__dirname, "../../components/ui/Drawer.tsx");
    const source = readFileSync(drawerPath, "utf8");
    expect(source).toContain("animate-in");
    expect(source).toContain("animate-out");
  });
});
