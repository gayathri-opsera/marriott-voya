import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSession, getSessionMetadata } from "../../lib/assistant-session";
import { apiGet, apiPost } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  configureAuth: vi.fn(),
}));

describe("assistant-session", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiGet).mockReset();
  });

  it("createSession calls POST and returns sessionId", async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: "sess_abc123" });

    const result = await createSession();

    expect(apiPost).toHaveBeenCalledWith("/api/v1/ai/sessions", {});
    expect(result).toEqual({ sessionId: "sess_abc123" });
  });

  it("getSessionMetadata fetches session info", async () => {
    const metadata = {
      id: "sess_abc123",
      createdAt: "2026-01-01T00:00:00.000Z",
      messageCount: 5,
      tokenCount: 1200,
    };
    vi.mocked(apiGet).mockResolvedValue(metadata);

    const result = await getSessionMetadata("sess_abc123");

    expect(apiGet).toHaveBeenCalledWith("/api/v1/ai/sessions/sess_abc123");
    expect(result).toEqual(metadata);
  });
});
