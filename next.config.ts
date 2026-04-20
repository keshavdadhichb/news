import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  // Allow all image domains
  images: {
    remotePatterns: [],
  },
  // Environment variables available server-side only
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "AIzaSyDEzuR5NT-n0NYq18VGbYfmL0rKHE0yRig",
  },
};

export default nextConfig;
