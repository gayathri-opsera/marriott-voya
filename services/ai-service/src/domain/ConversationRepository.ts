/**
 * ConversationRepository — WO-007: Durable persistence interface for
 * streaming concierge conversations.
 *
 * Abstracts the persistence layer so both SQLite (development) and
 * PostgreSQL (production) can back the same service logic without changes.
 * InMemoryConversationRepository is always available for unit tests.
 */

export type ConversationStatus = "active" | "completed" | "abandoned" | "expired";
export type MessageRole = "user" | "assistant" | "tool";
export type MessageStatus = "pending" | "streaming" | "completed" | "interrupted" | "failed";

export interface ConversationRecord {
  id: string;
  /** null for anonymous sessions */
  userId: string | null;
  /** Stable anonymous client reference for pre-login sessions */
  clientSessionId: string;
  status: ConversationStatus;
  correlationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  /** 0-indexed sequence within the conversation */
  sequence: number;
  tokenInput: number | null;
  tokenOutput: number | null;
  metadata: Record<string, unknown>;
  correlationId: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface CreateConversationInput {
  userId?: string | null;
  clientSessionId: string;
  correlationId: string;
  initialPrompt?: string;
}

export interface AppendMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  sequence: number;
  correlationId: string;
  tokenInput?: number;
  tokenOutput?: number;
  metadata?: Record<string, unknown>;
}

export interface FinalizeMessageInput {
  messageId: string;
  content: string;
  tokenInput: number;
  tokenOutput: number;
}

export interface ConversationRepository {
  /** Create a new durable conversation. */
  create(input: CreateConversationInput): Promise<ConversationRecord>;

  /** Load a conversation by ID. Returns null if not found. */
  findById(id: string): Promise<ConversationRecord | null>;

  /** Append a message to an existing conversation. */
  appendMessage(input: AppendMessageInput): Promise<MessageRecord>;

  /** Update message content and token counts on stream completion. */
  finalizeMessage(input: FinalizeMessageInput): Promise<MessageRecord>;

  /** Mark an in-flight assistant message as interrupted. */
  markInterrupted(messageId: string): Promise<MessageRecord>;

  /** Return all messages for a conversation in sequence order. */
  getHistory(conversationId: string): Promise<MessageRecord[]>;

  /** Mark conversation status. */
  setStatus(conversationId: string, status: ConversationStatus): Promise<ConversationRecord>;
}

// ─── In-memory implementation for unit tests ─────────────────────────────────

export class InMemoryConversationRepository implements ConversationRepository {
  private conversations = new Map<string, ConversationRecord>();
  private messages = new Map<string, MessageRecord>();

  async create(input: CreateConversationInput): Promise<ConversationRecord> {
    const now = new Date();
    const rec: ConversationRecord = {
      id: crypto.randomUUID(),
      userId: input.userId ?? null,
      clientSessionId: input.clientSessionId,
      status: "active",
      correlationId: input.correlationId,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(rec.id, rec);
    return rec;
  }

  async findById(id: string): Promise<ConversationRecord | null> {
    return this.conversations.get(id) ?? null;
  }

  async appendMessage(input: AppendMessageInput): Promise<MessageRecord> {
    const now = new Date();
    const msg: MessageRecord = {
      id: crypto.randomUUID(),
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      status: input.status,
      sequence: input.sequence,
      tokenInput: input.tokenInput ?? null,
      tokenOutput: input.tokenOutput ?? null,
      metadata: input.metadata ?? {},
      correlationId: input.correlationId,
      createdAt: now,
      completedAt: input.status === "completed" ? now : null,
    };
    this.messages.set(msg.id, msg);
    return msg;
  }

  async finalizeMessage(input: FinalizeMessageInput): Promise<MessageRecord> {
    const msg = this.messages.get(input.messageId);
    if (!msg) throw new Error(`Message not found: ${input.messageId}`);
    const updated: MessageRecord = {
      ...msg,
      content: input.content,
      status: "completed",
      tokenInput: input.tokenInput,
      tokenOutput: input.tokenOutput,
      completedAt: new Date(),
    };
    this.messages.set(msg.id, updated);
    return updated;
  }

  async markInterrupted(messageId: string): Promise<MessageRecord> {
    const msg = this.messages.get(messageId);
    if (!msg) throw new Error(`Message not found: ${messageId}`);
    const updated: MessageRecord = { ...msg, status: "interrupted" };
    this.messages.set(msg.id, updated);
    return updated;
  }

  async getHistory(conversationId: string): Promise<MessageRecord[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async setStatus(conversationId: string, status: ConversationStatus): Promise<ConversationRecord> {
    const conv = this.conversations.get(conversationId);
    if (!conv) throw new Error(`Conversation not found: ${conversationId}`);
    const updated = { ...conv, status, updatedAt: new Date() };
    this.conversations.set(conversationId, updated);
    return updated;
  }
}
