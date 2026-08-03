/**
 * SqliteConversationRepository — WO-007
 *
 * SQLite-backed conversation persistence using Node.js built-in node:sqlite.
 * PostgreSQL is authoritative in production; this implementation allows
 * the service to run locally and in CI without external infrastructure.
 *
 * Schema is created on first connection (auto-migrate on start).
 * The schema is intentionally minimal — no Prisma dependency required.
 */

import { DatabaseSync } from "node:sqlite";
import type {
  ConversationRepository,
  ConversationRecord,
  MessageRecord,
  CreateConversationInput,
  AppendMessageInput,
  FinalizeMessageInput,
  ConversationStatus,
} from "./ConversationRepository.js";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id            TEXT PRIMARY KEY,
  user_id       TEXT,
  client_session_id TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  correlation_id TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL REFERENCES conversations(id),
  role             TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending',
  sequence         INTEGER NOT NULL,
  token_input      INTEGER,
  token_output     INTEGER,
  metadata         TEXT NOT NULL DEFAULT '{}',
  correlation_id   TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  completed_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, sequence);
`;

function toConversationRecord(row: Record<string, unknown>): ConversationRecord {
  return {
    id: row["id"] as string,
    userId: (row["user_id"] as string | null) ?? null,
    clientSessionId: row["client_session_id"] as string,
    status: row["status"] as ConversationStatus,
    correlationId: row["correlation_id"] as string,
    createdAt: new Date(row["created_at"] as string),
    updatedAt: new Date(row["updated_at"] as string),
  };
}

function toMessageRecord(row: Record<string, unknown>): MessageRecord {
  return {
    id: row["id"] as string,
    conversationId: row["conversation_id"] as string,
    role: row["role"] as MessageRecord["role"],
    content: row["content"] as string,
    status: row["status"] as MessageRecord["status"],
    sequence: row["sequence"] as number,
    tokenInput: (row["token_input"] as number | null) ?? null,
    tokenOutput: (row["token_output"] as number | null) ?? null,
    metadata: JSON.parse((row["metadata"] as string) || "{}"),
    correlationId: row["correlation_id"] as string,
    createdAt: new Date(row["created_at"] as string),
    completedAt: row["completed_at"] ? new Date(row["completed_at"] as string) : null,
  };
}

export class SqliteConversationRepository implements ConversationRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath: string = ":memory:") {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(SCHEMA_SQL);
  }

  async create(input: CreateConversationInput): Promise<ConversationRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO conversations (id, user_id, client_session_id, status, correlation_id, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, ?)`,
      )
      .run(id, input.userId ?? null, input.clientSessionId, input.correlationId, now, now);
    return toConversationRecord({
      id,
      user_id: input.userId ?? null,
      client_session_id: input.clientSessionId,
      status: "active",
      correlation_id: input.correlationId,
      created_at: now,
      updated_at: now,
    });
  }

  async findById(id: string): Promise<ConversationRecord | null> {
    const row = this.db
      .prepare(`SELECT * FROM conversations WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined;
    return row ? toConversationRecord(row) : null;
  }

  async appendMessage(input: AppendMessageInput): Promise<MessageRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const completedAt =
      input.status === "completed" || input.status === "interrupted" ? now : null;
    this.db
      .prepare(
        `INSERT INTO messages (id, conversation_id, role, content, status, sequence, token_input, token_output, metadata, correlation_id, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.conversationId,
        input.role,
        input.content,
        input.status,
        input.sequence,
        input.tokenInput ?? null,
        input.tokenOutput ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.correlationId,
        now,
        completedAt,
      );
    return toMessageRecord({
      id,
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      status: input.status,
      sequence: input.sequence,
      token_input: input.tokenInput ?? null,
      token_output: input.tokenOutput ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      correlation_id: input.correlationId,
      created_at: now,
      completed_at: completedAt,
    });
  }

  async finalizeMessage(input: FinalizeMessageInput): Promise<MessageRecord> {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(
        `UPDATE messages SET content = ?, status = 'completed', token_input = ?, token_output = ?, completed_at = ?
         WHERE id = ?`,
      )
      .run(input.content, input.tokenInput, input.tokenOutput, now, input.messageId);
    if (!result.changes) throw new Error(`Message not found: ${input.messageId}`);
    const row = this.db
      .prepare(`SELECT * FROM messages WHERE id = ?`)
      .get(input.messageId) as Record<string, unknown>;
    return toMessageRecord(row);
  }

  async markInterrupted(messageId: string): Promise<MessageRecord> {
    const now = new Date().toISOString();
    const result = this.db
      .prepare(`UPDATE messages SET status = 'interrupted', completed_at = ? WHERE id = ?`)
      .run(now, messageId);
    if (!result.changes) throw new Error(`Message not found: ${messageId}`);
    const row = this.db
      .prepare(`SELECT * FROM messages WHERE id = ?`)
      .get(messageId) as Record<string, unknown>;
    return toMessageRecord(row);
  }

  async getHistory(conversationId: string): Promise<MessageRecord[]> {
    const rows = this.db
      .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY sequence ASC`)
      .all(conversationId) as Record<string, unknown>[];
    return rows.map(toMessageRecord);
  }

  async setStatus(conversationId: string, status: ConversationStatus): Promise<ConversationRecord> {
    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, now, conversationId);
    const row = this.db
      .prepare(`SELECT * FROM conversations WHERE id = ?`)
      .get(conversationId) as Record<string, unknown>;
    return toConversationRecord(row);
  }

  /** Close the database connection (for tests and cleanup). */
  close(): void {
    this.db.close();
  }
}
