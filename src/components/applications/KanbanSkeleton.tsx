/**
 * Rôle : Skeleton de chargement pour le Kanban de candidatures
 *
 * Reproduit le layout du KanbanBoard :
 *   - 6 colonnes côte à côte (draft → accepted)
 *   - Chaque colonne : header skeleton + 2 cartes skeleton
 *
 * Affiché quand isLoading === true dans applications/page.tsx
 * (avant que useFindManyApplication réponde)
 */

import { Skeleton } from "@/components/ui/skeleton";

/** Colonnes simulées pour le skeleton (6 = nombre de statuts) */
const SKELETON_COLS = 6;

/** Cartes simulées par colonne dans le skeleton */
const CARDS_PER_COL = 2;

export function KanbanSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${SKELETON_COLS}, minmax(0, 1fr))`,
        gap: "0.75rem",
        alignItems: "start",
      }}
    >
      {Array.from({ length: SKELETON_COLS }).map((_, colIndex) => (
        <div
          key={colIndex}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {/* Header de colonne skeleton */}
          <Skeleton className="h-8 w-full rounded-lg" />

          {/* Cartes skeleton */}
          {Array.from({ length: CARDS_PER_COL }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              style={{
                background: "white",
                border: "1px solid rgba(191,171,204,0.35)",
                borderRadius: 10,
                padding: "0.65rem 0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              {/* Titre de l'offre */}
              <Skeleton className="h-3.5 w-full" />
              {/* Ligne entreprise + date */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
