/**
 * Conversation API Contracts — WO-007
 *
 * Zod schemas for the durable conversation REST API surface.
 * These describe the wire format for creating conversations,
 * streaming messages, and recovering history after page refresh.
 */

import { z } from "zod";
import { isoDateTimeString } from "../common/primitives.js";

// ─── Create Conversation ──────────────────────────────────────────────────────

export const CreateConversationRequestSchema = z.object({
  userId: z.string().min(1).optional(),
  clientSessionId: z.string().min(1).optional(),
  initialPrompt: z.string().max(2000).optional(),
});
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

export const CreateConversationResponseSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(["active", "completed", "abandoned", "expired"]),
  createdAt: isoDateTimeString,
  nextAction: z.literal("stream"),
});
export type CreateConversationResponse = z.infer<typeof CreateConversationResponseSchema>;

// ─── Message Stream Request ───────────────────────────────────────────────────

export const StreamMessageRequestSchema = z.object({
  content: z.string().min(1).max(5000),
  idempotencyKey: z.string().min(1).optional(),
  tripContext: z.record(z.string(), z.unknown()).optional(),
});
export type StreamMessageRequest = z.infer<typeof StreamMessageRequestSchema>;

// ─── Message Record (wire format) ────────────────────────────────────────────

export const ConversationMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string(),
  status: z.enum(["pending", "streaming", "completed", "interrupted", "failed"]),
  sequence: z.number().int().nonnegative(),
  createdAt: isoDateTimeString,
  completedAt: isoDateTimeString.optional(),
  correlationId: z.string().min(1),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// ─── Conversation History Response ───────────────────────────────────────────

export const ConversationHistoryResponseSchema = z.object({
  conversationId: z.string().min(1),
  messages: z.array(ConversationMessageSchema),
  total: z.number().int().nonnegative(),
});
export type ConversationHistoryResponse = z.infer<typeof ConversationHistoryResponseSchema>;

// ─── SSE Event types ──────────────────────────────────────────────────────────

/** Acknowledgement event — user turn persisted, streaming about to begin. */
export const SseAcknowledgedEventSchema = z.object({
  type: z.literal("acknowledged"),
  messageId: z.string().min(1),
  correlationId: z.string().min(1),
});

/** Streaming token event. */
export const SseTokenEventSchema = z.object({
  type: z.literal("token"),
  content: z.string(),
  correlationId: z.string().min(1),
});

/** Tool invocation status event. */
export const SseToolStatusEventSchema = z.object({
  type: z.literal("toolStatus"),
  toolName: z.string().min(1),
  toolUseId: z.string().min(1),
  status: z.enum(["started", "done"]).optional(),
  correlationId: z.string().min(1),
});

/** Stream completed and assistant turn finalized. */
export const SseCompletedEventSchema = z.object({
  type: z.literal("completed"),
  messageId: z.string().min(1),
  usage: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  }),
  correlationId: z.string().min(1),
});

/** Recoverable error — interrupted assistant turn is marked in DB. */
export const SseErrorEventSchema = z.object({
  type: z.literal("error"),
  code: z.string().min(1),
  message: z.string().min(1),
  correlationId: z.string().min(1),
  recoverable: z.boolean().optional(),
});

export type SseAcknowledgedEvent = z.infer<typeof SseAcknowledgedEventSchema>;
export type SseTokenEvent = z.infer<typeof SseTokenEventSchema>;
export type SseToolStatusEvent = z.infer<typeof SseToolStatusEventSchema>;
export type SseCompletedEvent = z.infer<typeof SseCompletedEventSchema>;
export type SseErrorEvent = z.infer<typeof SseErrorEventSchema>;
