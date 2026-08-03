/**
 * ApiError — normalized error from every non-2xx or network failure.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly field?: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ErrorCode = {
  NETWORK_ERROR: "NETWORK_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  UNAUTHORIZED: "unauthenticated",
  FORBIDDEN: "insufficient_permissions",
  NOT_FOUND: "not_found",
  VALIDATION: "validation_failed",
  INTERNAL: "internal_error",
} as const;

/** Parse a backend error response body into an ApiError. */
export function parseErrorBody(status: number, body: unknown): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as Record<string, unknown>).error as Record<string, unknown>;
    const code = (err.code as string) ?? "unknown_error";
    const message = (err.message as string) ?? "An error occurred";
    const field = typeof err.field === "string" ? err.field : undefined;
    return new ApiError(status, code, message, field);
  }
  return new ApiError(status, "unknown_error", `Request failed with status ${status}`);
}
