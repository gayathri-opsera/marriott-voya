/**
 * PII Classification and Masking — WOREF-040
 *
 * Provides:
 * - PII field classification (RESTRICTED, PII, PUBLIC)
 * - Masking functions for display — never for storage
 * - Redaction helpers for logging/analytics
 *
 * Rules:
 * - RESTRICTED fields: never log, never send to analytics
 * - PII fields: mask for display, never include in error payloads
 * - PUBLIC fields: safe to include in logs and analytics
 *
 * GDPR Art. 4(1): "personal data" = any info relating to an identified or
 * identifiable natural person. Treat conservatively.
 */

// ─── Data Classification Labels ───────────────────────────────────────────────

export type DataClass = "RESTRICTED" | "PII" | "PUBLIC";

/**
 * Field-level data classification for user profile and booking objects.
 * Keys match the contract field names.
 */
export const FIELD_CLASSIFICATION: Record<string, DataClass> = {
  // Identity — RESTRICTED
  passportNumber:     "RESTRICTED",
  dateOfBirth:        "RESTRICTED",
  creditCardNumber:   "RESTRICTED",
  cvv:                "RESTRICTED",
  bankAccountNumber:  "RESTRICTED",
  taxId:              "RESTRICTED",
  governmentId:       "RESTRICTED",
  // PII — mask for display
  firstName:          "PII",
  lastName:           "PII",
  contactEmail:       "PII",
  contactPhone:       "PII",
  memberId:           "PII",
  address:            "PII",
  // Public — safe for analytics
  bookingId:          "PUBLIC",
  offerId:            "PUBLIC",
  propertyId:         "PUBLIC",
  propertyName:       "PUBLIC",
  bookingType:        "PUBLIC",
  currency:           "PUBLIC",
  status:             "PUBLIC",
  checkIn:            "PUBLIC",
  checkOut:           "PUBLIC",
  partnerClassification: "PUBLIC",
};

export function classifyField(fieldName: string): DataClass {
  return FIELD_CLASSIFICATION[fieldName] ?? "PII"; // conservative default
}

// ─── Masking Functions ────────────────────────────────────────────────────────

/** Mask an email: john.doe@example.com → jo**@example.com */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return "••••@••••";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(4, local.length - 2))}${domain}`;
}

/** Mask a phone: +1-555-867-5309 → +1-•••-•••-5309 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const last4 = digits.slice(-4);
  return `${"•".repeat(digits.length - 4)}-${last4}`;
}

/** Mask a passport/government ID: AB123456 → AB•••••6 */
export function maskId(id: string): string {
  if (id.length <= 2) return "••";
  const first2 = id.slice(0, 2);
  const last1  = id.slice(-1);
  return `${first2}${"•".repeat(id.length - 3)}${last1}`;
}

/** Mask a name: John Doe → J*** D** */
export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (w.length <= 1 ? w : w[0] + "•".repeat(w.length - 1)))
    .join(" ");
}

/** Mask a Bonvoy member ID: BONVOY-12345 → BONVOY-•••45 */
export function maskMemberId(id: string): string {
  if (!id) return "••••••";
  const last3 = id.slice(-3);
  const prefix = id.slice(0, Math.max(0, id.length - 3));
  return `${prefix.replace(/[0-9]/g, "•")}${last3}`;
}

// ─── Object Redaction (for logging) ──────────────────────────────────────────

/**
 * Redact all PII and RESTRICTED fields from an object for safe logging.
 * Returns a new object; does not mutate the original.
 *
 * @example
 * redactForLogging({ firstName: "John", bookingId: "abc123" })
 * // → { firstName: "[REDACTED:PII]", bookingId: "abc123" }
 */
export function redactForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const cls = classifyField(key);
    if (cls === "RESTRICTED") {
      result[key] = "[REDACTED:RESTRICTED]";
    } else if (cls === "PII") {
      result[key] = "[REDACTED:PII]";
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Deep redact nested objects for logging.
 * Handles one level of nesting for common booking/user structures.
 */
export function deepRedactForLogging(obj: unknown, depth = 0): unknown {
  if (depth > 3) return "[DEPTH_LIMIT]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepRedactForLogging(item, depth + 1));
  return redactForLogging(
    Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
        const cls = classifyField(k);
        if (cls !== "PUBLIC") return [k, cls === "RESTRICTED" ? "[REDACTED:RESTRICTED]" : "[REDACTED:PII]"];
        return [k, deepRedactForLogging(v, depth + 1)];
      }),
    ),
  );
}

// ─── Analytics Safe Payload ───────────────────────────────────────────────────

/**
 * Extract only PUBLIC-classified fields from an object for analytics payloads.
 * This is the canonical way to build analytics event properties.
 *
 * @example
 * analyticsPayload({ bookingId: "abc", firstName: "John" })
 * // → { bookingId: "abc" }
 */
export function analyticsPayload(obj: Record<string, unknown>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (classifyField(key) === "PUBLIC") {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        result[key] = value;
      }
    }
  }
  return result;
}
