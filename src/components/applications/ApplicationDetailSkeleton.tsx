/**
 * Role : Squelette de chargement de la page detail d'une candidature
 * Reproduit fidelement la structure de la page /applications/[id] :
 *   - Bouton retour
 *   - Card en-tete (titre offre + entreprise + badge statut)
 *   - Card statut + notes (select + textarea)
 *   - Onglets CV / Lettre de motivation avec contenu en skeleton
 *
 * Affiche pendant isLoading = true dans la page /applications/[id]
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <Skeleton className="h-8 w-32" />

      {/* Card en-tete : titre offre + entreprise + badge statut */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </CardHeader>
      </Card>

      {/* Card statut + notes */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select statut */}
          <Skeleton className="h-9 w-44" />
          {/* Label + textarea notes */}
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full" />
          {/* Bouton enregistrer */}
          <Skeleton className="h-9 w-36" />
        </CardContent>
      </Card>

      {/* Onglets CV / Lettre */}
      <div className="space-y-2">
        {/* Barre d'onglets */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
        {/* Contenu de l'onglet actif : bloc de texte long */}
        <Card>
          <CardContent className="space-y-2 pt-6">
            {/* Largeurs fixes pour rester idempotent (pas de Math.random en rendu) */}
            {["w-full", "w-5/6", "w-4/5", "w-11/12", "w-3/4", "w-full",
              "w-5/6", "w-4/5", "w-11/12", "w-3/4", "w-full", "w-5/6"].map((w, i) => (
              <Skeleton key={i} className={`h-4 ${w}`} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
