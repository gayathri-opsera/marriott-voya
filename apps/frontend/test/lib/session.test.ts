import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setSession,
  clearSession,
  refreshSession,
  getSession,
  getAccessToken,
} from "../../lib/session";
import { apiPost } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  apiPost: vi.fn(),
  configureAuth: vi.fn(),
}));

describe("session refresh", () => {
  beforeEach(() => {
    clearSession();
    vi.mocked(apiPost).mockReset();
  });

  it("refreshSession stores a new access token on success", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      accessToken: "new-token",
      userId: "user-1",
      expiresIn: 3600,
    });

    const ok = await refreshSession();

    expect(ok).toBe(true);
    expect(getAccessToken()).toBe("new-token");
  });

  it("refreshSession single-flights concurrent calls", async () => {
    let resolveRefresh!: (value: unknown) => void;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });
    vi.mocked(apiPost).mockReturnValue(refreshPromise as Promise<unknown>);

    const first = refreshSession();
    const second = refreshSession();

    resolveRefresh({ accessToken: "token", userId: "u1", expiresIn: 3600 });

    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("getSession proactively refreshes when within 60s of expiry", async () => {
    setSession("old-token", "user-1", 30);
    vi.mocked(apiPost).mockResolvedValue({
      accessToken: "refreshed-token",
      userId: "user-1",
      expiresIn: 3600,
    });

    const session = await getSession();

    expect(apiPost).toHaveBeenCalledWith("/auth/refresh", {});
    expect(session.accessToken).toBe("refreshed-token");
  });
});
