"use client";

import { Pencil, Trash2, Play, Loader2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useSearchConfigStore,
  AVAILABLE_SITES,
  type SearchConfigFormData,
} from "@/lib/stores/search-config-store";
// Note : l'etat isLaunching est gere par Tanstack Query (useMutation.isPending)
// et passe en prop depuis le parent, au lieu d'etre stocke dans Zustand

/**
 * Role : Carte affichant un critere de recherche avec ses parametres
 * Affiche : nom, requete, localisation, sites, type de contrat, remote, salaire min
 * Actions : editer, supprimer, activer/desactiver, lancer la recherche
 * Utilise par : page /searches (liste de cards)
 *
 * Exemple :
 *   <SearchConfigCard
 *     config={searchConfig}
 *     onDelete={(id) => deleteMutation.mutate(id)}
 *     onToggleActive={(id, isActive) => toggleMutation.mutate({ id, isActive })}
 *     onLaunchSearch={(id) => launchMutation.mutate(id)}
 *   />
 */
interface SearchConfigCardProps {
  config: SearchConfigFormData & { id: string };
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onLaunchSearch: (id: string) => void;
  /** Indique si cette config est en cours de lancement (gere par useMutation.isPending) */
  isLaunching?: boolean;
  /** Indique si le toggle actif/inactif est en attente pour cette card specifiquement */
  isToggling?: boolean;
  /** Indique si la suppression est en cours pour cette card specifiquement */
  isDeleting?: boolean;
}

export function SearchConfigCard({
  config,
  onDelete,
  onToggleActive,
  onLaunchSearch,
  isLaunching = false,
  isToggling = false,
  isDeleting = false,
}: SearchConfigCardProps) {
  // Etat Zustand : ouverture du formulaire d'edition
  const openEditForm = useSearchConfigStore((s) => s.actions.openEditForm);

  // Trouver les labels des sites selectionnes
  const siteLabels = config.sites
    .map((s) => AVAILABLE_SITES.find((site) => site.value === s)?.label ?? s)
    .join(", ");

  return (
    <Card className={!config.isActive ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{config.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            &quot;{config.query}&quot; a {config.location}
          </p>
        </div>

        {/* Badge actif/inactif */}
        <Badge variant={config.isActive ? "default" : "secondary"}>
          {config.isActive ? "Actif" : "Inactif"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Details de la configuration */}
        <div className="flex flex-wrap gap-2 text-sm">
          {/* Sites */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Sites :</span>
            <span>{siteLabels}</span>
          </div>

          {/* Types de contrat */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Contrat :</span>
            <span>{config.contractTypes.join(", ")}</span>
          </div>

          {/* Remote */}
          {config.remote && (
            <Badge variant="outline">Teletravail</Badge>
          )}

          {/* Salaire minimum */}
          {config.salaryMin && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Salaire min :</span>
              <span>{config.salaryMin.toLocaleString("fr-FR")} EUR</span>
            </div>
          )}
        </div>

        {/* Mots-cles exclus */}
        {config.excludeKeywords && config.excludeKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Exclus :</span>
            {config.excludeKeywords.map((kw) => (
              <Badge key={kw} variant="destructive" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 pt-2">
          {/* Lancer la recherche */}
          <Button
            size="sm"
            onClick={() => onLaunchSearch(config.id)}
            disabled={!config.isActive || isLaunching}
          >
            {isLaunching ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1 h-4 w-4" />
            )}
            {isLaunching ? "Recherche..." : "Lancer"}
          </Button>

          {/* Toggle actif/inactif — spinner pendant la mutation */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleActive(config.id, !config.isActive)}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : config.isActive ? (
              <PowerOff className="mr-1 h-4 w-4" />
            ) : (
              <Power className="mr-1 h-4 w-4" />
            )}
            {isToggling
              ? config.isActive ? "Desactivation..." : "Activation..."
              : config.isActive ? "Desactiver" : "Activer"}
          </Button>

          {/* Editer — action Zustand synchrone, pas de spinner */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditForm(config)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {/* Supprimer — spinner a la place de la corbeille pendant la mutation */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(config.id)}
            disabled={isDeleting}
          >
            {isDeleting
              ? <Loader2 className="h-4 w-4 animate-spin text-destructive" />
              : <Trash2 className="h-4 w-4 text-destructive" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
