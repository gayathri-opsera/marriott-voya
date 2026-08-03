import { vi } from "vitest";

export const push = vi.fn();
export const replace = vi.fn();
export const back = vi.fn();
export const prefetch = vi.fn();

export const useRouter = vi.fn(() => ({
  push,
  replace,
  back,
  prefetch,
}));

export const useSearchParams = vi.fn(() => new URLSearchParams());
export const usePathname = vi.fn(() => "/");
