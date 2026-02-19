"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Search,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Bot,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

/**
 * Rôle : Barre latérale de navigation du dashboard — Option B "Brand Cohérence"
 * Utilise par : layout (dashboard)
 * Interactions : navigation, déconnexion via Better Auth
 *
 * Design (cohérent avec homepage et pages auth) :
 *   - Fond #F8F7F5 + bordure droite lavande rgba(191,171,204,0.35)
 *   - Logo : Bot icon bleu + "JobAgent" en Instrument Serif (identique au layout auth)
 *   - Item actif : fond rgba(0,87,186,0.08), texte #0057BA, barre gauche 3px #0057BA
 *   - Item inactif : texte #6B7280, hover fond rgba(0,87,186,0.05), hover texte #0A0F1E
 *   - User card en bas : avatar gradient bleu→violet, nom, email, bouton déconnexion
 */

/** Liens de navigation avec icônes et chemins */
const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard",    icon: LayoutDashboard },
  { label: "Mon profil",      href: "/profile",      icon: User            },
  { label: "Recherches",      href: "/searches",     icon: Search          },
  { label: "Offres",          href: "/offers",       icon: Briefcase       },
  { label: "Candidatures",    href: "/applications", icon: FileText        },
  { label: "Paramètres",      href: "/settings",     icon: Settings        },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  // Session utilisateur pour la user card en bas
  const { data: session } = authClient.useSession();

  // Initiales pour l'avatar (ex: "Jean Dupont" → "JD")
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  /** Déconnexion via Better Auth puis redirection vers /login */
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    /*
     * Conteneur principal de la sidebar
     * Fond #F8F7F5 : identique au hero homepage et aux pages auth
     * Bordure droite lavande : séparateur subtil sans rupture visuelle forte
     */
    <aside
      style={{
        backgroundColor: "#F8F7F5",
        borderRight: "1px solid rgba(191,171,204,0.35)",
      }}
      className="flex h-screen w-64 flex-col"
    >
      {/*
       * Logo "JobAgent"
       * Reprend exactement le même composant que le layout auth :
       * Bot icon dans un carré bleu + texte en Instrument Serif
       * Bordure basse lavande pour séparer du nav
       */}
      <div
        style={{ borderBottom: "1px solid rgba(191,171,204,0.35)" }}
        className="flex h-16 items-center px-5"
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
        >
          {/* Icône bleue */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              backgroundColor: "#0057BA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bot size={15} color="white" />
          </div>

          {/* Nom de l'app en Instrument Serif — même police que les titres homepage */}
          <span
            style={{
              fontFamily: "var(--font-display, 'Instrument Serif', serif)",
              fontSize: "1.2rem",
              fontWeight: 400,
              color: "#0A0F1E",
              letterSpacing: "-0.02em",
            }}
          >
            JobAgent
          </span>
        </Link>
      </div>

      {/* ── Liens de navigation ── */}
      <nav className="flex-1 p-3" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map((item) => {
          /*
           * Détection de l'item actif :
           * - exact pour /dashboard (évite de matcher /dashboard/xxx)
           * - préfixe pour les autres routes avec sous-pages
           */
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.55rem 0.75rem",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 500 : 400,
                transition: "background-color 0.15s ease, color 0.15s ease",
                /* Item actif : fond bleu très léger + texte bleu + barre gauche */
                backgroundColor: isActive ? "rgba(0,87,186,0.08)" : "transparent",
                color:           isActive ? "#0057BA" : "#6B7280",
                /* Barre indicateur gauche sur l'item actif */
                borderLeft: isActive ? "3px solid #0057BA" : "3px solid transparent",
                marginLeft: "-3px", // compense la bordure pour aligner avec les inactifs
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(0,87,186,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#0A0F1E";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280";
                }
              }}
            >
              <item.icon
                size={17}
                style={{ flexShrink: 0, color: isActive ? "#0057BA" : "#9CA3AF" }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/*
       * User card en bas de la sidebar
       * Avatar gradient bleu→violet (cohérent avec la palette brand)
       * Nom + email tronqués, bouton déconnexion en rouge
       * Bordure haute lavande pour séparer du nav
       */}
      <div
        style={{ borderTop: "1px solid rgba(191,171,204,0.35)", padding: "0.875rem" }}
      >
        {/* Ligne avatar + infos utilisateur */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
          {/* Avatar gradient bleu #0057BA → violet #9C52F2 */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0057BA, #9C52F2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 600,
              flexShrink: 0,
              letterSpacing: "0.03em",
            }}
          >
            {initials}
          </div>

          {/* Nom et email */}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#0A0F1E",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {session?.user?.name ?? "Utilisateur"}
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: "#9CA3AF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {session?.user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.5rem",
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "#9CA3AF",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "color 0.15s ease, background-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
