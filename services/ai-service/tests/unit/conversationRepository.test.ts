/**
 * Unit tests for ConversationRepository — WO-007
 *
 * Tests cover:
 * - Conversation creation (authenticated + anonymous)
 * - Message append ordering
 * - Stream finalization
 * - Interrupted stream state handling
 * - History recovery in sequence order
 * - Duplicate idempotency key handling (metadata)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryConversationRepository } from "../../src/domain/ConversationRepository.js";
import type { ConversationRepository } from "../../src/domain/ConversationRepository.js";

describe("InMemoryConversationRepository", () => {
  let repo: ConversationRepository;

  beforeEach(() => {
    repo = new InMemoryConversationRepository();
  });

  describe("create", () => {
    it("creates an authenticated conversation", async () => {
      const conv = await repo.create({
        userId: "user-123",
        clientSessionId: "client-abc",
        correlationId: "corr-001",
      });
      expect(conv.id).toBeTruthy();
      expect(conv.userId).toBe("user-123");
      expect(conv.clientSessionId).toBe("client-abc");
      expect(conv.status).toBe("active");
      expect(conv.createdAt).toBeInstanceOf(Date);
    });

    it("creates an anonymous conversation with no userId", async () => {
      const conv = await repo.create({
        clientSessionId: "anon-sess-xyz",
        correlationId: "corr-002",
      });
      expect(conv.userId).toBeNull();
      expect(conv.clientSessionId).toBe("anon-sess-xyz");
    });

    it("each conversation gets a unique ID", async () => {
      const c1 = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const c2 = await repo.create({ clientSessionId: "s2", correlationId: "c2" });
      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe("findById", () => {
    it("returns null for non-existent conversation", async () => {
      expect(await repo.findById("does-not-exist")).toBeNull();
    });

    it("returns the created conversation by ID", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const found = await repo.findById(conv.id);
      expect(found?.id).toBe(conv.id);
    });
  });

  describe("appendMessage", () => {
    it("appends a user message with sequence 0", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const msg = await repo.appendMessage({
        conversationId: conv.id,
        role: "user",
        content: "Hello",
        status: "completed",
        sequence: 0,
        correlationId: "c1",
      });
      expect(msg.role).toBe("user");
      expect(msg.sequence).toBe(0);
      expect(msg.status).toBe("completed");
      expect(msg.completedAt).toBeInstanceOf(Date);
    });

    it("appends a streaming assistant message with no completedAt", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const msg = await repo.appendMessage({
        conversationId: conv.id,
        role: "assistant",
        content: "",
        status: "streaming",
        sequence: 1,
        correlationId: "c1",
      });
      expect(msg.status).toBe("streaming");
      expect(msg.completedAt).toBeNull();
    });

    it("preserves message metadata including idempotencyKey", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const msg = await repo.appendMessage({
        conversationId: conv.id,
        role: "user",
        content: "Book a villa",
        status: "completed",
        sequence: 0,
        correlationId: "c1",
        metadata: { idempotencyKey: "idem-abc-123" },
      });
      expect(msg.metadata["idempotencyKey"]).toBe("idem-abc-123");
    });
  });

  describe("finalizeMessage", () => {
    it("updates content, token counts, and status to completed", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const pending = await repo.appendMessage({
        conversationId: conv.id,
        role: "assistant",
        content: "",
        status: "streaming",
        sequence: 1,
        correlationId: "c1",
      });
      const final = await repo.finalizeMessage({
        messageId: pending.id,
        content: "Here are the best HVMI villas in Lucca...",
        tokenInput: 250,
        tokenOutput: 480,
      });
      expect(final.status).toBe("completed");
      expect(final.content).toBe("Here are the best HVMI villas in Lucca...");
      expect(final.tokenInput).toBe(250);
      expect(final.tokenOutput).toBe(480);
      expect(final.completedAt).toBeInstanceOf(Date);
    });

    it("throws if message not found", async () => {
      await expect(
        repo.finalizeMessage({ messageId: "ghost-id", content: "", tokenInput: 0, tokenOutput: 0 }),
      ).rejects.toThrow();
    });
  });

  describe("markInterrupted", () => {
    it("marks a streaming message as interrupted", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const msg = await repo.appendMessage({
        conversationId: conv.id,
        role: "assistant",
        content: "I was about to",
        status: "streaming",
        sequence: 1,
        correlationId: "c1",
      });
      const interrupted = await repo.markInterrupted(msg.id);
      expect(interrupted.status).toBe("interrupted");
    });

    it("throws if message not found", async () => {
      await expect(repo.markInterrupted("ghost-id")).rejects.toThrow();
    });
  });

  describe("getHistory", () => {
    it("returns messages in ascending sequence order", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });

      // Append out of sequence deliberately
      await repo.appendMessage({ conversationId: conv.id, role: "assistant", content: "Hi!", status: "completed", sequence: 1, correlationId: "c1" });
      await repo.appendMessage({ conversationId: conv.id, role: "user", content: "Hello", status: "completed", sequence: 0, correlationId: "c1" });

      const history = await repo.getHistory(conv.id);
      expect(history[0]?.sequence).toBe(0);
      expect(history[1]?.sequence).toBe(1);
    });

    it("returns empty array for conversation with no messages", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      expect(await repo.getHistory(conv.id)).toEqual([]);
    });

    it("only returns messages for the specified conversation", async () => {
      const c1 = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const c2 = await repo.create({ clientSessionId: "s2", correlationId: "c2" });
      await repo.appendMessage({ conversationId: c1.id, role: "user", content: "A", status: "completed", sequence: 0, correlationId: "c1" });
      await repo.appendMessage({ conversationId: c2.id, role: "user", content: "B", status: "completed", sequence: 0, correlationId: "c2" });

      const h1 = await repo.getHistory(c1.id);
      expect(h1).toHaveLength(1);
      expect(h1[0]?.content).toBe("A");
    });

    it("includes interrupted assistant turns in history", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      await repo.appendMessage({ conversationId: conv.id, role: "user", content: "Q", status: "completed", sequence: 0, correlationId: "c1" });
      const partial = await repo.appendMessage({ conversationId: conv.id, role: "assistant", content: "Par", status: "streaming", sequence: 1, correlationId: "c1" });
      await repo.markInterrupted(partial.id);

      const history = await repo.getHistory(conv.id);
      expect(history).toHaveLength(2);
      expect(history[1]?.status).toBe("interrupted");
    });
  });

  describe("setStatus", () => {
    it("updates conversation status to completed", async () => {
      const conv = await repo.create({ clientSessionId: "s1", correlationId: "c1" });
      const updated = await repo.setStatus(conv.id, "completed");
      expect(updated.status).toBe("completed");
    });

    it("throws if conversation not found", async () => {
      await expect(repo.setStatus("ghost", "completed")).rejects.toThrow();
    });
  });
});
