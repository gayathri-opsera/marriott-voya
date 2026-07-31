import * as React from "react";
import { cn } from "../lib/cn.js";

export interface ErrorBannerError {
  message: string;
  field?: string;
  code?: string;
}

export interface ErrorBannerProps {
  error: ErrorBannerError | null;
  className?: string;
}

export function ErrorBanner({ error, className }: ErrorBannerProps): React.JSX.Element | null {
  if (!error) return null;

  return (
    <div
      role="alert"
      data-testid="error-banner"
      className={cn(
        "rounded-md border border-danger bg-surface-subtle p-4 text-sm text-danger",
        className,
      )}
    >
      {error.field ? (
        <p data-testid="error-message">
          <span className="font-medium">{error.field}:</span> {error.message}
        </p>
      ) : (
        <p data-testid="error-message">{error.message}</p>
      )}
      {error.code && (
        <p data-testid="error-code" className="mt-1 text-xs text-text-muted">
          Code: {error.code}
        </p>
      )}
    </div>
  );
}
