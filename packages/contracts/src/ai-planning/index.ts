/**
 * AI Planning State Contracts — WO-001
 *
 * Shared Zod schemas for durable AI planning state used by the frontend,
 * ai-service, and ai-orchestration. Every service validates and types
 * planning sessions, conversation turns, agent outputs, tool results,
 * itinerary drafts, and revisions from this single authority.
 *
 * Three P0 flow types are modelled:
 *   ACCOMMODATION_LED  — Flow 1: browse → property → AI trip suggestions
 *   INTENT_LED         — Flow 2: "I want to visit Disneyland Paris"
 *   FREE_FORM_DISCOVERY — Flow 3: "I want a honeymoon destination with villas"
 *
 * Marriott sourcing rules:
 *   HVMI > MARRIOTT_HOTEL > MARRIOTT_PARTNER > NON_PARTNER (non-bookable)
 */

import { z } from "zod";
import { isoDateTimeString, isoDateString } from "../common/primitives.js";

// ─── Enumerations ─────────────────────────────────────────────────────────────

/** The three P0 AI planning entry flows. */
export const PlanningFlowTypeSchema = z.enum([
  "ACCOMMODATION_LED",
  "INTENT_LED",
  "FREE_FORM_DISCOVERY",
]);
export type PlanningFlowType = z.infer<typeof PlanningFlowTypeSchema>;

/** Lifecycle of a planning session. */
export const PlanningSessionStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "ABANDONED",
  "EXPIRED",
]);
export type PlanningSessionStatus = z.infer<typeof PlanningSessionStatusSchema>;

/** Speaker role within a conversation turn. */
export const ConversationRoleSchema = z.enum([
  "user",
  "assistant",
  "system",
  "tool",
]);
export type ConversationRole = z.infer<typeof ConversationRoleSchema>;

/**
 * The ten canonical agent names used by the orchestrator.
 * Any agent output that does not match these names is rejected as unknown.
 */
export const AgentNameSchema = z.enum([
  "safety",
  "accommodation",
  "restaurant",
  "attraction",
  "activity",
  "local_transport",
  "weather",
  "flight",
  "budget",
  "itinerary",
]);
export type AgentName = z.infer<typeof AgentNameSchema>;

/** Outcome states for an individual agent execution. */
export const AgentOutputStatusSchema = z.enum([
  "success",
  "skipped",
  "blocked",
  "degraded",
  "timeout",
  "failed",
]);
export type AgentOutputStatus = z.infer<typeof AgentOutputStatusSchema>;

/**
 * Extended provenance vocabulary that includes Marriott ecosystem sources.
 * Extends the base ProvenanceSchema by adding HVMI and hotel tiers.
 */
export const AiProvenanceSchema = z.enum([
  "HVMI",             // Homes & Villas by Marriott International — highest priority
  "MARRIOTT_HOTEL",   // Traditional Marriott-branded hotel or resort
  "MARRIOTT_PARTNER", // Marriott-endorsed partner inventory
  "AMADEUS",          // GDS-sourced availability
  "RAPIDAPI_HOTEL",
  "RAPIDAPI_CAR",
  "BONVOY_TOURS",     // Marriott Bonvoy Tours & Activities
  "GOOGLE_PLACES",    // Attractions/restaurant data
  "WEATHER_SERVICE",  // Weather forecast provider
  "ILLUSTRATIVE",     // Synthetic/demo — always non-bookable
]);
export type AiProvenance = z.infer<typeof AiProvenanceSchema>;

/** Set of provenance values that represent real bookable Marriott inventory. */
export const MARRIOTT_BOOKABLE_PROVENANCES: ReadonlySet<AiProvenance> = new Set<AiProvenance>([
  "HVMI",
  "MARRIOTT_HOTEL",
  "MARRIOTT_PARTNER",
  "AMADEUS",
  "RAPIDAPI_HOTEL",
  "RAPIDAPI_CAR",
]);

/** Data sensitivity classification for field-level access control. */
export const DataClassificationSchema = z.enum([
  "PUBLIC",
  "INTERNAL",
  "RESTRICTED",  // PII or sensitive travel data
  "CONFIDENTIAL", // Payment or credential data
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

/** Lifecycle of an itinerary draft. */
export const ItineraryDraftStatusSchema = z.enum([
  "DRAFT",
  "ACCEPTED",
  "EXPIRED",
]);
export type ItineraryDraftStatus = z.infer<typeof ItineraryDraftStatusSchema>;

/** Item categories within a day of an itinerary. */
export const ItineraryItemTypeSchema = z.enum([
  "ACCOMMODATION",
  "FLIGHT",
  "ACTIVITY",
  "TRANSPORT",
  "RESTAURANT",
  "NOTE",
]);
export type ItineraryItemType = z.infer<typeof ItineraryItemTypeSchema>;

// ─── Actor Reference ──────────────────────────────────────────────────────────

/**
 * Identifies the human actor in a planning session.
 * Anonymous sessions must provide a stable anonymousId so state can be
 * recovered before the traveler signs in.
 */
export const ActorReferenceSchema = z
  .object({
    type: z.enum(["authenticated", "anonymous"]),
    userId: z.string().min(1).optional(),
    anonymousId: z.string().min(1).optional(),
  })
  .refine(
    (a) =>
      (a.type === "anonymous" && !!a.anonymousId) ||
      (a.type === "authenticated" && !!a.userId),
    {
      message:
        "authenticated actors require userId; anonymous actors require anonymousId",
    },
  );
export type ActorReference = z.infer<typeof ActorReferenceSchema>;

// ─── Planning Session ─────────────────────────────────────────────────────────

export const PlanningSessionSchema = z.object({
  id: z.string().min(1),
  actor: ActorReferenceSchema,
  flowType: PlanningFlowTypeSchema,
  status: PlanningSessionStatusSchema,
  /** Correlation ID threads logs, events, and audit records across services. */
  correlationId: z.string().min(1),
  /** ID of the currently active itinerary draft, if one exists. */
  currentDraftId: z.string().min(1).optional(),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
  /** Untyped bag for future extensibility — keep small. */
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type PlanningSession = z.infer<typeof PlanningSessionSchema>;

// ─── Conversation Turn ────────────────────────────────────────────────────────

export const ConversationTurnSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  role: ConversationRoleSchema,
  /** Raw text of the message. Must not contain PII in RESTRICTED or above. */
  content: z.string().min(1),
  /** 1-indexed position within the session — must be monotonically increasing. */
  sequence: z.number().int().nonnegative(),
  tokenUsage: z
    .object({
      input: z.number().int().nonnegative().optional(),
      output: z.number().int().nonnegative().optional(),
    })
    .optional(),
  /** INTERNAL by default; raise to RESTRICTED if turn contains travel PII. */
  classification: DataClassificationSchema.default("INTERNAL"),
  createdAt: isoDateTimeString,
  /** Set when streaming fully completes. Absent = still streaming. */
  completedAt: isoDateTimeString.optional(),
  /** True if the stream was interrupted before completedAt was set. */
  interrupted: z.boolean().optional(),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

// ─── Tool Result ──────────────────────────────────────────────────────────────

/**
 * A grounded result from an external tool call.
 * isMock=true means the result came from a fixture and is never bookable
 * even if bookable=true appears in the fixture data.
 */
export const ToolResultSchema = z.object({
  id: z.string().min(1),
  toolName: z.string().min(1),
  source: AiProvenanceSchema,
  freshnessAt: isoDateTimeString,
  expiresAt: isoDateTimeString.optional(),
  bookable: z.boolean(),
  isMock: z.boolean(),
  normalizedPayload: z.record(z.string(), z.unknown()),
  dataClassification: DataClassificationSchema.default("INTERNAL"),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

// ─── Agent Output ─────────────────────────────────────────────────────────────

/**
 * Structured output from one of the ten canonical planning agents.
 * Partial, failed, or superseded outputs remain representable so the
 * planning session transcript is never silently incomplete.
 */
export const AgentOutputSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  /** Tied to a specific conversation turn when available. */
  turnId: z.string().min(1).optional(),
  agentName: AgentNameSchema,
  status: AgentOutputStatusSchema,
  inputs: z.record(z.string(), z.unknown()),
  normalizedResult: z.record(z.string(), z.unknown()).optional(),
  toolResults: z.array(ToolResultSchema).optional(),
  /** 0–1 confidence in the normalizedResult quality. */
  confidence: z.number().min(0).max(1).optional(),
  provenance: AiProvenanceSchema.optional(),
  /** Human-readable error if status is failed/timeout/degraded. No stack traces. */
  errorSummary: z.string().max(500).optional(),
  createdAt: isoDateTimeString,
});
export type AgentOutput = z.infer<typeof AgentOutputSchema>;

// ─── Selected Offer Reference ─────────────────────────────────────────────────

/**
 * A traveler's chosen offer that is carried through to checkout.
 * Preserves bookability and freshness so the checkout gate can reject
 * expired or illustrative offers before any payment step.
 */
export const SelectedOfferReferenceSchema = z.object({
  offerId: z.string().min(1),
  provenance: AiProvenanceSchema,
  freshnessAt: isoDateTimeString,
  expiresAt: isoDateTimeString.optional(),
  bookable: z.boolean(),
  isMock: z.boolean(),
  offerType: ItineraryItemTypeSchema,
  priceSnapshot: z
    .object({
      amount: z.string().min(1),
      currency: z.string().length(3),
    })
    .optional(),
  dataClassification: DataClassificationSchema.default("INTERNAL"),
});
export type SelectedOfferReference = z.infer<typeof SelectedOfferReferenceSchema>;

// ─── Itinerary Day Item ───────────────────────────────────────────────────────

export const ItineraryDayItemSchema = z.object({
  id: z.string().min(1),
  type: ItineraryItemTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  /** Start time as HH:mm string within the day — optional if not yet scheduled. */
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm")
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "endTime must be HH:mm")
    .optional(),
  estimatedCost: z
    .object({
      amount: z.string().min(1),
      currency: z.string().length(3),
    })
    .optional(),
  /** Linked bookable or illustrative offer. */
  offerRef: SelectedOfferReferenceSchema.optional(),
  /** Human-readable source label shown in the UI (e.g. "Homes & Villas by Marriott"). */
  sourceLabel: z.string().optional(),
});
export type ItineraryDayItem = z.infer<typeof ItineraryDayItemSchema>;

// ─── Itinerary Draft ──────────────────────────────────────────────────────────

/**
 * A day-by-day trip plan produced by the itinerary assembly agent.
 * May exist before destination, dates, or travelers are fully known —
 * the orchestrator asks one follow-up question at a time and updates
 * the draft as answers arrive.
 */
export const ItineraryDraftSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  destination: z.string().optional(),
  checkIn: isoDateString.optional(),
  checkOut: isoDateString.optional(),
  travelers: z.number().int().positive().optional(),
  budgetAmount: z.string().optional(),
  budgetCurrency: z.string().length(3).optional(),
  days: z.array(
    z.object({
      /** ISO date string for the day — absent if dates are not yet known. */
      date: z.string().optional(),
      label: z.string().optional(),
      items: z.array(ItineraryDayItemSchema),
    }),
  ),
  unscheduledItems: z.array(ItineraryDayItemSchema).optional(),
  /** The primary accommodation selected by the traveler. */
  selectedAccommodation: SelectedOfferReferenceSchema.optional(),
  bonvoyPointsEstimate: z.number().int().nonnegative().optional(),
  weatherSummary: z.string().optional(),
  packingSuggestions: z.array(z.string()).optional(),
  status: ItineraryDraftStatusSchema,
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString,
});
export type ItineraryDraft = z.infer<typeof ItineraryDraftSchema>;

// ─── Itinerary Revision ───────────────────────────────────────────────────────

/**
 * An immutable record of every change to an itinerary draft.
 * Revision numbers are 1-indexed and must be monotonically increasing per draft.
 */
export const ItineraryRevisionSchema = z.object({
  id: z.string().min(1),
  draftId: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  actor: ActorReferenceSchema,
  changeReason: z.string().optional(),
  diffSummary: z.string().optional(),
  createdAt: isoDateTimeString,
});
export type ItineraryRevision = z.infer<typeof ItineraryRevisionSchema>;

// ─── Planning State Summary ───────────────────────────────────────────────────

/**
 * A snapshot of all durable state associated with one planning session.
 * Used by the frontend to resume a session after a browser refresh
 * or sign-in state change without relying on process memory.
 */
export const PlanningStateSummarySchema = z.object({
  session: PlanningSessionSchema,
  turnCount: z.number().int().nonnegative(),
  /** The most recent output for each agent that was invoked. */
  latestAgentOutputs: z.array(AgentOutputSchema).optional(),
  currentDraft: ItineraryDraftSchema.optional(),
});
export type PlanningStateSummary = z.infer<typeof PlanningStateSummarySchema>;
