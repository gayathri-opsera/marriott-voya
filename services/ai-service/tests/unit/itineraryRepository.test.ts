/**
 * Unit tests for ItineraryRepository (SQLite) — WOREF-029
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryItineraryRepository } from "../../src/domain/ItineraryRepository.js";
import type { ItineraryDayItem } from "../../src/domain/ItineraryRepository.js";

let repo: InMemoryItineraryRepository;

const ITEMS: ItineraryDayItem[] = [
  {
    date: "2099-09-10",
    type: "ACCOMMODATION",
    label: "Villa della Torre",
    detail: "HVMI — 3-bedroom villa, Lucca Historic Centre",
    price: 485,
    currency: "USD",
    bonvoyPoints: 2425,
    provenance: "HVMI",
  },
  {
    date: "2099-09-11",
    type: "ACTIVITY",
    label: "Chianti vineyard tour",
    detail: "Bonvoy Tours — full day, estate lunch",
    price: 145,
    currency: "USD",
    bonvoyPoints: 725,
    provenance: "BONVOY_TOURS",
  },
];

beforeEach(() => {
  repo = new InMemoryItineraryRepository();
});

describe("SqliteItineraryRepository", () => {
  it("creates and retrieves a draft by ID", async () => {
    const draft = await repo.create({
      draftId: "draft-lucca-sept-2099",
      conversationId: "conv-abc-123456",
      userId: undefined,
      destination: "Lucca, Italy",
      checkIn: "2099-09-10",
      checkOut: "2099-09-14",
      status: "DRAFT",
      items: ITEMS,
      totalUSD: 2510,
      totalBonvoyPoints: 12550,
    });
    expect(draft.draftId).toBe("draft-lucca-sept-2099");
    expect(draft.status).toBe("DRAFT");

    const fetched = await repo.findById("draft-lucca-sept-2099");
    expect(fetched).not.toBeNull();
    expect(fetched?.destination).toBe("Lucca, Italy");
    expect(fetched?.items).toHaveLength(2);
    expect(fetched?.items[0]?.provenance).toBe("HVMI");
  });

  it("finds a draft by conversationId", async () => {
    await repo.create({
      draftId: "draft-conv-001",
      conversationId: "conv-xyz-999",
      destination: "Tuscany",
      checkIn: "2099-10-01",
      checkOut: "2099-10-07",
      status: "DRAFT",
      items: [],
      totalUSD: 0,
      totalBonvoyPoints: 0,
    });
    const found = await repo.findByConversationId("conv-xyz-999");
    expect(found).not.toBeNull();
    expect(found?.draftId).toBe("draft-conv-001");
  });

  it("returns null for unknown draftId", async () => {
    const result = await repo.findById("nonexistent-draft-id");
    expect(result).toBeNull();
  });

  it("accepts a draft and records acceptedAt", async () => {
    await repo.create({
      draftId: "draft-accept-001",
      conversationId: "conv-accept-001",
      destination: "Rome",
      checkIn: "2099-11-01",
      checkOut: "2099-11-05",
      status: "DRAFT",
      items: [],
      totalUSD: 1200,
      totalBonvoyPoints: 6000,
    });

    const accepted = await repo.accept("draft-accept-001", "booking-rome-001");
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.acceptedAt).toBeDefined();
    expect(accepted.bookingId).toBe("booking-rome-001");
  });

  it("abandons a draft", async () => {
    await repo.create({
      draftId: "draft-abandon-001",
      conversationId: "conv-abandon-001",
      destination: "Milan",
      checkIn: "2099-12-01",
      checkOut: "2099-12-04",
      status: "DRAFT",
      items: [],
      totalUSD: 800,
      totalBonvoyPoints: 4000,
    });
    await repo.abandon("draft-abandon-001");
    const draft = await repo.findById("draft-abandon-001");
    expect(draft?.status).toBe("ABANDONED");
  });

  it("updates items on an existing draft", async () => {
    await repo.create({
      draftId: "draft-update-001",
      conversationId: "conv-update-001",
      destination: "Florence",
      checkIn: "2099-09-20",
      checkOut: "2099-09-23",
      status: "DRAFT",
      items: [],
      totalUSD: 0,
      totalBonvoyPoints: 0,
    });
    const updated = await repo.update("draft-update-001", {
      items: [{ date: "2099-09-20", type: "ACTIVITY", label: "Uffizi Gallery", price: 25, currency: "EUR" }],
      totalUSD: 25,
      totalBonvoyPoints: 125,
    });
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]?.label).toBe("Uffizi Gallery");
  });
});
