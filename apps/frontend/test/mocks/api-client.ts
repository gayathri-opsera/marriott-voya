import { vi } from "vitest";

export const apiGet = vi.fn();
export const apiPost = vi.fn();
export const apiPatch = vi.fn();
export const apiDelete = vi.fn();
export const apiFetch = vi.fn();
export const configureAuth = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiFetch,
  configureAuth,
}));
