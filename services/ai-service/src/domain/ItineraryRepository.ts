/**
 * Itinerary Draft Persistence — WOREF-029
 *
 * Interfaces and in-memory implementation for itinerary draft storage.
 * SQLite implementation is in SqliteItineraryRepository.ts (separate file
 * to avoid importing node:sqlite in test environments).
 */

export interface ItineraryDayItem {
  date: string;
  type: "ACCOMMODATION" | "ACTIVITY" | "FLIGHT" | "TRANSPORT" | "DINING" | "FREE_TIME";
  label: string;
  detail?: string;
  propertyId?: string;
  offerId?: string;
  price?: number;
  currency?: string;
  bonvoyPoints?: number;
  provenance?: "HVMI" | "MARRIOTT" | "BONVOY_TOURS" | "LOCAL" | "ILLUSTRATIVE";
}

export type DraftStatus = "DRAFT" | "ACCEPTED" | "BOOKED" | "ABANDONED";

export interface ItineraryDraftRecord {
  draftId: string;
  conversationId: string;
  userId?: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  status: DraftStatus;
  totalUSD: number;
  totalBonvoyPoints: number;
  items: ItineraryDayItem[];
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  bookingId?: string;
}

export interface ItineraryRepository {
  create(draft: Omit<ItineraryDraftRecord, "createdAt" | "updatedAt">): Promise<ItineraryDraftRecord>;
  update(draftId: string, updates: Partial<ItineraryDraftRecord>): Promise<ItineraryDraftRecord>;
  findByConversationId(conversationId: string): Promise<ItineraryDraftRecord | null>;
  findByUserId(userId: string): Promise<ItineraryDraftRecord[]>;
  findById(draftId: string): Promise<ItineraryDraftRecord | null>;
  accept(draftId: string, bookingId?: string): Promise<ItineraryDraftRecord>;
  abandon(draftId: string): Promise<void>;
}

// ─── In-Memory Implementation (for testing) ──────────────────────────────────

export class InMemoryItineraryRepository implements ItineraryRepository {
  private store = new Map<string, ItineraryDraftRecord>();
  private convIndex = new Map<string, string>();

  async create(draft: Omit<ItineraryDraftRecord, "createdAt" | "updatedAt">): Promise<ItineraryDraftRecord> {
    const now = new Date().toISOString();
    const record: ItineraryDraftRecord = { ...draft, createdAt: now, updatedAt: now };
    this.store.set(draft.draftId, record);
    this.convIndex.set(draft.conversationId, draft.draftId);
    return record;
  }

  async update(draftId: string, updates: Partial<ItineraryDraftRecord>): Promise<ItineraryDraftRecord> {
    const existing = await this.findById(draftId);
    if (!existing) throw new Error(`Draft ${draftId} not found`);
    const merged: ItineraryDraftRecord = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(draftId, merged);
    return merged;
  }

  async findById(draftId: string): Promise<ItineraryDraftRecord | null> {
    return this.store.get(draftId) ?? null;
  }

  async findByConversationId(conversationId: string): Promise<ItineraryDraftRecord | null> {
    const draftId = this.convIndex.get(conversationId);
    return draftId ? (this.store.get(draftId) ?? null) : null;
  }

  async findByUserId(userId: string): Promise<ItineraryDraftRecord[]> {
    return [...this.store.values()].filter((d) => d.userId === userId);
  }

  async accept(draftId: string, bookingId?: string): Promise<ItineraryDraftRecord> {
    return this.update(draftId, { status: "ACCEPTED", acceptedAt: new Date().toISOString(), bookingId });
  }

  async abandon(draftId: string): Promise<void> {
    await this.update(draftId, { status: "ABANDONED" });
  }
}
