import type { ErrorEnvelope } from "@travel/contracts";

export function makeError(overrides: Partial<ErrorEnvelope["error"]> = {}): ErrorEnvelope {
  return {
    error: {
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      ...overrides,
    },
    reference: "corr_test_001",
  };
}
