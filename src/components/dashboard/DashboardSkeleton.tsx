import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Rôle : Skeleton de chargement pour le Dashboard Command Center
 * Reproduit fidèlement le layout du Command Center :
 *   1. Section greeting (h1 + sous-titre)
 *   2. Grille 4 stat cards (icône + label + valeur)
 *   3. Pipeline de candidatures (6 colonnes)
 *   4. Bas de page 2 colonnes (offres récentes + prochaine action)
 *
 * Affiché quand isLoading === true (avant que les queries Tanstack répondent)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">

      {/* ── 1. Greeting ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {/* "Bonjour, Prénom ✦" — large, Instrument Serif */}
        <Skeleton className="h-9 w-56" />
        {/* Sous-titre */}
        <Skeleton className="h-4 w-80" />
      </div>

      {/* ── 2. Grille 4 stat cards ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {/* Label */}
              <Skeleton className="h-3.5 w-28" />
              {/* Icône dans cercle coloré */}
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              {/* Valeur numérique grande */}
              <Skeleton className="h-9 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 3. Pipeline de candidatures ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Bas de page : offres récentes + prochaine action ──────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Offres récentes (2/3 gauche) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="space-y-1 items-end flex flex-col ml-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prochaine action (1/3 droite) */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
