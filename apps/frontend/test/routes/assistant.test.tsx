/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssistantPage from "../../app/assistant/page";
import * as assistantSession from "../../lib/assistant-session";
import * as assistantStream from "../../lib/assistant-stream";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("../../lib/assistant-session", () => ({
  createSession: vi.fn(),
  getSessionMetadata: vi.fn(),
}));

vi.mock("../../lib/assistant-stream", () => ({
  useAssistantStream: vi.fn(),
}));

describe("assistant route", () => {
  beforeEach(() => {
    vi.mocked(assistantSession.createSession).mockResolvedValue({ sessionId: "sess_test" });
    vi.mocked(assistantSession.getSessionMetadata).mockResolvedValue({
      id: "sess_test",
      createdAt: "2026-01-01T00:00:00.000Z",
      messageCount: 0,
      tokenCount: 0,
    });
    vi.mocked(assistantStream.useAssistantStream).mockReturnValue({
      messages: [],
      isStreaming: false,
      error: null,
      errorKind: null,
      activeTool: null,
      retryCount: 0,
      abort: vi.fn(),
      send: vi.fn(),
      retry: vi.fn(),
    });
  });

  it("renders Voya AI header", async () => {
    render(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Voya AI").length).toBeGreaterThan(0);
    });
  });

  it("shows welcome message when no messages", async () => {
    render(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByText(/Hi! I'm Voya/)).toBeInTheDocument();
    });
  });

  it("shows composer for sending messages", async () => {
    render(<AssistantPage />);
    await waitFor(() => {
      expect(screen.getByLabelText("Message")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Message"), "Find flights to London");
    expect(screen.getByLabelText("Message")).toHaveValue("Find flights to London");
  });
});
