"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Rôle : Page d'inscription — design harmonisé avec la homepage
 * Utilise par : route /register (layout géré par (auth)/layout.tsx)
 * Interactions :
 *   - authClient.signUp.email (Better Auth) → redirection /dashboard
 *   - Validation côté client : mots de passe identiques, longueur ≥ 8
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

export default function RegisterPage() {
  const router = useRouter();

  /* ── État local du formulaire (useState OK : état isolé à ce composant) ── */
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                 = useState("");
  const [isLoading, setIsLoading]         = useState(false);

  /** Soumission du formulaire d'inscription via Better Auth */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation : correspondance des mots de passe
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validation : longueur minimale du mot de passe
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Erreur lors de l'inscription");
        return;
      }

      // Redirection vers le dashboard après inscription réussie
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
            Créez votre compte
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.9rem",
              color: "#6B7280",
            }}
          >
            Automatisez votre recherche d&apos;emploi avec JobAgent
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

          {/* Champ nom complet */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Label htmlFor="name" className="text-[#0A0F1E] font-medium text-sm">
              Nom complet
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="focus-visible:ring-[#0057BA] focus-visible:border-[#0057BA]"
            />
          </div>

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
              className="focus-visible:ring-[#0057BA] focus-visible:border-[#0057BA]"
            />
          </div>

          {/* Champ mot de passe */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Label htmlFor="password" className="text-[#0A0F1E] font-medium text-sm">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="focus-visible:ring-[#0057BA] focus-visible:border-[#0057BA]"
            />
          </div>

          {/* Confirmation du mot de passe */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Label htmlFor="confirmPassword" className="text-[#0A0F1E] font-medium text-sm">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
            {isLoading ? "Inscription en cours…" : "Créer mon compte"}
          </button>
        </form>

        {/* Lien vers la connexion */}
        <p
          style={{
            marginTop: "1.25rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#6B7280",
          }}
        >
          Déjà un compte ?{" "}
          <Link
            href="/login"
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
            Se connecter
          </Link>
        </p>
      </div>
    </>
  );
}
