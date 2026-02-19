"use client";

/**
 * Rôle : Colonne droppable du Kanban de candidatures
 *
 * Chaque colonne correspond à un statut de candidature (draft → accepted).
 * Elle affiche :
 *   - Un header coloré : point de statut + label + compteur de cartes
 *   - La liste des cartes de ce statut (KanbanCard)
 *   - Un état vide discret si aucune candidature
 *
 * Drag & Drop :
 *   - Utilise `useDroppable` de @dnd-kit/core
 *   - La colonne se highlight (bordure bleue) quand une carte passe au-dessus
 *   - L'`id` du droppable correspond au statut de la colonne (ex: "sent")
 *
 * Exemple :
 *   <KanbanColumn
 *     status="sent"
 *     label="Envoyé"
 *     color="#F59E0B"
 *     bg="rgba(245,158,11,0.1)"
 *     applications={sentApplications}
 *     activeId={activeId}
 *   />
 */

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard, type ApplicationWithOffer } from "./KanbanCard";
import type { ApplicationStatus } from "./ApplicationStatusBadge";

interface KanbanColumnProps {
  /** Statut correspondant à cette colonne (utilisé comme ID du droppable) */
  status: ApplicationStatus;
  /** Label en français affiché dans le header */
  label: string;
  /** Couleur principale du statut (#hex) */
  color: string;
  /** Couleur de fond du header (rgba avec opacité) */
  bg: string;
  /** Candidatures à afficher dans cette colonne */
  applications: ApplicationWithOffer[];
  /** ID de la carte actuellement draguée (pour griser son fantôme) */
  activeId: string | null;
}

export function KanbanColumn({
  status,
  label,
  color,
  bg,
  applications,
  activeId,
}: KanbanColumnProps) {
  // Hook @dnd-kit — rend la colonne droppable
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        minWidth: 0, // permet au flex/grid parent de réduire la colonne
      }}
    >
      {/* ── Header de la colonne ──────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: bg,
          borderRadius: 8,
          padding: "0.45rem 0.65rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.4rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {/* Point coloré de statut */}
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
          {/* Label du statut */}
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color,
            }}
          >
            {label}
          </span>
        </div>

        {/* Compteur de cartes */}
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color,
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 99,
            padding: "0.05rem 0.45rem",
          }}
        >
          {applications.length}
        </span>
      </div>

      {/* ── Zone droppable : liste des cartes ────────────────────────── */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
          minHeight: 80, // zone de drop toujours visible même si vide
          borderRadius: 10,
          padding: "0.35rem",
          // Highlight quand une carte est au-dessus de la colonne
          backgroundColor: isOver
            ? "rgba(0,87,186,0.04)"
            : "transparent",
          border: isOver
            ? "2px dashed rgba(0,87,186,0.3)"
            : "2px dashed transparent",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
      >
        {applications.length === 0 ? (
          /* État vide discret */
          <p
            style={{
              fontSize: "0.7rem",
              color: "#D1D5DB",
              textAlign: "center",
              padding: "1rem 0",
            }}
          >
            Vide
          </p>
        ) : (
          applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              // Griser le fantôme de la carte actuellement draguée
              isDragging={activeId === app.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
