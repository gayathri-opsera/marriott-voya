"use client";

import * as React from "react";
import { Button } from "@travel/design-system";

export type StreamErrorKind = "connection_lost" | "allowance_exceeded" | "session_expired" | "generic";

export interface StreamErrorBannerProps {
  errorKind: StreamErrorKind;
  message?: string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

const ERROR_COPY: Record<StreamErrorKind, { title: string; showRetry: boolean }> = {
  connection_lost: { title: "Connection lost. Retry?", showRetry: true },
  allowance_exceeded: { title: "Daily limit reached", showRetry: false },
  session_expired: { title: "Your session has expired. Please sign in again.", showRetry: false },
  generic: { title: "Something went wrong.", showRetry: true },
};

export function StreamErrorBanner({
  errorKind,
  message,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: StreamErrorBannerProps): React.JSX.Element {
  const copy = ERROR_COPY[errorKind];
  const canRetry = copy.showRetry && onRetry && retryCount < maxRetries;

  return (
    <div
      role="alert"
      className="mx-4 my-2 rounded-lg border border-danger/30 bg-error-light px-4 py-3 text-sm text-danger"
      data-testid="stream-error-banner"
      data-error-kind={errorKind}
    >
      <p className="font-medium">{message ?? copy.title}</p>
      {canRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRetry}
          data-testid="stream-retry-button"
        >
          Retry ({maxRetries - retryCount} left)
        </Button>
      )}
    </div>
  );
}

export const MAX_STREAM_RETRIES = 3;

export function getRetryDelayMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

export function classifyStreamError(status: number, message: string): StreamErrorKind {
  if (status === 429) return "allowance_exceeded";
  if (status === 401 || status === 403) return "session_expired";
  if (message.toLowerCase().includes("network") || status === 0) return "connection_lost";
  return "generic";
}
