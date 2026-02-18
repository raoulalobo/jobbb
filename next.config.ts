import type { NextConfig } from "next";

/**
 * Configuration Next.js pour JobAgent
 * Utilise Turbopack en dev pour des rebuilds rapides
 */
const nextConfig: NextConfig = {
  // Activation du mode strict React pour detecter les problemes potentiels
  reactStrictMode: true,
};

export default nextConfig;
