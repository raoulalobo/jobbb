import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Role : Skeleton de chargement pour la page détail d'une offre (/offers/[id])
 * Reproduit fidèlement le layout de OfferDetailPage (même structure, même dimensions)
 * Affiché pendant isLoading === true (Tanstack Query useFindUniqueOffer)
 *
 * Structure reproduite :
 *   Bouton retour
 *   Card principale :
 *     CardHeader : titre, entreprise+localisation, badges, salaire
 *     CardContent : boutons d'action, description (8 lignes), grille infos (2 colonnes)
 */
export function OfferDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <Skeleton className="h-8 w-32 rounded-md" />

      <Card>
        <CardHeader className="space-y-3">
          {/* Titre de l'offre */}
          <Skeleton className="h-7 w-3/4" />

          {/* Entreprise + localisation */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Badges source + contrat */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>

          {/* Salaire */}
          <Skeleton className="h-5 w-28" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>

          {/* Description : 8 lignes */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-3.5 ${i === 7 ? "w-2/3" : "w-full"}`}
                />
              ))}
            </div>
          </div>

          {/* Grille informations : 2 colonnes */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
