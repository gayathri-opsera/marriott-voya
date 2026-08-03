/**
 * Locale & Currency Selection Contracts — WO-047
 *
 * Zod schemas for user locale preferences, currency selection, and
 * locale-aware number/date formatting context. Shared by frontend
 * and backend to ensure consistent locale handling.
 */

import { z } from "zod";

// ─── Supported Locales ────────────────────────────────────────────────────────

/** BCP-47 locale tags supported by the platform. */
export const SupportedLocaleSchema = z.enum([
  "en-US", "en-GB", "en-AU", "en-CA",
  "fr-FR", "fr-CA",
  "de-DE", "de-AT", "de-CH",
  "es-ES", "es-MX",
  "it-IT",
  "pt-BR", "pt-PT",
  "ja-JP",
  "zh-CN", "zh-TW",
  "ko-KR",
  "ar-SA",
  "nl-NL",
  "pl-PL",
  "ru-RU",
  "sv-SE",
  "tr-TR",
]);
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;

// ─── Supported Currencies ─────────────────────────────────────────────────────

/** ISO-4217 currency codes supported for pricing display. */
export const SupportedCurrencySchema = z.enum([
  "USD", "EUR", "GBP", "AUD", "CAD",
  "JPY", "CHF", "CNY", "HKD", "SGD",
  "KRW", "BRL", "MXN", "INR", "AED",
  "SAR", "THB", "SEK", "NOK", "DKK",
  "PLN", "CZK", "HUF", "RUB", "TRY",
]);
export type SupportedCurrency = z.infer<typeof SupportedCurrencySchema>;

// ─── Date Format Preferences ──────────────────────────────────────────────────

export const DateFormatPreferenceSchema = z.enum([
  "MM/DD/YYYY",    // US
  "DD/MM/YYYY",    // UK, EU
  "YYYY-MM-DD",    // ISO / Asia
  "DD.MM.YYYY",    // DE, CH
  "YYYY年MM月DD日", // JP/CN
]);
export type DateFormatPreference = z.infer<typeof DateFormatPreferenceSchema>;

// ─── Temperature Unit ─────────────────────────────────────────────────────────

export const TemperatureUnitSchema = z.enum(["CELSIUS", "FAHRENHEIT"]);
export type TemperatureUnit = z.infer<typeof TemperatureUnitSchema>;

// ─── Distance Unit ────────────────────────────────────────────────────────────

export const DistanceUnitSchema = z.enum(["KM", "MILES"]);
export type DistanceUnit = z.infer<typeof DistanceUnitSchema>;

// ─── Locale Preferences (user persisted) ─────────────────────────────────────

export const LocalePreferencesSchema = z.object({
  locale: SupportedLocaleSchema,
  currency: SupportedCurrencySchema,
  /** Override the locale-default date format */
  dateFormat: DateFormatPreferenceSchema.optional(),
  temperatureUnit: TemperatureUnitSchema.optional().default("CELSIUS"),
  distanceUnit: DistanceUnitSchema.optional().default("KM"),
  /** Whether prices include taxes by default */
  showPricesWithTax: z.boolean().optional().default(true),
  /** 12/24h time display */
  timeFormat: z.enum(["12H", "24H"]).optional().default("24H"),
});
export type LocalePreferences = z.infer<typeof LocalePreferencesSchema>;

// ─── Update request ───────────────────────────────────────────────────────────

export const UpdateLocalePreferencesRequestSchema = LocalePreferencesSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: "At least one preference field must be provided" },
);
export type UpdateLocalePreferencesRequest = z.infer<typeof UpdateLocalePreferencesRequestSchema>;

// ─── Currency Context (attached to API responses with pricing) ────────────────

export const CurrencyContextSchema = z.object({
  /** Requested display currency */
  displayCurrency: SupportedCurrencySchema,
  /** Original currency from supplier */
  sourceCurrency: SupportedCurrencySchema,
  /** FX rate used: displayCurrency per 1 sourceCurrency unit */
  exchangeRate: z.number().positive(),
  /** When this rate was fetched */
  rateTimestamp: z.string().datetime(),
  /** Provider of the FX rate */
  rateProvider: z.string().optional(),
});
export type CurrencyContext = z.infer<typeof CurrencyContextSchema>;

// ─── Locale-aware money formatting ────────────────────────────────────────────

export const MoneyDisplaySchema = z.object({
  amount: z.number(),
  currency: SupportedCurrencySchema,
  /** Pre-formatted string for direct display (locale-sensitive) */
  formatted: z.string(),
  /** Whether formatted string includes taxes */
  includesTax: z.boolean().default(false),
});
export type MoneyDisplay = z.infer<typeof MoneyDisplaySchema>;
