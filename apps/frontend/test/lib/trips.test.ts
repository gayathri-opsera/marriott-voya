import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTrips, fetchTrip } from "../../lib/api/trips";
import { apiGet } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  apiGet: vi.fn(),
}));

describe("trips API", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it("fetchTrips calls apiGet with /api/trips", async () => {
    const trips = [{ id: "t1", status: "CONFIRMED", title: "NYC → LAX", price: { amount: 299, currency: "USD" }, createdAt: "2026-01-01" }];
    vi.mocked(apiGet).mockResolvedValue(trips);

    const result = await fetchTrips();

    expect(apiGet).toHaveBeenCalledWith("/api/trips");
    expect(result).toEqual(trips);
  });

  it("fetchTrip calls apiGet with trip id", async () => {
    const trip = { id: "t1", status: "CONFIRMED", title: "NYC → LAX", price: { amount: 299, currency: "USD" }, createdAt: "2026-01-01" };
    vi.mocked(apiGet).mockResolvedValue(trip);

    const result = await fetchTrip("t1");

    expect(apiGet).toHaveBeenCalledWith("/api/trips/t1");
    expect(result).toEqual(trip);
  });
});
