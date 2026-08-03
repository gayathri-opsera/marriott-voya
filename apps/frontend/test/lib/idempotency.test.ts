import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateIdempotencyKey, IdempotencyStore } from "../../lib/idempotency";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("idempotency", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("generates a namespaced UUID key", () => {
    const key = generateIdempotencyKey("checkout");
    expect(key).toMatch(/^checkout-[0-9a-f-]{36}$/);
  });

  it("stores and retrieves a key", () => {
    const store = new IdempotencyStore(storage);
    store.set("booking-123", "checkout-abc");
    expect(store.get("booking-123")).toBe("checkout-abc");
  });

  it("expires entries after TTL", () => {
    vi.useFakeTimers();
    const store = new IdempotencyStore(storage);
    store.set("booking-456", "checkout-def");

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    expect(store.get("booking-456")).toBeNull();

    vi.useRealTimers();
  });
});
