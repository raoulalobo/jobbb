/**
 * Rôle : Layout partagé pour les pages d'authentification (/login, /register)
 * Fournit :
 *   - Fond clair #F8F7F5 identique au hero de la homepage
 *   - Animation "constellation" (étoiles + lignes) via ConstellationBackground
 *   - Logo "JobAgent" cliquable en haut à gauche, lié à /
 *   - Centrage vertical du contenu enfant (formulaires)
 *
 * Server Component — pas de "use client" (ConstellationBackground gère son propre état)
 *
 * Exemple :
 *   Ce layout s'applique automatiquement à toutes les routes sous (auth)/
 */

import { ConstellationBackground } from "@/components/landing/ConstellationBackground";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Conteneur racine : plein écran, fond ivoire brand, police body */
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F5",
        fontFamily: "var(--font-body, 'Outfit', sans-serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animation constellation en arrière-plan (position: absolute, z=0) */}
      <ConstellationBackground />

      {/* Logo "JobAgent" — haut gauche, au-dessus de la constellation */}
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.5rem",
          zIndex: 10,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          {/* Icône bleue */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "#0057BA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bot size={16} color="white" />
          </div>

          {/* Texte "JobAgent" */}
          <span
            style={{
              fontWeight: 600,
              fontSize: "1rem",
              color: "#0A0F1E",
              letterSpacing: "-0.025em",
            }}
          >
            JobAgent
          </span>
        </Link>
      </div>

      {/* Zone de contenu centrée — padding-top pour laisser de la place au logo */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6rem 1.5rem 2rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
