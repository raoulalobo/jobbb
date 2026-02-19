"use client";

/**
 * Role : Page liste des candidatures (/applications)
 *
 * Offre deux vues commutables via un toggle en haut à droite :
 *   - Vue Tableau (default) : ApplicationsTable — tri et filtrage par statut
 *   - Vue Kanban            : KanbanBoard — drag & drop entre colonnes de statut
 *
 * L'état du toggle est local (useState) car il est isolé à cette page.
 *
 * Hooks :
 *   - useFindManyApplication : récupère les candidatures + offres liées
 *   - useCountApplication    : compteur total pour l'en-tête
 */

import { useState } from "react";
import Link from "next/link";
import { FilePlus, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFindManyApplication, useCountApplication } from "@/lib/hooks";
import { ApplicationsTable } from "@/components/applications/ApplicationsTable";
import { ApplicationsTableSkeleton } from "@/components/applications/ApplicationsTableSkeleton";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { KanbanSkeleton } from "@/components/applications/KanbanSkeleton";
import type { ApplicationWithOffer } from "@/components/applications/KanbanCard";

/** Vues disponibles */
type ViewMode = "table" | "kanban";

export default function ApplicationsPage() {
  // État local : vue active (table ou kanban)
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Query : compteur total de candidatures pour l'en-tête
  const { data: totalCount } = useCountApplication();

  // Query : liste des candidatures avec l'offre liée
  const { data: applications, isLoading } = useFindManyApplication({
    include: { offer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">

      {/* ── En-tête : titre + compteur + toggle de vue ──────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes candidatures</h1>
          <p className="text-muted-foreground">
            {typeof totalCount === "number"
              ? `${totalCount} candidature${totalCount > 1 ? "s" : ""}`
              : "Chargement..."}
          </p>
        </div>

        {/* Toggle Table / Kanban */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            background: "white",
            border: "1px solid rgba(191,171,204,0.35)",
            borderRadius: 8,
            padding: "0.2rem",
            flexShrink: 0,
          }}
        >
          {/* Bouton Vue Tableau */}
          <button
            onClick={() => setViewMode("table")}
            title="Vue tableau"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.3rem 0.65rem",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              transition: "background 0.15s ease, color 0.15s ease",
              // Actif : fond bleu, texte blanc
              background: viewMode === "table" ? "#0057BA" : "transparent",
              color: viewMode === "table" ? "white" : "#6B7280",
            }}
          >
            <Table2 size={13} />
            Tableau
          </button>

          {/* Bouton Vue Kanban */}
          <button
            onClick={() => setViewMode("kanban")}
            title="Vue Kanban"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.3rem 0.65rem",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              transition: "background 0.15s ease, color 0.15s ease",
              background: viewMode === "kanban" ? "#0057BA" : "transparent",
              color: viewMode === "kanban" ? "white" : "#6B7280",
            }}
          >
            <LayoutGrid size={13} />
            Kanban
          </button>
        </div>
      </div>

      {/* ── Skeleton pendant le chargement ──────────────────────────── */}
      {isLoading && viewMode === "table" && <ApplicationsTableSkeleton />}
      {isLoading && viewMode === "kanban" && <KanbanSkeleton />}

      {/* ── Vue Tableau ─────────────────────────────────────────────── */}
      {!isLoading && viewMode === "table" && applications && applications.length > 0 && (
        <ApplicationsTable
          applications={
            applications as Parameters<
              typeof ApplicationsTable
            >[0]["applications"]
          }
        />
      )}

      {/* ── Vue Kanban ──────────────────────────────────────────────── */}
      {!isLoading && viewMode === "kanban" && applications && (
        <KanbanBoard applications={applications as ApplicationWithOffer[]} />
      )}

      {/* ── État vide : aucune candidature ──────────────────────────── */}
      {!isLoading && applications && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(191,171,204,0.6)] py-16">
          <FilePlus className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune candidature</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez une offre et cliquez sur &quot;Postuler avec l&apos;IA&quot; pour
            générer votre première candidature.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/offers">Voir les offres</Link>
          </Button>
        </div>
      )}

    </div>
  );
}
