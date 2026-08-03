/**
 * CSRF Protection — WOREF-041
 *
 * Double-submit cookie pattern for SPA + API Gateway.
 * The CSRF token is:
 *  1. Generated at session start and stored in a JS-readable cookie (csrf-token)
 *  2. Must be sent in the X-CSRF-Token header on all state-mutating requests
 *  3. The API Gateway validates that header === cookie value
 *
 * IMPORTANT:
 * - The csrf-token cookie is NOT HttpOnly so JS can read it
 * - The session cookie IS HttpOnly and Secure — not accessible to JS
 * - Attacks from other origins cannot read the csrf-token cookie (SameSite=Strict)
 * - This implements the OWASP Signed Double-Submit Cookie pattern
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const TOKEN_ENTROPY_BYTES = 32;

/**
 * Generate a cryptographically random CSRF token.
 * Uses Web Crypto API (available in browser and Node 19+).
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_ENTROPY_BYTES);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Node.js fallback
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, "");
}

/**
 * Read the CSRF token from the csrf-token cookie.
 * Returns null if cookie is not set.
 */
export function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

/**
 * Set the CSRF token cookie (called at session start).
 * SameSite=Strict prevents cross-site request forgery via form submissions.
 */
export function setCsrfCookie(token: string, secure = location.protocol === "https:"): void {
  if (typeof document === "undefined") return;
  const cookieValue = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "path=/",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
  document.cookie = cookieValue;
}

/**
 * Ensure a CSRF token is set, generating one if needed.
 * Call this at app initialization.
 */
export function ensureCsrfToken(): string {
  let token = readCsrfTokenFromCookie();
  if (!token) {
    token = generateCsrfToken();
    setCsrfCookie(token);
  }
  return token;
}

/**
 * Get the CSRF header value to add to mutation requests.
 * Usage: headers[CSRF_HEADER_NAME] = getCsrfHeader()
 */
export function getCsrfHeader(): Record<string, string> {
  const token = readCsrfTokenFromCookie();
  if (!token) return {};
  return { [CSRF_HEADER_NAME]: token };
}

/** The header name for use in API clients */
export { CSRF_HEADER_NAME };

/**
 * Verify CSRF token on the server side (Node.js / API Gateway middleware).
 * Returns true if valid, false if mismatch or missing.
 */
export function verifyCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined,
): boolean {
  if (!cookieToken || !headerToken) return false;
  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return mismatch === 0;
}
