import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Role : Skeleton de chargement pour la page Dashboard
 * Reproduit fidèlement le layout du dashboard (grille 4 stats + card offres récentes)
 * Affiché pendant isLoading === true (Tanstack Query des compteurs)
 *
 * Structure reproduite :
 *   Titre + sous-titre
 *   Grille 4 cartes de statistiques (icône + label + valeur)
 *   Card "Offres récentes"
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Titre + sous-titre */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Grille 4 cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {/* Label */}
              <Skeleton className="h-3.5 w-28" />
              {/* Icône */}
              <Skeleton className="h-5 w-5 rounded-sm" />
            </CardHeader>
            <CardContent>
              {/* Valeur numérique */}
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card offres récentes */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </CardContent>
      </Card>
    </div>
  );
}
