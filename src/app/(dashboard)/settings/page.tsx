"use client";

/**
 * Role : Page de configuration du scheduler (/settings)
 * Permet a l'utilisateur de configurer la recherche automatique d'offres.
 *
 * Comportement :
 *   - Charge la session pour obtenir l'userId
 *   - Charge la ScheduleConfig existante de l'utilisateur (s'il en a une)
 *   - Pendant le chargement → ScheduleConfigSkeleton
 *   - Une fois charge → ScheduleConfigForm avec les valeurs actuelles
 *
 * Hooks :
 *   - authClient.useSession : recupere l'utilisateur connecte (userId)
 *   - useFindFirstScheduleConfig : lit la config de planification de l'utilisateur
 *
 * Architecture :
 *   - ScheduleConfigForm est monte uniquement quand userId est disponible
 *     ce qui permet l'initialisation de l'etat depuis les props sans useEffect
 */

import { authClient } from "@/lib/auth-client";
import { useFindFirstScheduleConfig } from "@/lib/hooks";
import { ScheduleConfigForm } from "@/components/settings/ScheduleConfigForm";
import { ScheduleConfigSkeleton } from "@/components/settings/ScheduleConfigSkeleton";
import type { ScheduleConfig } from "@prisma/client";

export default function SettingsPage() {
  // Recuperer la session pour obtenir l'userId
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Query : ScheduleConfig de l'utilisateur connecte
  // ZenStack filtre automatiquement par l'utilisateur authentifie (@@allow policy)
  const { data: scheduleConfigs, isLoading: isLoadingConfig } =
    useFindFirstScheduleConfig();

  // Skeleton si la session ou la config n'est pas encore chargee
  const isLoading = !userId || isLoadingConfig;

  return (
    <div className="space-y-6">
      {/* En-tete de la page */}
      <div>
        <h1 className="text-2xl font-bold">Parametres</h1>
        <p className="text-muted-foreground">
          Configurez vos preferences de recherche automatique
        </p>
      </div>

      {/* Skeleton pendant le chargement */}
      {isLoading && <ScheduleConfigSkeleton />}

      {/*
       * Formulaire monte uniquement quand userId est disponible.
       * L'etat initial (isActive, hour, minute, timezone) est lu depuis existingConfig.
       * Pattern React recommande : pas de useEffect pour synchroniser l'etat.
       */}
      {!isLoading && userId && (
        <ScheduleConfigForm
          userId={userId}
          existingConfig={(scheduleConfigs as ScheduleConfig) ?? null}
        />
      )}
    </div>
  );
}
