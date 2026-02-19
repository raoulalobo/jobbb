"use client";

/**
 * Role : Formulaire de configuration du scheduler de recherche automatique
 * Permet a l'utilisateur de :
 *   - Activer/desactiver la recherche automatique (Switch isActive)
 *   - Choisir quelle SearchConfig lancer automatiquement (Select searchConfig)
 *   - Configurer l'heure de declenchement (Select heure + minute)
 *   - Choisir sa timezone (Select parmi les zones courantes)
 *
 * Comportement :
 *   - Au chargement, lit la ScheduleConfig existante de l'utilisateur (si elle existe)
 *   - Upsert (create ou update) via useUpsertScheduleConfig au clic "Enregistrer"
 *   - Le composant est monte uniquement une fois que session.user.id est disponible
 *     (ce qui permet d'initialiser l'etat depuis les props sans useEffect)
 *   - Si searchConfigId = null, Inngest ne lancera rien (avertissement affiché)
 *   - Si aucune SearchConfig n'existe, affiche un Alert avec CTA vers /searches
 *
 * Interactions :
 *   - useFindFirstScheduleConfig : lit la config existante de l'utilisateur
 *   - useUpsertScheduleConfig : cree ou met a jour la config
 *   - authClient.useSession() : fournit l'userId necessaire pour l'upsert
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Clock, Save, Search } from "lucide-react";
import type { ScheduleConfig, SearchConfig } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUpsertScheduleConfig } from "@/lib/hooks";

/**
 * Timezones courantes proposees dans le select
 * Format : { value: string IANA, label: string affiche }
 */
const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)" },
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)" },
  { value: "Europe/Rome", label: "Rome (UTC+1/+2)" },
  { value: "Europe/Brussels", label: "Bruxelles (UTC+1/+2)" },
  { value: "Europe/Zurich", label: "Zurich (UTC+1/+2)" },
  { value: "America/New_York", label: "New York (UTC-5/-4)" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)" },
  { value: "America/Montreal", label: "Montreal (UTC-5/-4)" },
  { value: "Africa/Casablanca", label: "Casablanca (UTC+0/+1)" },
  { value: "Africa/Tunis", label: "Tunis (UTC+1)" },
  { value: "Africa/Algiers", label: "Alger (UTC+1)" },
  { value: "UTC", label: "UTC (sans decalage)" },
];

/** Minutes disponibles : 0, 15, 30, 45 */
const MINUTES = [0, 15, 30, 45];

/** Heures disponibles : 0h a 23h */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Formate une heure en label lisible
 * Exemple : formatHour(8) → "08h00", formatHour(14, 30) → "14h30"
 */
function formatHour(hour: number, minute: number = 0): string {
  return `${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`;
}

interface ScheduleConfigFormProps {
  /** userId de l'utilisateur connecte (depuis authClient.useSession) */
  userId: string;
  /** Config existante depuis la BDD, ou null si premiere configuration */
  existingConfig: ScheduleConfig | null;
  /** Liste des SearchConfigs de l'utilisateur pour le selecteur de recherche */
  searchConfigs: SearchConfig[];
}

/**
 * Formulaire de configuration du scheduler.
 * Monte uniquement quand userId est disponible pour eviter useEffect de sync.
 * L'etat est initialise depuis les props au premier rendu (pattern React recommande).
 */
export function ScheduleConfigForm({
  userId,
  existingConfig,
  searchConfigs,
}: ScheduleConfigFormProps) {
  const queryClient = useQueryClient();

  // Etat initialise depuis la config existante, ou valeurs par defaut
  const [isActive, setIsActive] = useState(existingConfig?.isActive ?? false);
  const [hour, setHour] = useState(existingConfig?.hour ?? 8);
  const [minute, setMinute] = useState(existingConfig?.minute ?? 0);
  const [timezone, setTimezone] = useState(
    existingConfig?.timezone ?? "Europe/Paris"
  );

  // "" = aucune selection (searchConfigId null en BDD)
  // Le Select shadcn affiche le placeholder quand value === ""
  const [selectedSearchConfigId, setSelectedSearchConfigId] = useState<string>(
    existingConfig?.searchConfigId ?? ""
  );

  // Mutation : upsert de la ScheduleConfig (create si inexistante, update sinon)
  const upsertMutation = useUpsertScheduleConfig({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ScheduleConfig"] });
      toast.success("Planification enregistree");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  /**
   * Sauvegarde la configuration du scheduler via upsert.
   * - Si selectedSearchConfigId === "" → searchConfigId null (disconnect)
   * - Sinon → connect vers la SearchConfig selectionnee
   */
  const handleSave = () => {
    // Convertir la chaine vide en null pour la BDD
    const resolvedId =
      selectedSearchConfigId === "" ? null : selectedSearchConfigId;

    upsertMutation.mutate({
      where: { userId },
      create: {
        userId,
        isActive,
        hour,
        minute,
        timezone,
        // Connecter ou laisser null selon la selection
        ...(resolvedId
          ? { searchConfig: { connect: { id: resolvedId } } }
          : { searchConfigId: null }),
      },
      update: {
        isActive,
        hour,
        minute,
        timezone,
        // Connecter ou deconnecter selon la selection
        ...(resolvedId
          ? { searchConfig: { connect: { id: resolvedId } } }
          : { searchConfig: { disconnect: true } }),
      },
    });
  };

  // Detecter les modifications par rapport a la config sauvegardee
  const hasChanges =
    isActive !== (existingConfig?.isActive ?? false) ||
    hour !== (existingConfig?.hour ?? 8) ||
    minute !== (existingConfig?.minute ?? 0) ||
    timezone !== (existingConfig?.timezone ?? "Europe/Paris") ||
    selectedSearchConfigId !== (existingConfig?.searchConfigId ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recherche automatique
        </CardTitle>
        <CardDescription>
          Configurez l&apos;heure a laquelle l&apos;agent scrappe automatiquement les offres
          chaque jour selon vos criteres de recherche actifs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toggle activer/desactiver */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="scheduler-active" className="text-base font-medium">
              Activer la recherche automatique
            </Label>
            <p className="text-sm text-muted-foreground">
              L&apos;agent lancera une recherche chaque jour a l&apos;heure configuree
            </p>
          </div>
          <Switch
            id="scheduler-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        {/* Selecteur de SearchConfig a programmer */}
        <div className="space-y-1.5">
          <Label htmlFor="search-config-select">Recherche a planifier</Label>
          <p className="text-sm text-muted-foreground">
            Choisissez quelle recherche l&apos;agent doit executer automatiquement chaque jour.
          </p>

          {searchConfigs.length === 0 ? (
            // Etat vide : aucune SearchConfig creee → message clair avec CTA vers /searches
            <Alert>
              <Search className="h-4 w-4" />
              <AlertTitle>Aucune recherche creee</AlertTitle>
              <AlertDescription>
                Pour programmer une recherche automatique, vous devez d&apos;abord creer au
                moins une configuration de recherche.{" "}
                <a
                  href="/searches"
                  className="font-medium underline underline-offset-2 hover:text-foreground"
                >
                  Creer une recherche →
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Select
                value={selectedSearchConfigId}
                onValueChange={setSelectedSearchConfigId}
              >
                <SelectTrigger id="search-config-select">
                  <SelectValue placeholder="Selectionner une recherche..." />
                </SelectTrigger>
                <SelectContent>
                  {searchConfigs.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.name}
                      {!sc.isActive && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (desactivee)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Avertissement si le scheduler est actif mais aucune recherche choisie */}
              {isActive && selectedSearchConfigId === "" && (
                <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Aucune recherche selectionnee — le scheduler ne lancera rien.
                </p>
              )}
            </>
          )}
        </div>

        {/* Configuration heure + timezone (visible meme si inactif pour faciliter la configuration) */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Select heure */}
          <div className="space-y-1.5">
            <Label htmlFor="hour">Heure</Label>
            <Select
              value={String(hour)}
              onValueChange={(v) => setHour(parseInt(v))}
            >
              <SelectTrigger id="hour">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, "0")}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select minute */}
          <div className="space-y-1.5">
            <Label htmlFor="minute">Minute</Label>
            <Select
              value={String(minute)}
              onValueChange={(v) => setMinute(parseInt(v))}
            >
              <SelectTrigger id="minute">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    :{String(m).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select timezone */}
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resume de la planification enrichi avec le nom de la recherche */}
        {isActive && selectedSearchConfigId !== "" && (
          <p className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
            L&apos;agent se declenchera chaque jour a{" "}
            <strong className="text-foreground">{formatHour(hour, minute)}</strong>{" "}
            ({TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone})
            {" "}— recherche{" "}
            <strong className="text-foreground">
              &quot;{searchConfigs.find((s) => s.id === selectedSearchConfigId)?.name}&quot;
            </strong>
          </p>
        )}

        {/* Bouton enregistrer */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || upsertMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {upsertMutation.isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}
