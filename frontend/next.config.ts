import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  ...(process.env.TURBO_BUILD === "true"
    ? {
        turbopack: {
          root: process.cwd(),
        },
      }
    : {}),
  
  images: {
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
