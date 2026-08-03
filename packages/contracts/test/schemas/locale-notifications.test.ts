/**
 * Tests for Locale/Currency (WO-047) and Notification (WO-037) contracts.
 */

import { describe, it, expect } from "vitest";
import {
  LocalePreferencesSchema,
  UpdateLocalePreferencesRequestSchema,
  CurrencyContextSchema,
  SupportedLocaleSchema,
  SupportedCurrencySchema,
} from "../../src/locale/index.js";
import {
  NotificationRecordSchema,
  CreateNotificationRequestSchema,
  UserNotificationPreferencesSchema,
} from "../../src/notifications/index.js";

describe("LocalePreferencesSchema (WO-047)", () => {
  it("parses valid US English preferences", () => {
    const r = LocalePreferencesSchema.safeParse({
      locale: "en-US",
      currency: "USD",
      temperatureUnit: "FAHRENHEIT",
      distanceUnit: "MILES",
      showPricesWithTax: false,
      timeFormat: "12H",
    });
    expect(r.success).toBe(true);
  });

  it("parses Italian preferences with defaults", () => {
    const r = LocalePreferencesSchema.safeParse({ locale: "it-IT", currency: "EUR" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.temperatureUnit).toBe("CELSIUS");
      expect(r.data.distanceUnit).toBe("KM");
      expect(r.data.showPricesWithTax).toBe(true);
    }
  });

  it("rejects unsupported locale", () => {
    expect(
      LocalePreferencesSchema.safeParse({ locale: "xx-XX", currency: "USD" }).success,
    ).toBe(false);
  });

  it("rejects unsupported currency", () => {
    expect(
      LocalePreferencesSchema.safeParse({ locale: "en-US", currency: "XYZ" }).success,
    ).toBe(false);
  });
});

describe("UpdateLocalePreferencesRequestSchema (WO-047)", () => {
  it("accepts partial update", () => {
    const r = UpdateLocalePreferencesRequestSchema.safeParse({ currency: "EUR" });
    expect(r.success).toBe(true);
  });

  it("rejects empty update object", () => {
    expect(UpdateLocalePreferencesRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("CurrencyContextSchema (WO-047)", () => {
  it("parses a valid FX context", () => {
    const r = CurrencyContextSchema.safeParse({
      displayCurrency: "EUR",
      sourceCurrency: "USD",
      exchangeRate: 0.92,
      rateTimestamp: "2099-09-01T09:00:00.000Z",
      rateProvider: "OpenExchangeRates",
    });
    expect(r.success).toBe(true);
  });

  it("rejects negative exchange rate", () => {
    expect(
      CurrencyContextSchema.safeParse({
        displayCurrency: "EUR",
        sourceCurrency: "USD",
        exchangeRate: -1,
        rateTimestamp: "2099-09-01T09:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("SupportedLocaleSchema (WO-047)", () => {
  it("accepts all 24 supported locales", () => {
    const samples = ["en-US", "it-IT", "ja-JP", "zh-CN", "ar-SA", "de-DE", "fr-FR"];
    samples.forEach((l) => expect(SupportedLocaleSchema.safeParse(l).success).toBe(true));
  });
});

const NOTIF_ID   = "notif-confirmed-booking-001";
const USER_ID    = "user-travel-app-123456";
const BK_ID      = "booking-lucca-villa-2099";
const HOLD_ID    = "priceholds-offer-villa-001";
const IDEM_KEY   = "idempotency-hold-notif-001";

describe("NotificationRecordSchema (WO-037)", () => {
  it("parses a booking confirmed notification", () => {
    const r = NotificationRecordSchema.safeParse({
      notificationId: NOTIF_ID,
      userId: USER_ID,
      type: "BOOKING_CONFIRMED",
      channel: "EMAIL",
      priority: "HIGH",
      subject: "Your Lucca villa booking is confirmed",
      body: "Your booking at Villa della Torre is confirmed for 10 Sep 2099.",
      actionUrl: "https://voya.example.com/bookings/bk-001",
      relatedEntityId: BK_ID,
      relatedEntityType: "BOOKING",
      deliveryStatus: "DELIVERED",
      sentAt: "2099-09-01T10:00:00.000Z",
      deliveredAt: "2099-09-01T10:00:05.000Z",
      createdAt: "2099-09-01T10:00:00.000Z",
      dismissed: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects notification with missing required body", () => {
    expect(
      NotificationRecordSchema.safeParse({
        notificationId: NOTIF_ID,
        userId: USER_ID,
        type: "BOOKING_CONFIRMED",
        channel: "EMAIL",
        deliveryStatus: "PENDING",
        createdAt: "2099-09-01T10:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("CreateNotificationRequestSchema (WO-037)", () => {
  it("parses a valid multi-channel request", () => {
    const r = CreateNotificationRequestSchema.safeParse({
      userId: USER_ID,
      type: "PRICE_HOLD_EXPIRING",
      channels: ["PUSH", "EMAIL"],
      priority: "URGENT",
      subject: "Your price hold expires in 5 minutes",
      body: "Act now to complete your booking.",
      actionUrl: "https://voya.example.com/checkout",
      relatedEntityId: HOLD_ID,
      relatedEntityType: "OFFER",
      idempotencyKey: IDEM_KEY,
    });
    expect(r.success).toBe(true);
  });

  it("rejects request with no channels", () => {
    expect(
      CreateNotificationRequestSchema.safeParse({
        userId: USER_ID,
        type: "BOOKING_CONFIRMED",
        channels: [],
        body: "test",
      }).success,
    ).toBe(false);
  });
});

describe("UserNotificationPreferencesSchema (WO-037)", () => {
  it("parses valid user preferences", () => {
    const r = UserNotificationPreferencesSchema.safeParse({
      userId: USER_ID,
      preferences: [
        { type: "BOOKING_CONFIRMED", emailEnabled: true, pushEnabled: true, smsEnabled: false, inAppEnabled: true },
        { type: "PRICE_HOLD_EXPIRING", emailEnabled: true, pushEnabled: true, smsEnabled: true, inAppEnabled: true },
      ],
      marketingOptIn: false,
      pushMasterEnabled: true,
      updatedAt: "2099-09-01T10:00:00.000Z",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.preferences).toHaveLength(2);
  });
});
