import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
    ...options,
  });
}

export * from "@testing-library/react";
