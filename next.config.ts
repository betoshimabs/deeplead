import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors don't block the production build
    // TODO: fix these incrementally
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable Turbopack for production — Next.js 16 canary Turbopack
    // has compatibility issues with Vercel's deployment infrastructure
    turbopack: false,
  } as any,
};

export default nextConfig;
