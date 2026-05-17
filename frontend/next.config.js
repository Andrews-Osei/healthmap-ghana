/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode double-mounts components in dev, which compounds map cost.
  // Turn off in dev for smoother dashboard interaction.
  reactStrictMode: false,
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

module.exports = nextConfig;
