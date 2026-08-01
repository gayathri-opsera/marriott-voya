const { getSecurityHeadersArray } = require("./lib/headers.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@travel/contracts", "@travel/design-system"],
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "homes-and-villas.marriott.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeadersArray(),
      },
    ];
  },
  // Proxy all API calls through Next.js so bookings bypass the misconfigured gateway
  async rewrites() {
    return [
      // Bookings go direct to the booking service (gateway has wrong default port 3003)
      { source: "/api/v1/bookings/:path*", destination: "http://localhost:4003/api/v1/bookings/:path*" },
      { source: "/bookings/:path*",        destination: "http://localhost:4003/api/v1/bookings/:path*" },
      // AI chat & sessions handled by Next.js Route Handlers (direct Anthropic access)
      // These are NOT proxied — they are served by Next.js itself
      // Search
      { source: "/api/v1/search/:path*",   destination: "http://localhost:3005/api/v1/search/:path*" },
      { source: "/search/:path*",          destination: "http://localhost:3005/search/:path*" },
      { source: "/offers/:path*",          destination: "http://localhost:3005/offers/:path*" },
      // Auth
      { source: "/api/v1/auth/:path*",     destination: "http://localhost:3002/api/v1/auth/:path*" },
      // Users
      { source: "/api/v1/users/:path*",    destination: "http://localhost:4001/api/v1/users/:path*" },
      // Everything else hits the gateway
      { source: "/api/:path*",             destination: "http://localhost:3010/api/:path*" },
    ];
  },
};

module.exports = nextConfig;
