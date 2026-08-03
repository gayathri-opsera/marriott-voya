/**
 * Marriott-First Accommodation Search Contracts — WO-015
 *
 * Unified request/response schemas for hotel, villa, home, apartment, resort,
 * cruise, and partner accommodation search. All services and frontend surfaces
 * validate against these contracts so Marriott-first provenance, HVMI priority,
 * bookability, freshness, and Bonvoy points are consistently represented.
 */

import { z } from "zod";
import { isoDateString, isoDateTimeString, positiveMoney, currencyCode } from "../common/primitives.js";

// ─── Property Classification ──────────────────────────────────────────────────

export const PropertyTypeSchema = z.enum([
  "HOTEL",
  "RESORT",
  "VILLA",
  "HOME",
  "APARTMENT",
  "CRUISE",
  "PARTNER",
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

/**
 * Marriott brand/tier classification.
 * NON_MARRIOTT is kept for explicit disclosure (never primary recommendation).
 */
export const PartnerClassificationSchema = z.enum([
  "HVMI",              // Homes & Villas by Marriott International — highest priority
  "MARRIOTT_LUXURY",   // Ritz-Carlton, St. Regis, Edition, Bulgari
  "MARRIOTT_PREMIUM",  // Marriott Hotels, JW Marriott, Autograph Collection
  "MARRIOTT_SELECT",   // Courtyard, Four Points, Fairfield
  "MARRIOTT_PARTNER",  // Delta, Meridien, Westin, Sheraton, Le Meridien
  "BONVOY_TOURS",      // Bonvoy Tours & Activities (non-accommodation)
  "NON_MARRIOTT",      // Explicit fallback — shown only with disclosure
]);
export type PartnerClassification = z.infer<typeof PartnerClassificationSchema>;

/** Marriott classifications that are primary (no disclosure required). */
export const MARRIOTT_FIRST_CLASSIFICATIONS: ReadonlySet<PartnerClassification> =
  new Set<PartnerClassification>([
    "HVMI",
    "MARRIOTT_LUXURY",
    "MARRIOTT_PREMIUM",
    "MARRIOTT_SELECT",
    "MARRIOTT_PARTNER",
  ]);

export const BookabilityStatusSchema = z.enum([
  "BOOKABLE",      // Live inventory, bookable immediately
  "ON_REQUEST",    // Must request before confirming
  "WAITLIST",      // No current availability, can waitlist
  "ILLUSTRATIVE",  // Demo/synthetic — never bookable
  "EXPIRED",       // Offer expired — must re-search
]);
export type BookabilityStatus = z.infer<typeof BookabilityStatusSchema>;

export const AccommodationSortModeSchema = z.enum([
  "RELEVANCE",
  "PRICE_ASC",
  "PRICE_DESC",
  "RATING_DESC",
  "HVMI_FIRST",
  "DISTANCE",
]);
export type AccommodationSortMode = z.infer<typeof AccommodationSortModeSchema>;

// ─── Guest Composition ────────────────────────────────────────────────────────

export const GuestCompositionSchema = z
  .object({
    adults: z.number().int().min(1, "At least 1 adult required").max(20),
    children: z.number().int().min(0).max(12).optional().default(0),
    infants: z.number().int().min(0).max(4).optional().default(0),
    pets: z.number().int().min(0).max(4).optional().default(0),
  });
export type GuestComposition = z.infer<typeof GuestCompositionSchema>;

// ─── Bonvoy Context ───────────────────────────────────────────────────────────

export const BonvoyContextSchema = z.object({
  memberId: z.string().min(1).optional(),
  tierLevel: z
    .enum(["MEMBER", "SILVER", "GOLD", "PLATINUM", "TITANIUM", "AMBASSADOR"])
    .optional(),
  pointsBalance: z.number().int().nonnegative().optional(),
  usePointsForStay: z.boolean().optional().default(false),
});
export type BonvoyContext = z.infer<typeof BonvoyContextSchema>;

// ─── Accommodation Search Request ─────────────────────────────────────────────

export const AccommodationSearchRequestSchema = z
  .object({
    /** Free-text destination — required when geo not provided. */
    destination: z.string().min(1).max(200).optional(),
    geo: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        radiusKm: z.number().positive().max(500).optional().default(25),
      })
      .optional(),
    /** ISO-8601 date; must be in the future */
    checkIn: isoDateString,
    /** ISO-8601 date; must be after checkIn */
    checkOut: isoDateString,
    guests: GuestCompositionSchema,
    propertyTypes: z.array(PropertyTypeSchema).min(1).max(7).optional(),
    /** Upper price bound per night in requested currency. */
    maxPricePerNight: positiveMoney.optional(),
    currency: currencyCode.optional().default("USD"),
    sort: AccommodationSortModeSchema.optional().default("HVMI_FIRST"),
    /** 1-indexed page number */
    page: z.number().int().min(1).max(100).optional().default(1),
    pageSize: z.number().int().min(1).max(50).optional().default(20),
    amenityFilters: z.array(z.string().min(1)).max(20).optional(),
    bonvoyContext: BonvoyContextSchema.optional(),
    correlationId: z.string().min(1).optional(),
  })
  .refine(
    (d) => d.destination !== undefined || d.geo !== undefined,
    { message: "Either destination text or geo coordinates must be provided", path: ["destination"] },
  )
  .superRefine((d, ctx) => {
    if (d.checkOut <= d.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOut"],
        message: "Check-out date must be after check-in date",
      });
    }
  });
export type AccommodationSearchRequest = z.infer<typeof AccommodationSearchRequestSchema>;

// ─── Price Summary ────────────────────────────────────────────────────────────

export const PriceSummarySchema = z.object({
  nightlyRate: positiveMoney,
  currency: currencyCode,
  /** Percentage discount from list price — 0 means no discount */
  discountPct: z.number().min(0).max(100).optional().default(0),
  taxesAndFees: positiveMoney.optional(),
  totalStay: positiveMoney.optional(),
  /** "Best available rate" — rate category label */
  rateCode: z.string().optional(),
});
export type PriceSummary = z.infer<typeof PriceSummarySchema>;

// ─── Availability Summary ─────────────────────────────────────────────────────

export const AvailabilitySummarySchema = z.object({
  available: z.boolean(),
  roomsLeft: z.number().int().nonnegative().optional(),
  soldOutMessage: z.string().optional(),
  minStayNights: z.number().int().positive().optional(),
});
export type AvailabilitySummary = z.infer<typeof AvailabilitySummarySchema>;

// ─── Bonvoy Earning Summary ───────────────────────────────────────────────────

export const BonvoySummarySchema = z.object({
  /** Estimated points for the full stay */
  pointsForStay: z.number().int().nonnegative(),
  pointsPerDollar: z.number().nonnegative().optional(),
  eliteBonus: z.boolean().optional().default(false),
  termsNote: z.string().optional(),
});
export type BonvoySummary = z.infer<typeof BonvoySummarySchema>;

// ─── Image Reference ──────────────────────────────────────────────────────────

export const AccommodationImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
  isPrimary: z.boolean().optional().default(false),
  category: z.enum(["EXTERIOR", "ROOM", "POOL", "AMENITY", "DINING", "OTHER"]).optional(),
});
export type AccommodationImage = z.infer<typeof AccommodationImageSchema>;

// ─── Rating Summary ───────────────────────────────────────────────────────────

export const RatingSummarySchema = z.object({
  score: z.number().min(0).max(10),
  reviewCount: z.number().int().nonnegative(),
  category: z.string().optional(),
});
export type RatingSummary = z.infer<typeof RatingSummarySchema>;

// ─── Policies Summary ────────────────────────────────────────────────────────

export const PoliciesSummarySchema = z.object({
  cancellationPolicy: z.string(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
});
export type PoliciesSummary = z.infer<typeof PoliciesSummarySchema>;

// ─── Accommodation Search Result ──────────────────────────────────────────────

export const AccommodationSearchResultSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  propertyType: PropertyTypeSchema,
  partnerClassification: PartnerClassificationSchema,
  /** True only for HVMI properties — sorted to the top of results. */
  hvmiPriority: z.boolean().default(false),
  location: z.object({
    address: z.string().optional(),
    city: z.string().min(1),
    country: z.string().min(2),
    regionLabel: z.string().optional(),
  }),
  /** May be absent if supplier did not return coordinates. */
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  images: z.array(AccommodationImageSchema).optional(),
  amenities: z.array(z.string()).optional(),
  ratingSummary: RatingSummarySchema.optional(),
  priceSummary: PriceSummarySchema,
  availabilitySummary: AvailabilitySummarySchema,
  bonvoySummary: BonvoySummarySchema.optional(),
  policiesSummary: PoliciesSummarySchema.optional(),
  /** Canonical data source — used for offer gating at checkout. */
  provenance: z.enum([
    "HVMI", "AMADEUS", "RAPIDAPI_HOTEL", "ILLUSTRATIVE", "MARRIOTT_DIRECT",
  ]),
  bookabilityStatus: BookabilityStatusSchema,
  sourceFetchedAt: isoDateTimeString,
  expiresAt: isoDateTimeString.optional(),
  /** HVMI collection name for display (e.g. "Vineyards & Winery Homes") */
  hvmiCollectionName: z.string().optional(),
});
export type AccommodationSearchResult = z.infer<typeof AccommodationSearchResultSchema>;

// ─── Accommodation Search Response ───────────────────────────────────────────

export const AccommodationSearchResponseSchema = z.object({
  queryId: z.string().min(1),
  correlationId: z.string().optional(),
  cacheStatus: z.enum(["HIT", "MISS", "BYPASS"]).optional(),
  results: z.array(AccommodationSearchResultSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalResults: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
  appliedFilters: z.record(z.string(), z.unknown()).optional(),
  freshness: z.object({
    fetchedAt: isoDateTimeString,
    expiresAt: isoDateTimeString.optional(),
    label: z.enum(["FRESH", "STALE", "EXPIRED"]),
  }),
  /**
   * Present when non-HVMI or non-Marriott results are included in the response.
   * Must be rendered prominently if non-empty.
   */
  fallbackDisclosure: z.string().optional(),
});
export type AccommodationSearchResponse = z.infer<typeof AccommodationSearchResponseSchema>;
