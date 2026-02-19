/**
 * Role : Squelette de chargement du formulaire de planification
 * Reproduit la structure de ScheduleConfigForm :
 *   - Card avec titre + description
 *   - Toggle isActive
 *   - Selecteur de SearchConfig (label + description + select)
 *   - 3 selects (heure, minute, timezone)
 *   - Bouton enregistrer
 *
 * Affiche pendant que la session, la ScheduleConfig ou les SearchConfigs se chargent
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function ScheduleConfigSkeleton() {
  return (
    <Card>
      {/* Titre + description */}
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toggle isActive */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>

        {/* Skeleton selecteur SearchConfig */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-80" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        {/* 3 selects */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        {/* Bouton enregistrer */}
        <Skeleton className="h-9 w-36" />
      </CardContent>
    </Card>
  );
}
