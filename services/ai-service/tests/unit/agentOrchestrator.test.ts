/**
 * Unit tests for Ten Agent Orchestrator — WOREF-008
 */

import { describe, it, expect } from "vitest";
import {
  AgentOrchestrator,
  buildExecutionPlan,
  createStubExecutors,
  type AgentName,
  type OrchestrationIntent,
} from "../../src/domain/AgentOrchestrator.js";

describe("buildExecutionPlan", () => {
  it("returns a single wave when there are no dependencies between agents", () => {
    const plan = buildExecutionPlan(["SafetyAgent", "WeatherAgent"]);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toContain("SafetyAgent");
    expect(plan[0]).toContain("WeatherAgent");
  });

  it("AccommodationAgent comes after SafetyAgent", () => {
    const plan = buildExecutionPlan(["SafetyAgent", "AccommodationAgent"]);
    expect(plan).toHaveLength(2);
    expect(plan[0]).toContain("SafetyAgent");
    expect(plan[1]).toContain("AccommodationAgent");
  });

  it("produces a valid full plan with all 10 agents", () => {
    const allAgents: AgentName[] = [
      "SafetyAgent", "WeatherAgent", "AccommodationAgent", "FlightAgent",
      "ActivityAgent", "RestaurantAgent", "TransportAgent",
      "BudgetTrackingAgent", "ItineraryAssemblyAgent", "ValidationAgent",
    ];
    const plan = buildExecutionPlan(allAgents);
    // All agents must appear exactly once
    const flat = plan.flat();
    expect(flat.length).toBe(allAgents.length);
    const unique = new Set(flat);
    expect(unique.size).toBe(allAgents.length);
    // ValidationAgent must be in the last wave
    const lastWave = plan[plan.length - 1];
    expect(lastWave).toContain("ValidationAgent");
  });

  it("ItineraryAssemblyAgent comes after BudgetTrackingAgent", () => {
    const plan = buildExecutionPlan([
      "SafetyAgent", "AccommodationAgent", "FlightAgent",
      "ActivityAgent", "BudgetTrackingAgent", "ItineraryAssemblyAgent",
    ]);
    const flatIndices = (name: AgentName) => plan.findIndex((wave) => wave.includes(name));
    expect(flatIndices("ItineraryAssemblyAgent")).toBeGreaterThan(flatIndices("BudgetTrackingAgent"));
  });
});

describe("AgentOrchestrator", () => {
  it("runs ACCOMMODATION_ONLY intent with stub executors", async () => {
    const orch = new AgentOrchestrator(createStubExecutors());
    const results = await orch.run("ACCOMMODATION_ONLY", { destination: "Lucca, Italy" });
    expect(results.has("AccommodationAgent")).toBe(true);
    expect(results.has("SafetyAgent")).toBe(true);
    const acc = results.get("AccommodationAgent");
    expect(acc?.success).toBe(true);
  });

  it("runs SAFETY_CHECK intent", async () => {
    const orch = new AgentOrchestrator(createStubExecutors());
    const results = await orch.run("SAFETY_CHECK", { destination: "Lucca, Italy" });
    expect(results.has("SafetyAgent")).toBe(true);
    expect(results.get("SafetyAgent")?.success).toBe(true);
  });

  it("handles missing executor gracefully", async () => {
    const orch = new AgentOrchestrator({}); // no executors
    const results = await orch.run("SAFETY_CHECK", {});
    const safety = results.get("SafetyAgent");
    expect(safety?.success).toBe(false);
    expect(safety?.error).toContain("No executor registered");
  });

  it("preview returns execution plan without running", () => {
    const orch = new AgentOrchestrator(createStubExecutors());
    const plan = orch.preview("FULL_TRIP_PLANNING");
    expect(plan.length).toBeGreaterThan(1);
    expect(plan.flat()).toContain("ValidationAgent");
  });

  it("FULL_TRIP_PLANNING includes all 10 agents", async () => {
    const orch = new AgentOrchestrator(createStubExecutors());
    const results = await orch.run("FULL_TRIP_PLANNING", { destination: "Lucca" });
    expect(results.size).toBe(10);
  });
});
