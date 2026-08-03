import { describe, it, expect } from "vitest";
import { ROUTES, NAV_LINKS } from "../../lib/routes";

describe("routes", () => {
  it("defines HOME route starting with /", () => {
    expect(ROUTES.HOME).toMatch(/^\//);
    expect(ROUTES.HOME).toBe("/");
  });

  it("defines auth routes starting with /", () => {
    expect(ROUTES.LOGIN).toMatch(/^\//);
    expect(ROUTES.REGISTER).toMatch(/^\//);
    expect(ROUTES.LOGIN).toBe("/auth/login");
    expect(ROUTES.REGISTER).toBe("/auth/register");
  });

  it("defines all NAV_LINKS hrefs as valid paths starting with /", () => {
    for (const link of NAV_LINKS) {
      expect(typeof link.href).toBe("string");
      expect(link.href).toMatch(/^\//);
      expect(link.label.length).toBeGreaterThan(0);
    }
  });
});
