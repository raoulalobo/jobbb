"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Search,
  Briefcase,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Role : Barre laterale de navigation du dashboard
 * Affiche les liens de navigation principaux et le bouton de deconnexion
 * Utilise par : layout (dashboard)
 * Interactions : navigation, deconnexion via Better Auth
 */

// Definition des liens de navigation avec icones et chemins
const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mon profil", href: "/profile", icon: User },
  { label: "Recherches", href: "/searches", icon: Search },
  { label: "Offres", href: "/offers", icon: Briefcase },
  { label: "Candidatures", href: "/applications", icon: FileText },
  { label: "Parametres", href: "/settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Gestion de la deconnexion
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo / Titre */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          JobAgent
        </Link>
      </div>

      {/* Liens de navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          // Verification si le lien est actif (chemin actuel commence par le href)
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bouton de deconnexion */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Deconnexion
        </Button>
      </div>
    </aside>
  );
}
