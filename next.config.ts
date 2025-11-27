import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',  // ⚠️ Décommenter uniquement pour build mobile (désactive les API routes)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
