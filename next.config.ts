import type { NextConfig } from "next";

/**
 * Configuration Next.js pour JobAgent
 * Utilise Turbopack en dev pour des rebuilds rapides
 */
const nextConfig: NextConfig = {
  // Activation du mode strict React pour detecter les problemes potentiels
  reactStrictMode: true,

  /**
   * Exclure @react-pdf/renderer du bundling Turbopack/Webpack côté serveur.
   * Sans cette config, Turbopack tente de bundler les dépendances Node natives
   * de react-pdf (canvas, fontkit, etc.) ce qui cause des erreurs de build.
   * Ces packages sont chargés dynamiquement par Node.js au runtime.
   */
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
