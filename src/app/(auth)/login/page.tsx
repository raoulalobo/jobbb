"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * Rôle : Page de connexion — design harmonisé avec la homepage
 * Utilise par : route /login (layout géré par (auth)/layout.tsx)
 * Interactions :
 *   - authClient.signIn.email (Better Auth) → redirection /dashboard
 *   - Affiche les erreurs inline dans la carte
 *
 * Design :
 *   - Carte blanche avec bordure lavande #BFABCC légère
 *   - Titre en Instrument Serif (--font-display)
 *   - Bouton CTA bleu #0057BA identique au hero de la homepage
 *   - Animation d'entrée "fade-up" sur la carte (keyframe ja-fade-up)
 *   - Focus ring bleu sur les inputs
 *
 * Le fond constellation et le logo sont fournis par (auth)/layout.tsx
 */

/** Styles de la keyframe "fade-up" injectée une seule fois dans le DOM */
const FADE_UP_STYLE = `
@keyframes ja-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.ja-fu {
  animation: ja-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both;
}
`;

export default function LoginPage() {
  const router = useRouter();

  /* ── État local du formulaire (useState OK : état isolé à ce composant) ── */
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /** Soumission du formulaire de connexion via Better Auth */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Erreur lors de la connexion");
        return;
      }

      // Redirection vers le dashboard après connexion réussie
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Injection des keyframes ja-fade-up (idempotent si SSR ou re-render) */}
      <style dangerouslySetInnerHTML={{ __html: FADE_UP_STYLE }} />

      {/*
       * Carte principale — remplace le composant Card shadcn
       * Classe "ja-fu" → animation d'entrée fade-up
       */}
      <div
        className="ja-fu"
        style={{
          background: "white",
          border: "1px solid rgba(191,171,204,0.35)",
          borderRadius: 18,
          boxShadow: "0 8px 48px rgba(0,87,186,0.09)",
          padding: "2.5rem",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* En-tête de la carte */}
        <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
          {/* Titre en Instrument Serif pour cohérence avec la homepage */}
          <h1
            style={{
              fontFamily: "var(--font-display, 'Instrument Serif', serif)",
              fontSize: "2rem",
              fontWeight: 400,
              color: "#0A0F1E",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Connexion
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.9rem",
              color: "#6B7280",
            }}
          >
            Connectez-vous à votre compte JobAgent
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Message d'erreur inline */}
          {error && (
            <div
              style={{
                borderRadius: 8,
                backgroundColor: "rgba(239,68,68,0.08)",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: "#DC2626",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          {/* Champ email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Label htmlFor="email" className="text-[#0A0F1E] font-medium text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              /* Focus ring bleu brand */
              className="focus-visible:ring-[#0057BA] focus-visible:border-[#0057BA]"
            />
          </div>

          {/* Champ mot de passe avec toggle afficher/masquer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Label htmlFor="password" className="text-[#0A0F1E] font-medium text-sm">
              Mot de passe
            </Label>
            <PasswordInput
              id="password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="focus-visible:ring-[#0057BA] focus-visible:border-[#0057BA]"
            />
          </div>

          {/*
           * Bouton CTA — stylisé inline identique au bouton hero de la homepage
           * Pas du composant Button shadcn pour avoir un contrôle total sur la couleur
           */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "0.25rem",
              width: "100%",
              backgroundColor: isLoading ? "#7aaee0" : "#0057BA",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "0.65rem 1rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.18s ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#004fa8";
            }}
            onMouseLeave={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0057BA";
            }}
          >
            {isLoading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        {/* Lien vers l'inscription */}
        <p
          style={{
            marginTop: "1.25rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#6B7280",
          }}
        >
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            style={{
              color: "#0057BA",
              fontWeight: 500,
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")
            }
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  );
}
