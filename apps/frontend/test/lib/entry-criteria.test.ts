import { describe, it, expect, beforeEach } from "vitest";
import {
  getEntryCriteria,
  setEntryCriteria,
  clearEntryCriteria,
} from "../../lib/entry-criteria";

describe("entry-criteria", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null when no criteria is stored", () => {
    expect(getEntryCriteria()).toBeNull();
  });

  it("persists and retrieves entry criteria from sessionStorage", () => {
    const criteria = {
      destination: "London",
      type: "hotels" as const,
      date: "2026-08-15",
      passengers: 2,
    };
    setEntryCriteria(criteria);
    expect(getEntryCriteria()).toEqual(criteria);
  });

  it("clears stored entry criteria", () => {
    setEntryCriteria({ type: "flights", destination: "JFK" });
    clearEntryCriteria();
    expect(getEntryCriteria()).toBeNull();
  });
});
