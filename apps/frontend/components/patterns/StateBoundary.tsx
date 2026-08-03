"use client";

import * as React from "react";
import { Skeleton, EmptyState, ErrorBanner, Button } from "@travel/design-system";
import { ApiError } from "../../lib/api/errors";

export type ScreenState = "idle" | "loading" | "empty" | "error" | "offline";

export interface StateBoundaryProps {
  state: ScreenState;
  children: React.ReactNode;
  error?: Error | ApiError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href?: string; onClick?: () => void };
}

function toErrorBannerError(error: Error | ApiError): { message: string; field?: string; code?: string } {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.field ? { field: error.field } : {}),
      code: error.code,
    };
  }
  return { message: error.message };
}

export function StateBoundary({
  state,
  children,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription = "There is no content to display.",
  emptyAction,
}: StateBoundaryProps): React.JSX.Element {
  if (state === "loading") {
    return (
      <div className="space-y-3 p-4" data-testid="state-loading">
        <Skeleton height={24} width="40%" />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
    );
  }

  if (state === "empty") {
    const action = emptyAction
      ? { label: emptyAction.label, onClick: emptyAction.onClick ?? onRetry ?? (() => {}) }
      : onRetry
        ? { label: "Refresh", onClick: onRetry }
        : undefined;

    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        {...(action ? { action } : {})}
      />
    );
  }

  if (state === "error") {
    return (
      <div className="p-4" data-testid="state-error">
        <ErrorBanner error={error ? toErrorBannerError(error) : { message: "Something went wrong" }} />
        {onRetry && (
          <Button className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (state === "offline") {
    return (
      <div className="p-4" data-testid="state-offline" role="alert">
        <ErrorBanner error={{ message: "You appear to be offline" }} />
        {onRetry && (
          <Button className="mt-4" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
