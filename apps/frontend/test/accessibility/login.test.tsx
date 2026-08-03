/**
 * @vitest-environment jsdom
 */
import { describe, it, vi, beforeEach } from "vitest";
import { renderAndTestA11y } from "../utils/axe";
import LoginPage from "../../app/auth/login/page";
import { ToastProvider } from "../../components/ui/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../lib/api/client", () => ({
  apiPost: vi.fn(),
  configureAuth: vi.fn(),
}));

describe("login page accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has no axe violations", async () => {
    await renderAndTestA11y(
      <ToastProvider>
        <LoginPage />
      </ToastProvider>,
    );
  });
});
