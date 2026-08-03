/**
 * Marriott Booking Extensions — WO-029
 *
 * Extends the base booking contracts with:
 * - HVMI/Villa booking type and room details
 * - Price-hold workflow (reserve now, pay later)
 * - Bonvoy points accrual tracking per booking
 * - Cancellation policies per booking type
 */

import { z } from "zod";
import { identifier, isoDateString, isoDateTimeString, positiveMoney, currencyCode } from "../common/primitives.js";
import { BookingStatusSchema, BookingTypeSchema, PassengerInfoSchema } from "./index.js";
import { PartnerClassificationSchema } from "../search/accommodation.js";
import { BonvoySummarySchema } from "../search/accommodation.js";

// ─── Extended Booking Type ────────────────────────────────────────────────────

export const ExtendedBookingTypeSchema = z.enum([
  "FLIGHT",
  "HOTEL",
  "CAR",
  "VILLA",        // HVMI villa (WO-029)
  "HOME",         // HVMI home (WO-029)
  "APARTMENT",    // HVMI apartment (WO-029)
  "TOUR_ACTIVITY",// Bonvoy Tours & Activities (WO-029)
  "TRANSFER",     // Ground transport
]);
export type ExtendedBookingType = z.infer<typeof ExtendedBookingTypeSchema>;

// ─── Price Hold ───────────────────────────────────────────────────────────────

export const PriceHoldStatusSchema = z.enum([
  "ACTIVE",
  "EXPIRED",
  "CONVERTED",  // Hold converted to a confirmed booking
  "RELEASED",   // User explicitly released the hold
]);
export type PriceHoldStatus = z.infer<typeof PriceHoldStatusSchema>;

export const PriceHoldSchema = z.object({
  holdId: identifier,
  offerId: identifier,
  userId: identifier,
  status: PriceHoldStatusSchema,
  heldAmount: positiveMoney,
  currency: currencyCode,
  expiresAt: isoDateTimeString,
  createdAt: isoDateTimeString,
  convertedBookingId: identifier.optional(),
});
export type PriceHold = z.infer<typeof PriceHoldSchema>;

export const CreatePriceHoldRequestSchema = z.object({
  offerId: identifier,
  /** How long to hold (minutes); system enforces max of 15 */
  holdDurationMinutes: z.number().int().min(1).max(15).optional().default(10),
  idempotencyKey: identifier,
});
export type CreatePriceHoldRequest = z.infer<typeof CreatePriceHoldRequestSchema>;

// ─── Bonvoy Accrual ───────────────────────────────────────────────────────────

export const BonvoyAccrualRecordSchema = z.object({
  accrualId: identifier,
  bookingId: identifier,
  memberId: z.string().min(1),
  pointsEarned: z.number().int().nonnegative(),
  tierBonusPct: z.number().min(0).max(300).optional().default(0),
  activityType: z.enum(["STAY", "TOUR", "TRANSFER", "DINING", "SPA"]),
  status: z.enum(["PENDING", "POSTED", "REVERSED"]),
  postedAt: isoDateTimeString.optional(),
  createdAt: isoDateTimeString,
});
export type BonvoyAccrualRecord = z.infer<typeof BonvoyAccrualRecordSchema>;

// ─── Accommodation Booking Details ───────────────────────────────────────────

export const AccommodationBookingDetailsSchema = z.object({
  propertyId: z.string().min(1),
  propertyName: z.string().min(1),
  partnerClassification: PartnerClassificationSchema,
  hvmiCollectionName: z.string().optional(),
  checkIn: isoDateString,
  checkOut: isoDateString,
  roomType: z.string().min(1),
  bedConfiguration: z.string().optional(),
  maxGuests: z.number().int().positive(),
  address: z.string().optional(),
  confirmationCode: z.string().optional(),
  bonvoySummary: BonvoySummarySchema.optional(),
});
export type AccommodationBookingDetails = z.infer<typeof AccommodationBookingDetailsSchema>;

// ─── Extended Create Booking Request ─────────────────────────────────────────

export const CreateAccommodationBookingRequestSchema = z.object({
  offerId: identifier,
  bookingType: ExtendedBookingTypeSchema,
  passengers: z.array(PassengerInfoSchema).min(1).max(20),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  currency: currencyCode,
  idempotencyKey: identifier,
  /** Pre-existing price hold to convert */
  priceHoldId: identifier.optional(),
  bonvoyMemberId: z.string().optional(),
  specialRequests: z.string().max(1000).optional(),
  accommodationDetails: AccommodationBookingDetailsSchema.optional(),
});
export type CreateAccommodationBookingRequest = z.infer<typeof CreateAccommodationBookingRequestSchema>;

// ─── Cancellation Policy ─────────────────────────────────────────────────────

export const CancellationPolicySchema = z.object({
  /** Human-readable policy description */
  description: z.string().min(1),
  /** ISO datetime after which cancellation incurs penalty */
  penaltyAfter: isoDateTimeString.optional(),
  /** Penalty amount (absent = full refund always) */
  penaltyAmount: positiveMoney.optional(),
  penaltyCurrency: currencyCode.optional(),
  penaltyPct: z.number().min(0).max(100).optional(),
  fullyRefundable: z.boolean(),
});
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;
