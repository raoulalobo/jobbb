"use client";

/**
 * Rôle : Board Kanban complet des candidatures
 *
 * Architecture :
 *   - État local `localApps` (useState) = copie des candidatures reçues en props
 *     → mis à jour instantanément lors d'un drag pour une UX fluide (pas d'attente serveur)
 *   - useEffect : synchronise `localApps` quand les props `applications` changent
 *     (après re-fetch Tanstack Query suite à invalidation)
 *   - onDragEnd :
 *       1. Met à jour `localApps` immédiatement (optimistic local)
 *       2. Lance la mutation PUT /api/model/application/update
 *       3. onError → revient à l'état précédent + toast d'erreur
 *       4. onSettled → invalide les queries ZenStack Application pour re-sync serveur
 *
 * Pourquoi pas de mise à jour du cache TQ directement ?
 *   ZenStack génère des queryKeys complexes :
 *   ["zenstack", "Application", operation, args, options]
 *   Trop précises pour être ciblées de façon fiable avec setQueryData.
 *   La gestion locale est plus simple et tout aussi robuste.
 *
 * Props :
 *   - applications : toutes les candidatures (avec offres liées)
 *     Pré-fetché dans la page parent via useFindManyApplication
 *
 * Exemple :
 *   <KanbanBoard applications={applications} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, type ApplicationWithOffer } from "./KanbanCard";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "./ApplicationStatusBadge";

// ─── Configuration visuelle de chaque colonne ────────────────────────────────
// Identique à PipelineWidget pour la cohérence du design system

const COLUMN_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  draft:     { label: "Brouillon", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  ready:     { label: "Prêt",      color: "#0057BA", bg: "rgba(0,87,186,0.1)"    },
  sent:      { label: "Envoyé",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  interview: { label: "Entretien", color: "#9C52F2", bg: "rgba(156,82,242,0.1)"  },
  rejected:  { label: "Refusé",    color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
  accepted:  { label: "Accepté",   color: "#10B981", bg: "rgba(16,185,129,0.1)"  },
};

// ─── Préfixe de queryKey généré par ZenStack pour toutes les queries Application ──
// Invalider avec ["zenstack", "Application"] matche toutes les sous-clés
const ZENSTACK_APPLICATION_KEY = ["zenstack", "Application"];

interface KanbanBoardProps {
  applications: ApplicationWithOffer[];
}

export function KanbanBoard({ applications }: KanbanBoardProps) {
  const queryClient = useQueryClient();

  // ── État local : copie des candidatures pour mise à jour instantanée ──────
  // Découplé des props pour éviter de bloquer l'UI pendant la mutation serveur
  const [localApps, setLocalApps] = useState<ApplicationWithOffer[]>(applications);

  // Synchronise l'état local quand le parent re-fetche les données (après invalidation)
  useEffect(() => {
    setLocalApps(applications);
  }, [applications]);

  // ID de la carte en cours de drag (pour DragOverlay + grisage du fantôme)
  const [activeId, setActiveId] = useState<string | null>(null);

  // ── Sensors : distance minimale 5px avant de déclencher le drag ──────────
  // Évite les drags accidentels sur simple clic (notamment sur le lien titre)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ── Mutation : mise à jour du statut via l'API ZenStack ─────────────────
  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({
      applicationId,
      newStatus,
    }: {
      applicationId: string;
      newStatus: ApplicationStatus;
      previousApps: ApplicationWithOffer[]; // transmis pour le roll-back dans onError
    }) => {
      const res = await fetch("/api/model/application/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: { id: applicationId },
          data: { status: newStatus },
        }),
      });
      if (!res.ok) throw new Error("Impossible de mettre à jour le statut");
      return res.json();
    },

    // ── Roll-back local en cas d'erreur serveur ──────────────────────────
    onError: (_err, variables) => {
      // Remettre l'état local au snapshot pris avant la mutation
      setLocalApps(variables.previousApps);
      toast.error("Impossible de déplacer la candidature");
    },

    // ── Re-sync serveur après mutation (succès ou échec) ─────────────────
    onSettled: () => {
      // Invalide toutes les queries Application (findMany, count…) pour re-fetch
      queryClient.invalidateQueries({ queryKey: ZENSTACK_APPLICATION_KEY });
    },
  });

  // ── Handlers DnD ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      // Pas de colonne cible → annuler
      if (!over) return;

      const applicationId = String(active.id);
      const sourceStatus = (active.data.current as { status: string }).status;
      const targetStatus = String(over.id) as ApplicationStatus;

      // Déplacé dans la même colonne → rien à faire
      if (sourceStatus === targetStatus) return;

      // Snapshot de l'état avant modification (pour roll-back si erreur)
      const previousApps = localApps;

      // 1. Mise à jour locale instantanée (UX fluide)
      setLocalApps((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: targetStatus } : app
        )
      );

      // 2. Mutation serveur asynchrone
      updateStatus({ applicationId, newStatus: targetStatus, previousApps });
    },
    [localApps, updateStatus]
  );

  // ── Carte active pour le DragOverlay ────────────────────────────────────
  const activeApplication = activeId
    ? localApps.find((app) => app.id === activeId)
    : null;

  // ── Grouper les candidatures locales par statut ──────────────────────────
  const byStatus = APPLICATION_STATUSES.reduce<
    Record<ApplicationStatus, ApplicationWithOffer[]>
  >(
    (acc, status) => {
      acc[status] = localApps.filter((app) => app.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, ApplicationWithOffer[]>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Grille des 6 colonnes — scroll horizontal sur petit écran */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(160px, 1fr))",
          gap: "0.75rem",
          alignItems: "start",
          overflowX: "auto",
          paddingBottom: "0.5rem",
        }}
      >
        {APPLICATION_STATUSES.map((status) => {
          const { label, color, bg } = COLUMN_CONFIG[status];
          return (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              color={color}
              bg={bg}
              applications={byStatus[status]}
              activeId={activeId}
            />
          );
        })}
      </div>

      {/* Overlay visuel pendant le drag (carte fantôme sous le curseur) */}
      <DragOverlay>
        {activeApplication ? (
          <div style={{ opacity: 0.9, cursor: "grabbing" }}>
            <KanbanCard application={activeApplication} isDragging={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
