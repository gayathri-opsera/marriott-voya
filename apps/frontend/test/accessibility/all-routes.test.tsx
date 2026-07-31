/**
 * @vitest-environment jsdom
 */
import { describe, it, vi } from "vitest";
import { renderAndTestA11y } from "../utils/axe";
import HomePage from "../../app/page";
import SearchPage from "../../app/search/page";
import ListingDetailPage from "../../app/listings/[id]/page";
import CheckoutPage from "../../app/checkout/page";
import AssistantPage from "../../app/assistant/page";
import DashboardPage from "../../app/dashboard/page";
import ProfilePage from "../../app/profile/page";
import LoginPage from "../../app/auth/login/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("q=London&type=flights"),
  usePathname: () => "/",
  useParams: () => ({ id: "offer-test-1" }),
}));

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn().mockRejectedValue(new Error("mock")),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  configureAuth: vi.fn(),
}));

vi.mock("../../lib/api/trips", () => ({
  fetchTrips: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../lib/assistant-session", () => ({
  createSession: vi.fn().mockResolvedValue({ sessionId: "sess_test" }),
  getSessionMetadata: vi.fn().mockResolvedValue({
    id: "sess_test",
    createdAt: "2026-01-01T00:00:00.000Z",
    messageCount: 0,
    tokenCount: 0,
  }),
}));

vi.mock("../../lib/assistant-stream", () => ({
  useAssistantStream: vi.fn().mockReturnValue({
    messages: [],
    isStreaming: false,
    error: null,
    errorKind: null,
    activeTool: null,
    retryCount: 0,
    abort: vi.fn(),
    send: vi.fn(),
    retry: vi.fn(),
  }),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({ accessToken: null, userId: null }),
  isAuthenticated: vi.fn().mockReturnValue(false),
  clearSession: vi.fn(),
}));

describe("all routes accessibility gate", () => {
  it("landing page", async () => {
    await renderAndTestA11y(<HomePage />);
  });

  it("search page", async () => {
    await renderAndTestA11y(<SearchPage />);
  });

  it("listing detail page", async () => {
    await renderAndTestA11y(<ListingDetailPage />);
  });

  it("checkout page", async () => {
    await renderAndTestA11y(<CheckoutPage />);
  });

  it("assistant page", async () => {
    await renderAndTestA11y(<AssistantPage />);
  });

  it("dashboard page", async () => {
    await renderAndTestA11y(<DashboardPage />);
  });

  it("profile page", async () => {
    await renderAndTestA11y(<ProfilePage />);
  });

  it("login page", async () => {
    await renderAndTestA11y(<LoginPage />);
  });
});
