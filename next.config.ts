import type { NextConfig } from "next";

/**
 * Configuration Next.js pour JobAgent
 * Utilise Turbopack en dev pour des rebuilds rapides
 */
const nextConfig: NextConfig = {
  // Activation du mode strict React pour detecter les problemes potentiels
  reactStrictMode: true,

  /**
   * Exclure ces packages du bundling Turbopack/Webpack côté serveur.
   * Sans cette config, Turbopack tente de bundler les dépendances Node natives
   * ce qui cause des erreurs ESM/CJS au runtime.
   *
   * @react-pdf/renderer : dépendances Node natives (canvas, fontkit, etc.)
   * @anthropic-ai/sdk : package CJS avec export ESM conditionnel — Turbopack
   *   mal initialise les ressources importées via "import * as API from ./resources/index.mjs"
   *   → API.Messages est undefined → client.messages.create() jette
   *   "Cannot read properties of undefined (reading 'create')"
   */
  serverExternalPackages: [
    "@react-pdf/renderer",
    "@anthropic-ai/sdk", // évite le bundling Turbopack du SDK Anthropic (init ESM incomplète)
  ],
};

export default nextConfig;
