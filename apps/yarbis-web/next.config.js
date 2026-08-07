/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: "loose",
  },
  env: {
    NEXT_PUBLIC_CLAUDE_API_BASE: process.env.NEXT_PUBLIC_CLAUDE_API_BASE || "http://localhost:3000",
  },
};

module.exports = nextConfig;
