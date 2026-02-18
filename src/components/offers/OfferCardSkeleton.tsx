import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Role : Skeleton de chargement pour OfferCard
 * Reproduit fidèlement le layout de OfferCard (même dimensions, même structure)
 * Utilisé dans /offers pendant isLoading === true (Tanstack Query)
 *
 * Structure reproduite :
 *   CardHeader : titre (2 lignes), entreprise+localisation, badges
 *   CardContent : description (3 lignes), date + boutons
 */
export function OfferCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        {/* Titre : 2 lignes */}
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />

        {/* Entreprise + localisation */}
        <div className="flex items-center gap-3 pt-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
        </div>

        {/* Badges : source + contrat */}
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        {/* Description tronquée : 3 lignes */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>

        {/* Date relative + boutons */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-14 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
