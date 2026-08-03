# Compliance Control Matrix

Maps regulatory controls to implementing code and test evidence.

## SOC2 CC6.1 — Authentication

| Control | Implementation | Evidence |
|---|---|---|
| Session management | `lib/session.ts` | `test/lib/session.test.ts` |
| Auth routes | `app/auth/*` | `test/routes/auth.test.tsx` |
| Session expiry banner | `components/auth/SessionExpiryBanner.tsx` | `test/components/SessionExpiryBanner.test.tsx` |
| Active session revocation | `app/profile/sessions/page.tsx` | `test/routes/sessions.test.tsx` |

## SOC2 CC7.2 — Encryption

| Control | Implementation | Evidence |
|---|---|---|
| Secure random idempotency keys | `lib/idempotency.ts` | `test/lib/idempotency.test.ts` |
| HTTPS-only headers | `lib/headers.ts` | `test/lib/headers.test.ts` |

## GDPR Art.17 — Right to Erasure

| Control | Implementation | Evidence |
|---|---|---|
| Account deletion | `app/profile/privacy/page.tsx` | `test/routes/privacy.test.tsx` |

## GDPR Art.20 — Data Portability

| Control | Implementation | Evidence |
|---|---|---|
| Data export | `app/profile/privacy/page.tsx` (`/api/v1/gdpr/export`) | `test/routes/privacy.test.tsx` |

## PCI-DSS — Payment Card Data

| Control | Implementation | Evidence |
|---|---|---|
| Stripe Elements isolation | `app/checkout/page.tsx` (Stripe iframe mount point) | `test/accessibility/checkout.test.tsx` |

## Privacy — PII in Telemetry

| Control | Implementation | Evidence |
|---|---|---|
| PII scan gate | `scripts/scan-pii.ts` | `test/lint/pii-scan.test.ts` |
| Analytics payload hygiene | `lib/analytics.ts`, `lib/vitals.ts` | `test/lint/pii-scan.test.ts` |

## Accessibility

| Control | Implementation | Evidence |
|---|---|---|
| Axe gate on all routes | `test/accessibility/all-routes.test.tsx` | CI test run |
| Contrast verification | `test/accessibility/contrast.test.ts` | Token values in `globals.css` |
| Focus/live-region conformance | `test/accessibility/focus.test.tsx` | Modal, Toast, MessageStream |
