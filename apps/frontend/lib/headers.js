const SECURITY_HEADER_KEYS = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Content-Security-Policy-Report-Only",
];

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy-Report-Only": CSP_POLICY,
};

function getSecurityHeadersArray() {
  return Object.entries(securityHeaders).map(([key, value]) => ({ key, value }));
}

module.exports = {
  SECURITY_HEADER_KEYS,
  securityHeaders,
  getSecurityHeadersArray,
};
