/**
 * Ten Agent Orchestrator — WOREF-008
 *
 * Routes planning requests to the appropriate specialised agent and assembles
 * a composite result. Each agent maps to one of the TRAVEL_TOOLS in the main
 * AI service index and can be invoked independently or as part of a full
 * planning pipeline.
 *
 * Agent roster (matches Marriott sourcing rules):
 *  1. AccommodationAgent    — HVMI-first property search
 *  2. SafetyAgent           — destination validation, advisories
 *  3. FlightAgent           — flight options (post-accommodation)
 *  4. ActivityAgent         — Bonvoy Tours & Activities + free landmarks
 *  5. RestaurantAgent       — nearby Marriott dining recommendations
 *  6. BudgetTrackingAgent   — running cost totals + Bonvoy points
 *  7. ItineraryAssemblyAgent— day-by-day draft assembly
 *  8. TransportAgent        — local transport (car rental, shuttle, taxi)
 *  9. WeatherAgent          — destination weather forecast
 * 10. ValidationAgent       — pre-commit booking checks
 */

export type AgentName =
  | "AccommodationAgent"
  | "SafetyAgent"
  | "FlightAgent"
  | "ActivityAgent"
  | "RestaurantAgent"
  | "BudgetTrackingAgent"
  | "ItineraryAssemblyAgent"
  | "TransportAgent"
  | "WeatherAgent"
  | "ValidationAgent";

export interface AgentInput {
  agent: AgentName;
  params: Record<string, unknown>;
  conversationId?: string;
  sessionId?: string;
}

export interface AgentOutput {
  agent: AgentName;
  success: boolean;
  data: unknown;
  provenance: "HVMI" | "AMADEUS" | "MARRIOTT_DIRECT" | "BONVOY_TOURS" | "LOCAL" | "STATIC";
  confidence: number;  // 0–1
  durationMs: number;
  error?: string;
}

export type OrchestrationIntent =
  | "FULL_TRIP_PLANNING"    // Runs all agents in dependency order
  | "ACCOMMODATION_ONLY"    // Steps 1, 2, 10
  | "ACTIVITIES_ONLY"       // Step 4
  | "BUDGET_CHECK"          // Step 6
  | "FLIGHT_ONLY"           // Step 3
  | "WEATHER_CHECK"         // Step 9
  | "SAFETY_CHECK";         // Step 2

// ─── Agent dependency graph ───────────────────────────────────────────────────
// Agents with no dependencies run in parallel in the first wave.
const AGENT_DEPS: Record<AgentName, AgentName[]> = {
  SafetyAgent:            [],
  WeatherAgent:           [],
  AccommodationAgent:     ["SafetyAgent"],
  FlightAgent:            ["SafetyAgent"],
  ActivityAgent:          ["AccommodationAgent"],
  RestaurantAgent:        ["AccommodationAgent"],
  TransportAgent:         ["FlightAgent"],
  BudgetTrackingAgent:    ["AccommodationAgent", "FlightAgent", "ActivityAgent"],
  ItineraryAssemblyAgent: ["AccommodationAgent", "ActivityAgent", "BudgetTrackingAgent"],
  ValidationAgent:        ["ItineraryAssemblyAgent"],
};

// ─── Intent to agent subset mapping ──────────────────────────────────────────
const INTENT_AGENTS: Record<OrchestrationIntent, AgentName[]> = {
  FULL_TRIP_PLANNING:  [
    "SafetyAgent", "WeatherAgent", "AccommodationAgent", "FlightAgent",
    "ActivityAgent", "RestaurantAgent", "TransportAgent",
    "BudgetTrackingAgent", "ItineraryAssemblyAgent", "ValidationAgent",
  ],
  ACCOMMODATION_ONLY:  ["SafetyAgent", "AccommodationAgent", "ValidationAgent"],
  ACTIVITIES_ONLY:     ["ActivityAgent"],
  BUDGET_CHECK:        ["BudgetTrackingAgent"],
  FLIGHT_ONLY:         ["SafetyAgent", "FlightAgent", "TransportAgent"],
  WEATHER_CHECK:       ["WeatherAgent"],
  SAFETY_CHECK:        ["SafetyAgent"],
};

// ─── Execution plan builder ───────────────────────────────────────────────────

/**
 * Build an ordered execution plan (waves) from a set of agents and their deps.
 * Agents in the same wave may run in parallel.
 */
export function buildExecutionPlan(agents: AgentName[]): AgentName[][] {
  const agentSet = new Set(agents);
  const completed = new Set<AgentName>();
  const waves: AgentName[][] = [];

  while (completed.size < agents.length) {
    const wave = agents.filter((a) => {
      if (completed.has(a)) return false;
      const deps = AGENT_DEPS[a].filter((d) => agentSet.has(d));
      return deps.every((d) => completed.has(d));
    });
    if (wave.length === 0) break; // circular dep guard
    waves.push(wave);
    wave.forEach((a) => completed.add(a));
  }
  return waves;
}

// ─── Orchestrator class ───────────────────────────────────────────────────────

export type AgentExecutor = (input: AgentInput) => Promise<AgentOutput>;

export class AgentOrchestrator {
  private readonly agentExecutors: Map<AgentName, AgentExecutor>;

  constructor(executors: Partial<Record<AgentName, AgentExecutor>>) {
    this.agentExecutors = new Map(Object.entries(executors) as [AgentName, AgentExecutor][]);
  }

  /**
   * Run all agents for a given intent in dependency order.
   * Returns all agent outputs keyed by agent name.
   */
  async run(
    intent: OrchestrationIntent,
    params: Record<string, unknown>,
    conversationId?: string,
  ): Promise<Map<AgentName, AgentOutput>> {
    const agents = INTENT_AGENTS[intent];
    const plan = buildExecutionPlan(agents);
    const results = new Map<AgentName, AgentOutput>();

    for (const wave of plan) {
      const waveResults = await Promise.all(
        wave.map((agent) => this.runAgent(agent, { ...params, _priorResults: Object.fromEntries(results) }, conversationId)),
      );
      waveResults.forEach((r) => results.set(r.agent, r));
    }
    return results;
  }

  private async runAgent(
    agent: AgentName,
    params: Record<string, unknown>,
    conversationId?: string,
  ): Promise<AgentOutput> {
    const executor = this.agentExecutors.get(agent);
    const start = Date.now();

    if (!executor) {
      return {
        agent,
        success: false,
        data: null,
        provenance: "LOCAL",
        confidence: 0,
        durationMs: Date.now() - start,
        error: `No executor registered for ${agent}`,
      };
    }

    try {
      const output = await executor({ agent, params, conversationId });
      return { ...output, durationMs: output.durationMs ?? Date.now() - start };
    } catch (err) {
      return {
        agent,
        success: false,
        data: null,
        provenance: "LOCAL",
        confidence: 0,
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Returns the execution plan for an intent without running it.
   * Useful for previewing/debugging the orchestration order.
   */
  preview(intent: OrchestrationIntent): AgentName[][] {
    return buildExecutionPlan(INTENT_AGENTS[intent]);
  }
}

// ─── Default stub executors (used when no real executor is provided) ──────────

export function createStubExecutors(): Partial<Record<AgentName, AgentExecutor>> {
  const stub = (agent: AgentName, data: unknown): AgentExecutor =>
    async (): Promise<AgentOutput> => ({
      agent,
      success: true,
      data,
      provenance: "STATIC",
      confidence: 0.5,
      durationMs: 10,
    });

  return {
    SafetyAgent:            stub("SafetyAgent",            { safe: true, advisory: "No current advisories for Italy." }),
    WeatherAgent:           stub("WeatherAgent",           { forecast: "Warm and sunny, 24°C, low chance of rain." }),
    AccommodationAgent:     stub("AccommodationAgent",     { hvmiVillas: [], fallback: "No HVMI villas found" }),
    FlightAgent:            stub("FlightAgent",            { flights: [] }),
    ActivityAgent:          stub("ActivityAgent",          { activities: [], landmarks: [] }),
    RestaurantAgent:        stub("RestaurantAgent",        { restaurants: [] }),
    TransportAgent:         stub("TransportAgent",         { options: [] }),
    BudgetTrackingAgent:    stub("BudgetTrackingAgent",    { totalUSD: 0, bonvoyPoints: 0, breakdown: [] }),
    ItineraryAssemblyAgent: stub("ItineraryAssemblyAgent", { days: [], summary: "" }),
    ValidationAgent:        stub("ValidationAgent",        { valid: true, issues: [] }),
  };
}
