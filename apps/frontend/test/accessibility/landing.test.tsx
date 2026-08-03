/**
 * @vitest-environment jsdom
 */
import { describe, it, vi } from "vitest";
import { renderAndTestA11y } from "../utils/axe";
import HomePage from "../../app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("landing page accessibility", () => {
  it("has no axe violations", async () => {
    await renderAndTestA11y(<HomePage />);
  });
});
