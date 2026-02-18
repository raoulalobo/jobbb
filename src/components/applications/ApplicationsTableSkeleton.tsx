/**
 * Role : Squelette de chargement du tableau des candidatures
 * Reproduit fidelement la structure de ApplicationsTable :
 *   - En-tete avec 4 colonnes (Offre, Statut, Date, Actions)
 *   - 5 lignes de donnees avec cellules en skeleton
 *
 * Affiche pendant isLoading = true dans la page /applications
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Nombre de lignes skeleton a afficher */
const SKELETON_ROWS = 5;

export function ApplicationsTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        {/* En-tete du tableau — reproduit les 4 colonnes reelles */}
        <TableHeader>
          <TableRow>
            <TableHead>Offre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {/* Corps : 5 lignes avec cellules en skeleton */}
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <TableRow key={i}>
              {/* Colonne Offre : titre + entreprise empiles */}
              <TableCell>
                <Skeleton className="mb-1 h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </TableCell>

              {/* Colonne Statut : badge */}
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>

              {/* Colonne Date */}
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>

              {/* Colonne Actions : bouton Voir */}
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
