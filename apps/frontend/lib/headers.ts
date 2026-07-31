import {
  SECURITY_HEADER_KEYS as KEYS,
  securityHeaders as HEADERS,
  getSecurityHeadersArray as getHeadersArray,
} from "./headers.js";

export const SECURITY_HEADER_KEYS = KEYS as readonly [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Content-Security-Policy-Report-Only",
];

export const securityHeaders = HEADERS as Record<(typeof SECURITY_HEADER_KEYS)[number], string>;

export function getSecurityHeadersArray(): Array<{ key: string; value: string }> {
  return getHeadersArray();
}
