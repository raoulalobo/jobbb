"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useUiStore } from "@/lib/stores/ui-store";

/**
 * Role : Navigation mobile avec sidebar en sheet (panneau lateral)
 * Utilise par : layout (dashboard) sur les ecrans < lg
 * Etat : ouverture/fermeture via useUiStore.isSidebarOpen (Zustand)
 * Plus besoin de props : le composant lit et ecrit directement dans le store
 */
export function MobileNav() {
  // Selecteurs Zustand granulaires
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.actions.setSidebarOpen);

  return (
    <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
