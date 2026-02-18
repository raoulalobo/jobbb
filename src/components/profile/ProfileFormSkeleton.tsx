import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

/**
 * Role : Skeleton de chargement pour ProfileForm
 * Reproduit fidèlement le layout du formulaire profil (mêmes sections, mêmes dimensions)
 * Affiché dans ProfileForm pendant isLoadingProfile === true (Tanstack Query)
 *
 * Structure reproduite :
 *   Card Photo de profil : avatar circulaire + bouton + légende
 *   Card Informations générales : 1 input + grille 2 cols + textarea
 *   Card Identifiants LinkedIn : grille 2 cols
 *   Card Compétences : zone de tags
 *   Card Expériences : 1 ligne + bouton ajouter
 *   Card Formations : 1 ligne + bouton ajouter
 *   Card CV : input file
 *   Separator + bouton sauvegarder
 */
export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Card Photo de profil */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Avatar circulaire h-24 w-24 */}
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Informations générales */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre professionnel */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          {/* Téléphone + localisation */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
          {/* Résumé : textarea 4 lignes */}
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Card Identifiants LinkedIn */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-3.5 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Compétences */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Card Expériences */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-36 rounded-md" />
        </CardContent>
      </Card>

      {/* Card Formations */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-36 rounded-md" />
        </CardContent>
      </Card>

      {/* Card CV */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-9 w-64 rounded-md" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Bouton sauvegarder */}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-44 rounded-md" />
      </div>
    </div>
  );
}
