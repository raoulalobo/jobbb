"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUiStore } from "@/lib/stores/ui-store";

/**
 * Rôle : En-tête du dashboard — Option B "Brand Cohérence"
 * Utilise par : layout (dashboard)
 * Etat : toggle sidebar mobile via useUiStore, avatar preview via useUiStore
 *
 * Design (cohérent avec Sidebar et homepage) :
 *   - Fond #F8F7F5 : identique à la sidebar et au hero homepage
 *   - Bordure basse lavande rgba(191,171,204,0.35) au lieu de border-border générique
 *   - Avatar fallback : gradient bleu #0057BA → violet #9C52F2 (identique à la Sidebar)
 */
export function Header() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Sélecteurs Zustand granulaires pour éviter les re-renders inutiles
  const toggleSidebar = useUiStore((s) => s.actions.toggleSidebar);
  const avatarPreview = useUiStore((s) => s.avatarPreview);

  // Calcul des initiales pour l'avatar fallback (ex: "Jean Dupont" → "JD")
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  // URL de l'avatar : preview Zustand en priorité, sinon session
  const avatarUrl = avatarPreview ?? session?.user?.image ?? undefined;

  /** Déconnexion via Better Auth puis redirection vers /login */
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    /*
     * En-tête principal
     * Fond #F8F7F5 et bordure lavande : continuité visuelle avec la Sidebar
     * Pas de bg-card (blanc pur) qui créerait une rupture de fond
     */
    <header
      style={{
        backgroundColor: "#F8F7F5",
        borderBottom: "1px solid rgba(191,171,204,0.35)",
      }}
      className="flex h-16 items-center justify-between px-4 lg:px-6"
    >
      {/* Bouton menu hamburger — visible uniquement sur mobile (< lg) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        style={{ color: "#6B7280" }}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Ouvrir le menu</span>
      </Button>

      {/* Espace flexible — pousse le menu avatar vers la droite */}
      <div className="flex-1" />

      {/* Menu profil utilisateur (dropdown) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={session?.user?.name ?? ""} />
              {/*
               * Fallback avatar : gradient bleu→violet, identique à la user card de la Sidebar
               * Remplace le bg-primary/10 générique
               */}
              <AvatarFallback
                style={{
                  background: "linear-gradient(135deg, #0057BA, #9C52F2)",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        {/* Contenu du dropdown — inchangé fonctionnellement */}
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Mon profil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Paramètres</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
