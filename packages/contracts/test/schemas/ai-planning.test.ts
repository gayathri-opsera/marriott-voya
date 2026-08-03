/**
 * Unit tests for AI Planning State Contracts — WO-001
 *
 * Validates: happy paths, missing required fields, invalid enums,
 * edge cases (anonymous sessions, degraded agents, zero dates),
 * and cross-flow fixture compatibility.
 */

import { describe, it, expect } from "vitest";
import {
  PlanningSessionSchema,
  ConversationTurnSchema,
  AgentOutputSchema,
  ToolResultSchema,
  SelectedOfferReferenceSchema,
  ItineraryDraftSchema,
  ItineraryRevisionSchema,
  PlanningStateSummarySchema,
  MARRIOTT_BOOKABLE_PROVENANCES,
} from "../../src/ai-planning/index.js";
import {
  flow1Session,
  flow1UserTurn,
  flow1AssistantTurn,
  flow1AccommodationAgent,
  flow1HvmiToolResult,
  flow1SelectedOffer,
  flow1Draft,
  flow1Revision,
  flow1StateSummary,
  flow2Session,
  flow2UserTurn,
  flow2ClarificationTurn,
  flow2SafetyAgent,
  flow2AttractionAgent,
  flow3Session,
  flow3UserTurn,
  flow3AccommodationAgent,
  flow3Draft,
  degradedWeatherAgent,
  illustrativeOfferRef,
  staleOfferRef,
  invalidSessionPayloads,
  invalidAgentOutputPayloads,
  invalidRevisionPayloads,
} from "../fixtures/ai-planning.js";

// ─── PlanningSessionSchema ────────────────────────────────────────────────────

describe("PlanningSessionSchema", () => {
  it("parses Flow 1 accommodation-led session", () => {
    const result = PlanningSessionSchema.safeParse(flow1Session);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flowType).toBe("ACCOMMODATION_LED");
      expect(result.data.actor.type).toBe("authenticated");
    }
  });

  it("parses Flow 2 intent-led session", () => {
    expect(PlanningSessionSchema.safeParse(flow2Session).success).toBe(true);
  });

  it("parses Flow 3 anonymous free-form session", () => {
    const result = PlanningSessionSchema.safeParse(flow3Session);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actor.type).toBe("anonymous");
      expect(result.data.actor.anonymousId).toBe("anon-session-abc123");
    }
  });

  it("rejects session with missing actor", () => {
    const result = PlanningSessionSchema.safeParse(invalidSessionPayloads.missingActor);
    expect(result.success).toBe(false);
  });

  it("rejects unknown flowType", () => {
    const result = PlanningSessionSchema.safeParse(invalidSessionPayloads.invalidFlowType);
    expect(result.success).toBe(false);
  });

  it("rejects authenticated actor with no userId", () => {
    const result = PlanningSessionSchema.safeParse(
      invalidSessionPayloads.authenticatedWithNoUserId,
    );
    expect(result.success).toBe(false);
  });

  it("rejects anonymous actor with no anonymousId", () => {
    const result = PlanningSessionSchema.safeParse(
      invalidSessionPayloads.anonymousWithNoAnonymousId,
    );
    expect(result.success).toBe(false);
  });
});

// ─── ConversationTurnSchema ───────────────────────────────────────────────────

describe("ConversationTurnSchema", () => {
  it("parses a user turn", () => {
    const result = ConversationTurnSchema.safeParse(flow1UserTurn);
    expect(result.success).toBe(true);
  });

  it("parses an assistant turn with token usage", () => {
    const result = ConversationTurnSchema.safeParse(flow1AssistantTurn);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tokenUsage?.input).toBe(312);
    }
  });

  it("parses a clarification turn (Flow 2)", () => {
    expect(ConversationTurnSchema.safeParse(flow2ClarificationTurn).success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = ConversationTurnSchema.safeParse({ ...flow1UserTurn, content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = ConversationTurnSchema.safeParse({ ...flow1UserTurn, role: "bot" });
    expect(result.success).toBe(false);
  });

  it("allows interrupted=true for a stream that was cut off", () => {
    const result = ConversationTurnSchema.safeParse({
      ...flow1AssistantTurn,
      completedAt: undefined,
      interrupted: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.interrupted).toBe(true);
  });
});

// ─── ToolResultSchema ─────────────────────────────────────────────────────────

describe("ToolResultSchema", () => {
  it("parses a valid HVMI tool result", () => {
    const result = ToolResultSchema.safeParse(flow1HvmiToolResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe("HVMI");
      expect(result.data.bookable).toBe(true);
    }
  });

  it("rejects unknown source provenance", () => {
    const result = ToolResultSchema.safeParse({
      ...flow1HvmiToolResult,
      source: "UNKNOWN_SUPPLIER",
    });
    expect(result.success).toBe(false);
  });
});

// ─── AgentOutputSchema ────────────────────────────────────────────────────────

describe("AgentOutputSchema", () => {
  it("parses a successful accommodation agent output (Flow 1)", () => {
    const result = AgentOutputSchema.safeParse(flow1AccommodationAgent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agentName).toBe("accommodation");
      expect(result.data.status).toBe("success");
      expect(result.data.provenance).toBe("HVMI");
    }
  });

  it("parses safety agent output (Flow 2)", () => {
    expect(AgentOutputSchema.safeParse(flow2SafetyAgent).success).toBe(true);
  });

  it("parses attraction agent output (Flow 2)", () => {
    expect(AgentOutputSchema.safeParse(flow2AttractionAgent).success).toBe(true);
  });

  it("parses accommodation agent output with multiple destinations (Flow 3)", () => {
    expect(AgentOutputSchema.safeParse(flow3AccommodationAgent).success).toBe(true);
  });

  it("parses a degraded weather agent output", () => {
    const result = AgentOutputSchema.safeParse(degradedWeatherAgent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("degraded");
      expect(result.data.errorSummary).toContain("503");
    }
  });

  it("rejects unknown agent name", () => {
    const result = AgentOutputSchema.safeParse(invalidAgentOutputPayloads.unknownAgentName);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = AgentOutputSchema.safeParse(invalidAgentOutputPayloads.invalidStatus);
    expect(result.success).toBe(false);
  });

  it("rejects confidence value > 1", () => {
    const result = AgentOutputSchema.safeParse(
      invalidAgentOutputPayloads.confidenceOutOfRange,
    );
    expect(result.success).toBe(false);
  });
});

// ─── SelectedOfferReferenceSchema ─────────────────────────────────────────────

describe("SelectedOfferReferenceSchema", () => {
  it("parses a valid HVMI bookable offer reference", () => {
    const result = SelectedOfferReferenceSchema.safeParse(flow1SelectedOffer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provenance).toBe("HVMI");
      expect(MARRIOTT_BOOKABLE_PROVENANCES.has(result.data.provenance)).toBe(true);
    }
  });

  it("parses an illustrative (non-bookable) offer reference", () => {
    const result = SelectedOfferReferenceSchema.safeParse(illustrativeOfferRef);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookable).toBe(false);
      expect(MARRIOTT_BOOKABLE_PROVENANCES.has(result.data.provenance)).toBe(false);
    }
  });

  it("parses a stale/expired offer reference", () => {
    const result = SelectedOfferReferenceSchema.safeParse(staleOfferRef);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookable).toBe(false);
      expect(result.data.expiresAt).toBeInstanceOf(Date);
    }
  });
});

// ─── ItineraryDraftSchema ─────────────────────────────────────────────────────

describe("ItineraryDraftSchema", () => {
  it("parses Flow 1 draft with day items and selected accommodation", () => {
    const result = ItineraryDraftSchema.safeParse(flow1Draft);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toHaveLength(2);
      expect(result.data.selectedAccommodation?.provenance).toBe("HVMI");
      expect(result.data.packingSuggestions).toContain("sunscreen");
    }
  });

  it("parses Flow 3 draft without dates (dates unknown)", () => {
    const result = ItineraryDraftSchema.safeParse(flow3Draft);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkIn).toBeUndefined();
      expect(result.data.unscheduledItems).toHaveLength(1);
    }
  });

  it("rejects a draft with invalid status", () => {
    const result = ItineraryDraftSchema.safeParse({
      ...flow1Draft,
      status: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a draft item with invalid time format", () => {
    const itemWithBadTime = {
      id: "bad-time",
      type: "ACTIVITY",
      title: "Test",
      startTime: "9am",
    };
    const result = ItineraryDraftSchema.safeParse({
      ...flow1Draft,
      days: [{ items: [itemWithBadTime] }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── ItineraryRevisionSchema ──────────────────────────────────────────────────

describe("ItineraryRevisionSchema", () => {
  it("parses revision 1 successfully", () => {
    const result = ItineraryRevisionSchema.safeParse(flow1Revision);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.revisionNumber).toBe(1);
    }
  });

  it("rejects revision with revisionNumber = 0", () => {
    const result = ItineraryRevisionSchema.safeParse(
      invalidRevisionPayloads.zeroRevisionNumber,
    );
    expect(result.success).toBe(false);
  });

  it("rejects negative revisionNumber", () => {
    const result = ItineraryRevisionSchema.safeParse(
      invalidRevisionPayloads.negativeRevisionNumber,
    );
    expect(result.success).toBe(false);
  });
});

// ─── PlanningStateSummarySchema ───────────────────────────────────────────────

describe("PlanningStateSummarySchema", () => {
  it("parses a full Flow 1 state summary", () => {
    const result = PlanningStateSummarySchema.safeParse(flow1StateSummary);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnCount).toBe(2);
      expect(result.data.latestAgentOutputs).toHaveLength(1);
      expect(result.data.currentDraft?.destination).toBe("Lucca, Tuscany, Italy");
    }
  });

  it("parses a summary with no draft (session just started)", () => {
    const result = PlanningStateSummarySchema.safeParse({
      session: flow2Session,
      turnCount: 1,
    });
    expect(result.success).toBe(true);
  });
});

// ─── Cross-flow compatibility ─────────────────────────────────────────────────

describe("Cross-flow fixture compatibility", () => {
  it("all three flow sessions use different flowType values", () => {
    const f1 = PlanningSessionSchema.parse(flow1Session);
    const f2 = PlanningSessionSchema.parse(flow2Session);
    const f3 = PlanningSessionSchema.parse(flow3Session);
    expect(new Set([f1.flowType, f2.flowType, f3.flowType]).size).toBe(3);
  });

  it("HVMI is in MARRIOTT_BOOKABLE_PROVENANCES", () => {
    expect(MARRIOTT_BOOKABLE_PROVENANCES.has("HVMI")).toBe(true);
  });

  it("ILLUSTRATIVE is NOT in MARRIOTT_BOOKABLE_PROVENANCES", () => {
    expect(MARRIOTT_BOOKABLE_PROVENANCES.has("ILLUSTRATIVE")).toBe(false);
  });

  it("agent outputs for all 3 flows parse the same AgentOutputSchema", () => {
    for (const output of [
      flow1AccommodationAgent,
      flow2SafetyAgent,
      flow2AttractionAgent,
      flow3AccommodationAgent,
      degradedWeatherAgent,
    ]) {
      expect(AgentOutputSchema.safeParse(output).success).toBe(true);
    }
  });
});
