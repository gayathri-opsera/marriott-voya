/**
 * Shared test fixtures sourced from the seed data JSON files.
 * These are loaded from /public/seed/* which is served by Next.js.
 */

export const BASE = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3200";

/** Stable property IDs (from seed-data.ts) */
export const PROPERTY_IDS = {
  luccaVilla:      "prop-lucca-001",
  chiantiEstate:   "prop-lucca-002",
  casaDellaPace:   "prop-lucca-003",
  santoriniVilla:  "prop-santorini-001",
  baliJungle:      "prop-bali-001",
  maldivesVilla:   "prop-maldives-001",
  provenceMas:     "prop-provence-001",
  aspenLodge:      "prop-aspen-001",
} as const;

export const ITINERARY_IDS = {
  tuscany:   "itin-tuscany-2026",
  santorini: "itin-santorini-2026",
  bali:      "itin-bali-2026",
} as const;

/** Destination strings that match search-service filters */
export const DESTINATIONS = {
  tuscany:   "Lucca",
  santorini: "Santorini",
  bali:      "Bali",
  maldives:  "Maldives",
  provence:  "Provence",
  aspen:     "Aspen",
} as const;

export const DEMO_USER = {
  email: "demo@voya.test",
  password: "Voya2026!",
  name: "Demo Traveller",
} as const;
