/**
 * Tests for Marriott Booking (WO-029) and Secure Payment (WO-036) extensions.
 */

import { describe, it, expect } from "vitest";
import {
  PriceHoldSchema,
  CreatePriceHoldRequestSchema,
  BonvoyAccrualRecordSchema,
  AccommodationBookingDetailsSchema,
  CreateAccommodationBookingRequestSchema,
  CancellationPolicySchema,
  ExtendedBookingTypeSchema,
} from "../../src/booking/marriott-booking.js";
import {
  SecurePaymentIntentRequestSchema,
  SecurePaymentIntentResponseSchema,
  PointsRedemptionSchema,
  PciComplianceRecordSchema,
} from "../../src/payment/secure-payment.js";

const HOLD_ID     = "priceholds-hvmi-villa-0001";
const OFFER_ID    = "offer-hvmi-villa-della-0001";
const USER_ID     = "user-travel-app-123456789";
const BOOKING_ID  = "booking-lucca-villa-099abc";
const ACCRUAL_ID  = "accrual-bonvoy-stay-001234";
const IDEM_KEY    = "idempotency-hold-key-00001";

describe("PriceHoldSchema (WO-029)", () => {
  it("parses an active price hold", () => {
    const r = PriceHoldSchema.safeParse({
      holdId: HOLD_ID,
      offerId: OFFER_ID,
      userId: USER_ID,
      status: "ACTIVE",
      heldAmount: "450.00",
      currency: "USD",
      expiresAt: "2099-09-01T10:10:00.000Z",
      createdAt: "2099-09-01T10:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("parses a converted price hold with booking reference", () => {
    const r = PriceHoldSchema.safeParse({
      holdId: "priceholds-hvmi-villa-0002",
      offerId: "offer-hvmi-villa-della-0002",
      userId: USER_ID,
      status: "CONVERTED",
      heldAmount: "900.00",
      currency: "EUR",
      expiresAt: "2099-09-01T10:10:00.000Z",
      createdAt: "2099-09-01T10:00:00.000Z",
      convertedBookingId: BOOKING_ID,
    });
    expect(r.success).toBe(true);
  });
});

describe("CreatePriceHoldRequestSchema (WO-029)", () => {
  it("parses request with defaults", () => {
    const r = CreatePriceHoldRequestSchema.safeParse({
      offerId: OFFER_ID,
      idempotencyKey: IDEM_KEY,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.holdDurationMinutes).toBe(10);
  });

  it("rejects duration > 15 minutes", () => {
    expect(
      CreatePriceHoldRequestSchema.safeParse({
        offerId: OFFER_ID,
        holdDurationMinutes: 20,
        idempotencyKey: IDEM_KEY,
      }).success,
    ).toBe(false);
  });
});

describe("BonvoyAccrualRecordSchema (WO-029)", () => {
  it("parses a stay accrual in pending status", () => {
    const r = BonvoyAccrualRecordSchema.safeParse({
      accrualId: ACCRUAL_ID,
      bookingId: BOOKING_ID,
      memberId: "BONVOY-12345",
      pointsEarned: 4500,
      tierBonusPct: 25,
      activityType: "STAY",
      status: "PENDING",
      createdAt: "2099-09-01T10:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });
});

describe("AccommodationBookingDetailsSchema (WO-029)", () => {
  it("parses HVMI villa booking details", () => {
    const r = AccommodationBookingDetailsSchema.safeParse({
      propertyId: "hvmi-villa-della-torre",
      propertyName: "Villa della Torre",
      partnerClassification: "HVMI",
      hvmiCollectionName: "Vineyards & Winery Homes",
      checkIn: "2099-09-10T00:00:00.000Z",
      checkOut: "2099-09-14T00:00:00.000Z",
      roomType: "3-Bedroom Villa",
      bedConfiguration: "2 King + 2 Twin",
      maxGuests: 6,
      address: "Via della Torre, Lucca, Italy",
      confirmationCode: "HVMI-LUC-2099",
    });
    expect(r.success).toBe(true);
  });
});

describe("ExtendedBookingTypeSchema (WO-029)", () => {
  it("accepts VILLA, HOME, APARTMENT types", () => {
    ["VILLA", "HOME", "APARTMENT", "TOUR_ACTIVITY", "TRANSFER"].forEach((t) =>
      expect(ExtendedBookingTypeSchema.safeParse(t).success).toBe(true),
    );
  });
});

const PAY_INTENT_ID = "payment-intent-secure-0001";
const IDEM_PAY      = "idempotency-pay-card-00001";

describe("PointsRedemptionSchema (WO-036)", () => {
  it("parses a valid points redemption", () => {
    const r = PointsRedemptionSchema.safeParse({
      memberId: "BONVOY-12345",
      pointsToRedeem: 10000,
      pointsValueUsd: "50.00",
      remainingBalance: 35000,
      redemptionConfirmationCode: "REDEEM-001",
    });
    expect(r.success).toBe(true);
  });

  it("rejects zero points redemption", () => {
    expect(
      PointsRedemptionSchema.safeParse({
        memberId: "BONVOY-123",
        pointsToRedeem: 0,
        pointsValueUsd: "0.00",
      }).success,
    ).toBe(false);
  });
});

describe("SecurePaymentIntentRequestSchema (WO-036)", () => {
  it("parses a standard card payment request", () => {
    const r = SecurePaymentIntentRequestSchema.safeParse({
      bookingId: BOOKING_ID,
      amount: "450.00",
      currency: "USD",
      paymentMethodType: "CARD",
      idempotencyKey: IDEM_PAY,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.force3ds).toBe(false);
  });

  it("parses a split payment with points", () => {
    const r = SecurePaymentIntentRequestSchema.safeParse({
      bookingId: BOOKING_ID,
      amount: "400.00",
      currency: "USD",
      paymentMethodType: "SPLIT",
      pointsRedemption: {
        memberId: "BONVOY-12345",
        pointsToRedeem: 5000,
        pointsValueUsd: "25.00",
      },
      idempotencyKey: "idempotency-pay-split-00001",
    });
    expect(r.success).toBe(true);
  });
});

describe("SecurePaymentIntentResponseSchema (WO-036)", () => {
  it("requires pciCompliant literal true", () => {
    const base = {
      paymentIntentId: PAY_INTENT_ID,
      bookingId: BOOKING_ID,
      status: "PENDING",
      amount: "450.00",
      currency: "USD",
      createdAt: "2099-09-01T10:00:00.000Z",
    };
    expect(SecurePaymentIntentResponseSchema.safeParse({ ...base, pciCompliant: true }).success).toBe(true);
    expect(SecurePaymentIntentResponseSchema.safeParse({ ...base, pciCompliant: false }).success).toBe(false);
    expect(SecurePaymentIntentResponseSchema.safeParse({ ...base }).success).toBe(false);
  });
});

describe("PciComplianceRecordSchema (WO-036)", () => {
  it("parses a valid compliance record", () => {
    const r = PciComplianceRecordSchema.safeParse({
      paymentId: "payment-stripe-record-0001",
      scope: "SAQ_A",
      lastAssessedAt: "2099-01-01T00:00:00.000Z",
      processorName: "Stripe",
      outOfScope: true,
      tokenizationMethod: "Stripe Token",
    });
    expect(r.success).toBe(true);
  });
});
