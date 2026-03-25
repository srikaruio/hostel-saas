import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* Optimization: Reduce file watching overhead */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/build/**"
        ],
        poll: false, // Don't use polling to save CPU
      };
    }
    return config;
  },
  // Ensure the cache is handled correctly
  distDir: ".next",
};

export default nextConfig;
