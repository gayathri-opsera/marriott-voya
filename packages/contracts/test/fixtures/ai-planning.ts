/**
 * AI Planning State Fixtures — WO-001
 *
 * Representative fixtures for the three P0 planning flows.
 * All fixtures use future-safe timestamps (year 2099) and Marriott-first
 * provenance where accommodation is involved.
 */

/**
 * Raw (pre-parse) fixture payloads. These use string timestamps because the
 * Zod schemas use isoDateTimeString which transforms string → Date.
 * The exported objects are the raw input shapes — tests pass them to
 * Schema.safeParse() or Schema.parse() and receive Date-typed outputs.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

const NOW = "2099-09-01T10:00:00.000Z";
const LATER = "2099-09-01T12:00:00.000Z";
const CHECKIN = "2099-09-10T00:00:00.000Z";
const CHECKOUT = "2099-09-14T00:00:00.000Z";

// ─── Flow 1 — Accommodation-Led (HVMI villa in Lucca) ─────────────────────────

export const flow1Session = {
  id: "session-flow1-lucca",
  actor: { type: "authenticated", userId: "user-jane-bonvoy" },
  flowType: "ACCOMMODATION_LED",
  status: "ACTIVE",
  correlationId: "corr-flow1-001",
  currentDraftId: "draft-flow1-001",
  createdAt: NOW,
  updatedAt: LATER,
};

export const flow1UserTurn = {
  id: "turn-flow1-001",
  sessionId: "session-flow1-lucca",
  role: "user",
  content: "I'd like to book Villa della Torre near Lucca for 4 nights in September.",
  sequence: 1,
  classification: "INTERNAL",
  createdAt: NOW,
  completedAt: NOW,
};

export const flow1AssistantTurn = {
  id: "turn-flow1-002",
  sessionId: "session-flow1-lucca",
  role: "assistant",
  content:
    "Great choice! Villa della Torre is a stunning HVMI property in the Tuscan countryside. I found availability for 4 nights from 10-14 September. Shall I also suggest some Bonvoy Tours and local activities nearby?",
  sequence: 2,
  tokenUsage: { input: 312, output: 87 },
  classification: "INTERNAL",
  createdAt: NOW,
  completedAt: LATER,
};

export const flow1HvmiToolResult = {
  id: "tool-hvmi-villa-001",
  toolName: "search_hvmi_villas",
  source: "HVMI",
  freshnessAt: NOW,
  expiresAt: "2099-09-02T10:00:00.000Z",
  bookable: true,
  isMock: true,
  normalizedPayload: {
    propertyId: "hvmi-villa-della-torre",
    name: "Villa della Torre",
    location: "Lucca, Tuscany, Italy",
    nightlyRate: "450.00",
    currency: "USD",
    collection: "Vineyards & Winery Homes",
    amenities: ["private pool", "wine cellar", "vineyard views", "concierge"],
    rating: 4.9,
    bonvoyPoints: 9000,
  },
  dataClassification: "INTERNAL",
};

export const flow1SelectedOffer = {
  offerId: "hvmi-villa-della-torre-20990910",
  provenance: "HVMI",
  freshnessAt: NOW,
  expiresAt: "2099-09-02T10:00:00.000Z",
  bookable: true,
  isMock: true,
  offerType: "ACCOMMODATION",
  priceSnapshot: { amount: "1800.00", currency: "USD" },
  dataClassification: "INTERNAL",
};

export const flow1AccommodationAgent = {
  id: "agent-output-accom-001",
  sessionId: "session-flow1-lucca",
  turnId: "turn-flow1-002",
  agentName: "accommodation",
  status: "success",
  inputs: { destination: "Lucca", checkIn: CHECKIN, checkOut: CHECKOUT, guests: 2 },
  normalizedResult: {
    properties: [
      {
        id: "hvmi-villa-della-torre",
        name: "Villa della Torre",
        provenance: "HVMI",
        marriottFirst: true,
        nightlyRate: "450.00",
        currency: "USD",
      },
    ],
  },
  toolResults: [flow1HvmiToolResult],
  confidence: 0.97,
  provenance: "HVMI",
  createdAt: NOW,
};

export const flow1Draft = {
  id: "draft-flow1-001",
  sessionId: "session-flow1-lucca",
  destination: "Lucca, Tuscany, Italy",
  checkIn: CHECKIN,
  checkOut: CHECKOUT,
  travelers: 2,
  budgetAmount: "3000.00",
  budgetCurrency: "USD",
  days: [
    {
      date: "2099-09-10",
      label: "Arrival day",
      items: [
        {
          id: "item-arrival",
          type: "ACCOMMODATION",
          title: "Check in - Villa della Torre",
          description: "HVMI property, private pool, vineyard views",
          startTime: "15:00",
          offerRef: flow1SelectedOffer,
          sourceLabel: "Homes & Villas by Marriott Bonvoy",
        },
      ],
    },
    {
      date: "2099-09-11",
      label: "Lucca city day",
      items: [
        {
          id: "item-lucca-walls",
          type: "ACTIVITY",
          title: "Cycle the Lucca city walls",
          description: "Iconic Renaissance ramparts - 4 km loop, bike hire included",
          startTime: "09:00",
          endTime: "11:00",
          estimatedCost: { amount: "15.00", currency: "USD" },
          sourceLabel: "Bonvoy Tours & Activities",
        },
        {
          id: "item-dinner-buca",
          type: "RESTAURANT",
          title: "Dinner at Buca di Sant'Antonio",
          startTime: "19:30",
          estimatedCost: { amount: "60.00", currency: "USD" },
          sourceLabel: "Bonvoy Tours & Activities",
        },
      ],
    },
  ],
  selectedAccommodation: flow1SelectedOffer,
  bonvoyPointsEstimate: 9000,
  weatherSummary: "Warm and sunny, 28 deg C average. Light layers for evenings.",
  packingSuggestions: ["sunscreen", "comfortable walking shoes", "light jacket"],
  status: "DRAFT",
  createdAt: NOW,
  updatedAt: LATER,
};

export const flow1Revision = {
  id: "rev-flow1-001",
  draftId: "draft-flow1-001",
  revisionNumber: 1,
  actor: { type: "authenticated", userId: "user-jane-bonvoy" },
  changeReason: "Added Lucca city activity",
  diffSummary: "Added 2 items to day 2 (Lucca cycle tour and dinner)",
  createdAt: LATER,
};

export const flow1StateSummary = {
  session: flow1Session,
  turnCount: 2,
  latestAgentOutputs: [flow1AccommodationAgent],
  currentDraft: flow1Draft,
};

// ─── Flow 2 — Intent-Led ("I want to visit Disneyland Paris") ─────────────────

export const flow2Session = {
  id: "session-flow2-paris",
  actor: { type: "authenticated", userId: "user-mark-family" },
  flowType: "INTENT_LED",
  status: "ACTIVE",
  correlationId: "corr-flow2-001",
  createdAt: NOW,
  updatedAt: LATER,
};

export const flow2UserTurn = {
  id: "turn-flow2-001",
  sessionId: "session-flow2-paris",
  role: "user",
  content: "I want to visit Disneyland Paris with my family of 4.",
  sequence: 1,
  classification: "INTERNAL",
  createdAt: NOW,
  completedAt: NOW,
};

export const flow2ClarificationTurn = {
  id: "turn-flow2-002",
  sessionId: "session-flow2-paris",
  role: "assistant",
  content:
    "Wonderful! How many nights are you planning, and when would you like to travel? This helps me find the best Marriott hotels near Disneyland.",
  sequence: 2,
  tokenUsage: { input: 198, output: 45 },
  classification: "INTERNAL",
  createdAt: NOW,
  completedAt: NOW,
};

export const flow2SafetyAgent = {
  id: "agent-output-safety-paris",
  sessionId: "session-flow2-paris",
  agentName: "safety",
  status: "success",
  inputs: { destination: "Disneyland Paris", prompt: "I want to visit Disneyland Paris" },
  normalizedResult: { safe: true, destinationKnown: true, missingFields: ["dates", "budget"] },
  confidence: 1.0,
  createdAt: NOW,
};

export const flow2AttractionAgent = {
  id: "agent-output-attract-paris",
  sessionId: "session-flow2-paris",
  agentName: "attraction",
  status: "success",
  inputs: { destination: "Paris", radius: "50km" },
  normalizedResult: {
    attractions: [
      { name: "Disneyland Paris", distance: "32km from Paris centre", ticketPrice: "110.00", currency: "EUR" },
      { name: "Eiffel Tower", distance: "0km", ticketPrice: "28.00", currency: "EUR" },
      { name: "Louvre Museum", distance: "1km", ticketPrice: "22.00", currency: "EUR" },
      { name: "Palace of Versailles", distance: "18km", ticketPrice: "21.50", currency: "EUR" },
    ],
  },
  confidence: 0.92,
  provenance: "GOOGLE_PLACES",
  createdAt: NOW,
};

// ─── Flow 3 — Free-Form Discovery ("honeymoon destination") ───────────────────

export const flow3Session = {
  id: "session-flow3-honeymoon",
  actor: { type: "anonymous", anonymousId: "anon-session-abc123" },
  flowType: "FREE_FORM_DISCOVERY",
  status: "ACTIVE",
  correlationId: "corr-flow3-001",
  createdAt: NOW,
  updatedAt: LATER,
};

export const flow3UserTurn = {
  id: "turn-flow3-001",
  sessionId: "session-flow3-honeymoon",
  role: "user",
  content:
    "I want a honeymoon destination with luxury villas, private beaches, and great food. Budget around $5000 for 7 nights.",
  sequence: 1,
  classification: "INTERNAL",
  createdAt: NOW,
  completedAt: NOW,
};

export const flow3AccommodationAgent = {
  id: "agent-output-accom-honeymoon",
  sessionId: "session-flow3-honeymoon",
  agentName: "accommodation",
  status: "success",
  inputs: { budget: 5000, nights: 7, type: "luxury villa", amenities: ["private beach"] },
  normalizedResult: {
    destinations: [
      { name: "Bali, Indonesia", hvmiAvailable: true, avgNightly: "500.00" },
      { name: "Santorini, Greece", hvmiAvailable: true, avgNightly: "650.00" },
      { name: "Maldives", hvmiAvailable: false, fallback: "MARRIOTT_HOTEL" },
    ],
  },
  confidence: 0.88,
  provenance: "HVMI",
  createdAt: NOW,
};

export const flow3Draft = {
  id: "draft-flow3-001",
  sessionId: "session-flow3-honeymoon",
  destination: "Bali, Indonesia",
  travelers: 2,
  budgetAmount: "5000.00",
  budgetCurrency: "USD",
  days: [],
  unscheduledItems: [
    {
      id: "unsched-bali-villa",
      type: "ACCOMMODATION",
      title: "HVMI Villa - Bali",
      description: "Luxury hillside villa with private plunge pool",
      estimatedCost: { amount: "3500.00", currency: "USD" },
      sourceLabel: "Homes & Villas by Marriott Bonvoy",
    },
  ],
  status: "DRAFT",
  createdAt: NOW,
  updatedAt: LATER,
};

// ─── Degraded / Edge-Case Fixtures ────────────────────────────────────────────

/** Agent that failed with a non-critical timeout. */
export const degradedWeatherAgent = {
  id: "agent-output-weather-degraded",
  sessionId: "session-flow1-lucca",
  agentName: "weather",
  status: "degraded",
  inputs: { destination: "Lucca", dates: { from: CHECKIN, to: CHECKOUT } },
  errorSummary: "Weather provider returned 503 - using seasonal fallback",
  createdAt: NOW,
};

/** Offer reference to an illustrative (non-bookable) fallback. */
export const illustrativeOfferRef = {
  offerId: "illustrative-hotel-abc",
  provenance: "ILLUSTRATIVE",
  freshnessAt: NOW,
  bookable: false,
  isMock: true,
  offerType: "ACCOMMODATION",
  dataClassification: "INTERNAL",
};

/** Stale offer where expiresAt is in the past. */
export const staleOfferRef = {
  offerId: "hvmi-expired-offer",
  provenance: "HVMI",
  freshnessAt: "2099-08-01T00:00:00.000Z",
  expiresAt: "2099-08-02T00:00:00.000Z",
  bookable: false,
  isMock: false,
  offerType: "ACCOMMODATION",
  dataClassification: "INTERNAL",
};

// ─── Invalid payload fixtures (for negative tests) ───────────────────────────

export const invalidSessionPayloads = {
  missingActor: {
    id: "s1",
    flowType: "ACCOMMODATION_LED",
    status: "ACTIVE",
    correlationId: "c1",
    createdAt: NOW,
    updatedAt: NOW,
    // actor is missing
  },
  invalidFlowType: {
    id: "s2",
    actor: { type: "authenticated", userId: "u1" },
    flowType: "UNKNOWN_FLOW",
    status: "ACTIVE",
    correlationId: "c2",
    createdAt: NOW,
    updatedAt: NOW,
  },
  authenticatedWithNoUserId: {
    id: "s3",
    actor: { type: "authenticated" },
    flowType: "INTENT_LED",
    status: "ACTIVE",
    correlationId: "c3",
    createdAt: NOW,
    updatedAt: NOW,
  },
  anonymousWithNoAnonymousId: {
    id: "s4",
    actor: { type: "anonymous" },
    flowType: "FREE_FORM_DISCOVERY",
    status: "ACTIVE",
    correlationId: "c4",
    createdAt: NOW,
    updatedAt: NOW,
  },
};

export const invalidAgentOutputPayloads = {
  unknownAgentName: {
    id: "a1",
    sessionId: "s1",
    agentName: "unknown_agent",
    status: "success",
    inputs: {},
    createdAt: NOW,
  },
  invalidStatus: {
    id: "a2",
    sessionId: "s1",
    agentName: "safety",
    status: "running",
    inputs: {},
    createdAt: NOW,
  },
  confidenceOutOfRange: {
    id: "a3",
    sessionId: "s1",
    agentName: "accommodation",
    status: "success",
    inputs: {},
    confidence: 1.5,
    createdAt: NOW,
  },
};

export const invalidRevisionPayloads = {
  zeroRevisionNumber: {
    id: "rev-0",
    draftId: "draft-1",
    revisionNumber: 0,
    actor: { type: "authenticated", userId: "u1" },
    createdAt: NOW,
  },
  negativeRevisionNumber: {
    id: "rev-neg",
    draftId: "draft-1",
    revisionNumber: -1,
    actor: { type: "authenticated", userId: "u1" },
    createdAt: NOW,
  },
};
