"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

/**
 * Rôle : Layout du dashboard — Option B "Brand Cohérence"
 * Enveloppe toutes les pages authentifiées : dashboard, profil, recherches, offres, etc.
 * Utilise par : toutes les pages du groupe (dashboard)
 * Etat : sidebar mobile gérée par useUiStore (Zustand)
 *
 * Design :
 *   - Fond global #F8F7F5 : cohérent avec homepage et pages auth (pas de blanc pur)
 *   - Sidebar #F8F7F5 + bordure lavande (Option B)
 *   - Header #F8F7F5 + bordure lavande (Option B)
 *   - Zone main : même fond #F8F7F5, contenu scrollable
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Fond #F8F7F5 appliqué sur le conteneur racine
     * → se propage à toute la surface du dashboard (sidebar, header, main)
     * → cohérence visuelle totale avec la homepage et les pages auth
     */
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#F8F7F5" }}
    >
      {/* Sidebar fixe (visible uniquement sur desktop >= lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Navigation mobile (panneau latéral en sheet, état via Zustand) */}
      <MobileNav />

      {/* Zone principale : header + contenu scrollable */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Contenu de la page avec scroll */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
