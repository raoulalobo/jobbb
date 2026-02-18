"use client";

/**
 * Role : Formulaire de configuration du scheduler de recherche automatique
 * Permet a l'utilisateur de :
 *   - Activer/desactiver la recherche automatique (Switch isActive)
 *   - Configurer l'heure de declenchement (Select heure + minute)
 *   - Choisir sa timezone (Select parmi les zones courantes)
 *
 * Comportement :
 *   - Au chargement, lit la ScheduleConfig existante de l'utilisateur (si elle existe)
 *   - Upsert (create ou update) via useUpsertScheduleConfig au clic "Enregistrer"
 *   - Le composant est monte uniquement une fois que session.user.id est disponible
 *     (ce qui permet d'initialiser l'etat depuis les props sans useEffect)
 *
 * Interactions :
 *   - useFindFirstScheduleConfig : lit la config existante de l'utilisateur
 *   - useUpsertScheduleConfig : cree ou met a jour la config
 *   - authClient.useSession() : fournit l'userId necessaire pour l'upsert
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";
import type { ScheduleConfig } from "@prisma/client";
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
}

/**
 * Formulaire de configuration du scheduler.
 * Monte uniquement quand userId est disponible pour eviter useEffect de sync.
 * L'etat est initialise depuis les props au premier rendu (pattern React recommande).
 */
export function ScheduleConfigForm({
  userId,
  existingConfig,
}: ScheduleConfigFormProps) {
  const queryClient = useQueryClient();

  // Etat initialise depuis la config existante, ou valeurs par defaut
  const [isActive, setIsActive] = useState(existingConfig?.isActive ?? false);
  const [hour, setHour] = useState(existingConfig?.hour ?? 8);
  const [minute, setMinute] = useState(existingConfig?.minute ?? 0);
  const [timezone, setTimezone] = useState(
    existingConfig?.timezone ?? "Europe/Paris"
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
   * Sauvegarde la configuration du scheduler via upsert
   * Create si aucune config existante, update sinon
   */
  const handleSave = () => {
    upsertMutation.mutate({
      where: { userId },
      create: { userId, isActive, hour, minute, timezone },
      update: { isActive, hour, minute, timezone },
    });
  };

  // Detecter les modifications par rapport a la config sauvegardee
  const hasChanges =
    isActive !== (existingConfig?.isActive ?? false) ||
    hour !== (existingConfig?.hour ?? 8) ||
    minute !== (existingConfig?.minute ?? 0) ||
    timezone !== (existingConfig?.timezone ?? "Europe/Paris");

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

        {/* Resume de la planification */}
        {isActive && (
          <p className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
            L&apos;agent se declenchera chaque jour a{" "}
            <strong className="text-foreground">
              {formatHour(hour, minute)}
            </strong>{" "}
            ({TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone})
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
