/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "../../app/auth/login/page";
import RegisterPage from "../../app/auth/register/page";
import ForgotPasswordPage from "../../app/auth/forgot-password/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../lib/api/client", () => ({
  apiPost: vi.fn(),
  configureAuth: vi.fn(),
}));

vi.mock("../../components/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe("auth routes", () => {
  it("login page renders sign-in form", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /Sign in to Voya/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Forgot password/i })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("register page renders registration form with name fields", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
  });

  it("register page links to login", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("link", { name: /Sign in/i })).toHaveAttribute("href", "/auth/login");
  });

  it("forgot-password page renders email form", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: /Reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send reset link/i })).toBeInTheDocument();
  });
});
