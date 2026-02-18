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
 * Role : En-tete du dashboard avec menu mobile et profil utilisateur
 * Utilise par : layout (dashboard)
 * Etat : toggle sidebar via useUiStore, avatar preview via useUiStore
 * Interactions : toggle sidebar mobile (Zustand), deconnexion (Better Auth), navigation
 */
export function Header() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Selecteurs Zustand granulaires pour eviter les re-renders inutiles
  const toggleSidebar = useUiStore((s) => s.actions.toggleSidebar);
  const avatarPreview = useUiStore((s) => s.avatarPreview);

  // Extraction des initiales du nom pour l'avatar fallback
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  // URL de l'avatar : preview Zustand en priorite, sinon session
  const avatarUrl = avatarPreview ?? session?.user?.image ?? undefined;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      {/* Bouton menu mobile (visible uniquement sur petit ecran) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Ouvrir le menu</span>
      </Button>

      {/* Espace flexible */}
      <div className="flex-1" />

      {/* Menu profil utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={session?.user?.name ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Mon profil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Parametres</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
            Deconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
