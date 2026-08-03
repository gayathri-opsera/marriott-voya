/**
 * SQLite implementation of ItineraryRepository — WOREF-029
 * Kept in a separate file so tests can import InMemoryItineraryRepository
 * without triggering the node:sqlite module load.
 */

import { DatabaseSync } from "node:sqlite";
import type { ItineraryRepository, ItineraryDraftRecord, ItineraryDayItem, DraftStatus } from "./ItineraryRepository.js";

export class SqliteItineraryRepository implements ItineraryRepository {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS itinerary_drafts (
        draft_id         TEXT NOT NULL PRIMARY KEY,
        conversation_id  TEXT NOT NULL,
        user_id          TEXT,
        destination      TEXT NOT NULL,
        check_in         TEXT NOT NULL,
        check_out        TEXT NOT NULL,
        status           TEXT NOT NULL DEFAULT 'DRAFT',
        total_usd        REAL NOT NULL DEFAULT 0,
        total_points     INTEGER NOT NULL DEFAULT 0,
        items_json       TEXT NOT NULL DEFAULT '[]',
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL,
        accepted_at      TEXT,
        booking_id       TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_drafts_conversation_id ON itinerary_drafts (conversation_id);
      CREATE INDEX IF NOT EXISTS idx_drafts_user_id         ON itinerary_drafts (user_id);
    `);
  }

  async create(draft: Omit<ItineraryDraftRecord, "createdAt" | "updatedAt">): Promise<ItineraryDraftRecord> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO itinerary_drafts
        (draft_id, conversation_id, user_id, destination, check_in, check_out,
         status, total_usd, total_points, items_json, created_at, updated_at, accepted_at, booking_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      draft.draftId, draft.conversationId, draft.userId ?? null,
      draft.destination, draft.checkIn, draft.checkOut, draft.status,
      draft.totalUSD, draft.totalBonvoyPoints,
      JSON.stringify(draft.items ?? []),
      now, now, draft.acceptedAt ?? null, draft.bookingId ?? null,
    );
    return { ...draft, createdAt: now, updatedAt: now };
  }

  async update(draftId: string, updates: Partial<ItineraryDraftRecord>): Promise<ItineraryDraftRecord> {
    const existing = await this.findById(draftId);
    if (!existing) throw new Error(`Itinerary draft ${draftId} not found`);
    const now = new Date().toISOString();
    const merged: ItineraryDraftRecord = { ...existing, ...updates, updatedAt: now };
    const stmt = this.db.prepare(`
      UPDATE itinerary_drafts
         SET destination=?, check_in=?, check_out=?, status=?,
             total_usd=?, total_points=?, items_json=?,
             updated_at=?, accepted_at=?, booking_id=?
       WHERE draft_id=?
    `);
    stmt.run(
      merged.destination, merged.checkIn, merged.checkOut, merged.status,
      merged.totalUSD, merged.totalBonvoyPoints, JSON.stringify(merged.items ?? []),
      merged.updatedAt, merged.acceptedAt ?? null, merged.bookingId ?? null, draftId,
    );
    return merged;
  }

  async findById(draftId: string): Promise<ItineraryDraftRecord | null> {
    const stmt = this.db.prepare("SELECT * FROM itinerary_drafts WHERE draft_id=?");
    const row = stmt.get(draftId) as Record<string, unknown> | undefined;
    return row ? this.rowToRecord(row) : null;
  }

  async findByConversationId(conversationId: string): Promise<ItineraryDraftRecord | null> {
    const stmt = this.db.prepare(
      "SELECT * FROM itinerary_drafts WHERE conversation_id=? ORDER BY created_at DESC LIMIT 1",
    );
    const row = stmt.get(conversationId) as Record<string, unknown> | undefined;
    return row ? this.rowToRecord(row) : null;
  }

  async findByUserId(userId: string): Promise<ItineraryDraftRecord[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM itinerary_drafts WHERE user_id=? ORDER BY created_at DESC",
    );
    return (stmt.all(userId) as Record<string, unknown>[]).map((r) => this.rowToRecord(r));
  }

  async accept(draftId: string, bookingId?: string): Promise<ItineraryDraftRecord> {
    return this.update(draftId, { status: "ACCEPTED", acceptedAt: new Date().toISOString(), bookingId });
  }

  async abandon(draftId: string): Promise<void> {
    await this.update(draftId, { status: "ABANDONED" });
  }

  private rowToRecord(row: Record<string, unknown>): ItineraryDraftRecord {
    let items: ItineraryDayItem[] = [];
    try { items = JSON.parse(row["items_json"] as string) as ItineraryDayItem[]; } catch { /* empty */ }
    return {
      draftId:           row["draft_id"] as string,
      conversationId:    row["conversation_id"] as string,
      userId:            row["user_id"] as string | undefined,
      destination:       row["destination"] as string,
      checkIn:           row["check_in"] as string,
      checkOut:          row["check_out"] as string,
      status:            row["status"] as DraftStatus,
      totalUSD:          row["total_usd"] as number,
      totalBonvoyPoints: row["total_points"] as number,
      items,
      createdAt:         row["created_at"] as string,
      updatedAt:         row["updated_at"] as string,
      acceptedAt:        row["accepted_at"] as string | undefined,
      bookingId:         row["booking_id"] as string | undefined,
    };
  }
}
