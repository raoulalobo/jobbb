import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Role : Skeleton de chargement pour SearchConfigCard
 * Reproduit fidèlement le layout de SearchConfigCard (même dimensions, même structure)
 * Utilisé dans /searches pendant isLoading === true (Tanstack Query)
 *
 * Structure reproduite :
 *   CardHeader : titre + requête/localisation (gauche) + badge actif (droite)
 *   CardContent : ligne de détails (sites, contrat), boutons d'action
 */
export function SearchConfigCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1.5">
          {/* Nom de la config */}
          <Skeleton className="h-4 w-32" />
          {/* "requête" à localisation */}
          <Skeleton className="h-3.5 w-48" />
        </div>

        {/* Badge actif/inactif */}
        <Skeleton className="h-5 w-14 rounded-full" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Ligne détails : sites + contrat */}
        <div className="flex gap-4">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
