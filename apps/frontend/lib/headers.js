const SECURITY_HEADER_KEYS = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
  "X-Permitted-Cross-Domain-Policies",
  "Content-Security-Policy",
];

/**
 * CSP — WOREF-042
 * Enforced (not report-only). Allows:
 * - Stripe for payments
 * - Unsplash for villa images
 * - Anthropic streaming API
 * - Google Fonts
 * - Marriott CDN assets
 */
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://homes-and-villas.marriott.com https://cache.marriott.com https://*.bonvoy.com",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com https://api.anthropic.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com https://*.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Content-Security-Policy": CSP_POLICY,
};

function getSecurityHeadersArray() {
  return Object.entries(securityHeaders).map(([key, value]) => ({ key, value }));
}

module.exports = {
  SECURITY_HEADER_KEYS,
  securityHeaders,
  getSecurityHeadersArray,
};
