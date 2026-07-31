/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@travel/contracts", "@travel/design-system"],
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

module.exports = nextConfig;
