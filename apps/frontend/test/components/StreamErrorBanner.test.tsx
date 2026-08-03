/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StreamErrorBanner,
  classifyStreamError,
  getRetryDelayMs,
} from "../../components/assistant/StreamErrorBanner";

describe("StreamErrorBanner", () => {
  it("shows connection lost message with retry button", () => {
    const onRetry = vi.fn();
    render(
      <StreamErrorBanner errorKind="connection_lost" onRetry={onRetry} retryCount={0} />,
    );
    expect(screen.getByText("Connection lost. Retry?")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("stream-retry-button"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows daily limit message without retry", () => {
    render(<StreamErrorBanner errorKind="allowance_exceeded" />);
    expect(screen.getByText("Daily limit reached")).toBeInTheDocument();
    expect(screen.queryByTestId("stream-retry-button")).not.toBeInTheDocument();
  });

  it("hides retry when max retries exceeded", () => {
    render(
      <StreamErrorBanner errorKind="connection_lost" onRetry={vi.fn()} retryCount={3} />,
    );
    expect(screen.queryByTestId("stream-retry-button")).not.toBeInTheDocument();
  });
});

describe("stream error helpers", () => {
  it("classifies HTTP status codes", () => {
    expect(classifyStreamError(429, "")).toBe("allowance_exceeded");
    expect(classifyStreamError(401, "")).toBe("session_expired");
    expect(classifyStreamError(0, "network error")).toBe("connection_lost");
  });

  it("computes exponential backoff delay", () => {
    expect(getRetryDelayMs(0)).toBe(1000);
    expect(getRetryDelayMs(1)).toBe(2000);
    expect(getRetryDelayMs(10)).toBe(8000);
  });
});
