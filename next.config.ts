import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/logo.png",
        destination:
          "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png",
      },
    ];
  },
};

export default nextConfig;
