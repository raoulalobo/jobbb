"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

/**
 * Role : Layout du dashboard avec sidebar fixe et header
 * Enveloppe toutes les pages authentifiees : dashboard, profil, recherches, offres, etc.
 * Utilise par : toutes les pages du groupe (dashboard)
 * Etat : sidebar mobile geree par useUiStore (Zustand)
 * Structure : sidebar a gauche (desktop), header en haut, contenu principal au centre
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fixe (visible uniquement sur desktop >= lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Navigation mobile (panneau lateral en sheet, etat via Zustand) */}
      <MobileNav />

      {/* Zone principale : header + contenu */}
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
