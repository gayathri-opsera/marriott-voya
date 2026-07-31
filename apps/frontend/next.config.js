const { getSecurityHeadersArray } = require("./lib/headers.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@travel/contracts", "@travel/design-system"],
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeadersArray(),
      },
    ];
  },
};

module.exports = nextConfig;
