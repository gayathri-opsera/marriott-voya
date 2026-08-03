/**
 * Secure Payment Extensions — WO-036
 *
 * Extends the base payment contracts with:
 * - 3-D Secure / SCA challenge flow
 * - Bonvoy points redemption
 * - Price-hold capture
 * - PCI-DSS compliance metadata
 */

import { z } from "zod";
import { identifier, positiveMoney, currencyCode, isoDateTimeString } from "../common/primitives.js";
import { PaymentStatusSchema, PaymentMethodTypeSchema } from "./index.js";

// ─── Extended Payment Method ──────────────────────────────────────────────────

export const ExtendedPaymentMethodTypeSchema = z.enum([
  "CARD",
  "BANK_TRANSFER",
  "WALLET",
  "BONVOY_POINTS",   // Full or partial redemption with Bonvoy points
  "SPLIT",           // Card + points split payment
]);
export type ExtendedPaymentMethodType = z.infer<typeof ExtendedPaymentMethodTypeSchema>;

// ─── 3-D Secure / SCA ────────────────────────────────────────────────────────

export const ThreeDsStatusSchema = z.enum([
  "NOT_REQUIRED",
  "PENDING_CHALLENGE",
  "CHALLENGE_COMPLETED",
  "CHALLENGE_FAILED",
  "EXEMPTED",
]);
export type ThreeDsStatus = z.infer<typeof ThreeDsStatusSchema>;

export const ThreeDsChallengeSchema = z.object({
  status: ThreeDsStatusSchema,
  challengeUrl: z.string().url().optional(),
  transactionId: z.string().optional(),
  eci: z.string().optional(),   // Electronic Commerce Indicator
  exemptionReason: z.string().optional(),
});
export type ThreeDsChallenge = z.infer<typeof ThreeDsChallengeSchema>;

// ─── Bonvoy Points Redemption ─────────────────────────────────────────────────

export const PointsRedemptionSchema = z.object({
  memberId: z.string().min(1),
  pointsToRedeem: z.number().int().positive(),
  /** USD value of points (for audit) */
  pointsValueUsd: positiveMoney,
  /** Remaining balance after redemption */
  remainingBalance: z.number().int().nonnegative().optional(),
  redemptionConfirmationCode: z.string().optional(),
});
export type PointsRedemption = z.infer<typeof PointsRedemptionSchema>;

// ─── Price Hold Capture ───────────────────────────────────────────────────────

export const PriceHoldCaptureRequestSchema = z.object({
  bookingId: identifier,
  priceHoldId: identifier,
  amount: positiveMoney,
  currency: currencyCode,
  paymentMethodType: ExtendedPaymentMethodTypeSchema,
  pointsRedemption: PointsRedemptionSchema.optional(),
  idempotencyKey: identifier,
  /** 3DS completion token from the front-end challenge flow */
  threeDsCompletionToken: z.string().optional(),
});
export type PriceHoldCaptureRequest = z.infer<typeof PriceHoldCaptureRequestSchema>;

// ─── Secure Payment Intent Request ───────────────────────────────────────────

export const SecurePaymentIntentRequestSchema = z.object({
  bookingId: identifier,
  amount: positiveMoney,
  currency: currencyCode,
  paymentMethodType: ExtendedPaymentMethodTypeSchema,
  pointsRedemption: PointsRedemptionSchema.optional(),
  idempotencyKey: identifier,
  returnUrl: z.string().url().optional(),
  /** If true, request 3DS even below SCA threshold */
  force3ds: z.boolean().optional().default(false),
});
export type SecurePaymentIntentRequest = z.infer<typeof SecurePaymentIntentRequestSchema>;

// ─── Secure Payment Intent Response ──────────────────────────────────────────

export const SecurePaymentIntentResponseSchema = z.object({
  paymentIntentId: identifier,
  bookingId: identifier,
  status: PaymentStatusSchema,
  amount: positiveMoney,
  currency: currencyCode,
  clientSecret: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  threeDs: ThreeDsChallengeSchema.optional(),
  pointsRedemption: PointsRedemptionSchema.optional(),
  pciCompliant: z.literal(true),   // Always present — asserts PCI-DSS compliance
  createdAt: isoDateTimeString,
  expiresAt: isoDateTimeString.optional(),
});
export type SecurePaymentIntentResponse = z.infer<typeof SecurePaymentIntentResponseSchema>;

// ─── PCI-DSS Compliance Record ────────────────────────────────────────────────

export const PciComplianceRecordSchema = z.object({
  paymentId: identifier,
  /** PCI scope level */
  scope: z.enum(["SAQ_A", "SAQ_A_EP", "SAQ_D", "LEVEL_1"]),
  /** Last assessed date */
  lastAssessedAt: isoDateTimeString,
  /** Payment processor that holds PAN data */
  processorName: z.string().min(1),
  /** True = this service never touches PAN */
  outOfScope: z.boolean(),
  tokenizationMethod: z.string().optional(),
});
export type PciComplianceRecord = z.infer<typeof PciComplianceRecordSchema>;
