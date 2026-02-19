"use client";

/**
 * Rôle : Carte draggable du Kanban de candidatures
 *
 * Affiche les informations clés d'une candidature :
 *   - Titre de l'offre (tronqué si long)
 *   - Entreprise (icône Building2)
 *   - Date de création relative
 *   - Indicateur visuel de drag (opacity réduite pendant le drag)
 *
 * Drag & Drop :
 *   - Utilise `useDraggable` de @dnd-kit/core
 *   - `data.applicationId` et `data.status` sont passés au DndContext
 *     pour identifier la carte et sa colonne source lors du drop
 *
 * Exemple :
 *   <KanbanCard application={app} isDragging={false} />
 */

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2 } from "lucide-react";
import Link from "next/link";
import type { Application, Offer } from "@prisma/client";

/** Application avec l'offre liée (include: { offer: true }) */
export type ApplicationWithOffer = Application & { offer: Offer };

interface KanbanCardProps {
  application: ApplicationWithOffer;
  /** True quand c'est cette carte qui est activement draguée (rendu dans DragOverlay) */
  isDragging?: boolean;
}

/** Calcule une date relative en français sans dépendance externe */
function relativeDate(date: Date): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays}j`;
}

export function KanbanCard({ application, isDragging = false }: KanbanCardProps) {
  // Hook @dnd-kit — rend la carte draggable
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: application.id,
    // data transmises au handler onDragEnd du DndContext parent
    data: {
      applicationId: application.id,
      status: application.status,
    },
  });

  // Style de déplacement CSS pendant le drag
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    // Wrapper draggable — ref + attributes + listeners de @dnd-kit
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      // Opacité réduite = carte en cours de drag (fantôme)
      className={`group cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      {/* Carte blanche brand : bordure lavande + ombre bleue */}
      <div
        style={{
          background: "white",
          border: "1px solid rgba(191,171,204,0.35)",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,87,186,0.06)",
          padding: "0.65rem 0.75rem",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        }}
        // Highlight au hover — géré en JS inline car on ne peut pas utiliser
        // Tailwind hover: sur des éléments avec style inline dynamique
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 16px rgba(0,87,186,0.14)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(0,87,186,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 2px 8px rgba(0,87,186,0.06)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(191,171,204,0.35)";
        }}
      >
        {/* Titre de l'offre — lien vers le détail de la candidature */}
        <Link
          href={`/applications/${application.id}`}
          // stopPropagation pour ne pas déclencher le drag en cliquant sur le lien
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#0A0F1E",
            textDecoration: "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "0.3rem",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = "#0057BA")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = "#0A0F1E")
          }
        >
          {application.offer.title}
        </Link>

        {/* Entreprise + date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          {/* Entreprise avec icône */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.7rem",
              color: "#9CA3AF",
              overflow: "hidden",
            }}
          >
            <Building2 size={10} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {application.offer.company}
            </span>
          </div>

          {/* Date relative */}
          <span
            style={{
              fontSize: "0.65rem",
              color: "#D1D5DB",
              flexShrink: 0,
            }}
          >
            {relativeDate(application.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
