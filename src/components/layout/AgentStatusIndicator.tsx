"use client";

/**
 * Rôle : Indicateur d'état de l'agent IA dans le header du dashboard
 * Interactions :
 *   - useFindManyAgentRun : polling adaptatif depuis ZenStack (2s si pending, 30s sinon)
 *   - Affiche l'icône Bot avec couleur selon l'état (gris / bleu pulse / vert / rouge)
 *   - DropdownMenu : historique des 10 derniers runs
 *
 * États visuels :
 *   - Inactif : icône grisée, pas de texte
 *   - Pending : icône bleue + animate-pulse + label tronqué (35 car max)
 *   - Succès < 30s : icône verte + résumé court (ex: "12 nouvelles offres")
 *   - Erreur récente : icône rouge (dernier run en erreur)
 *
 * Source de vérité : table AgentRun en BDD
 * Polling : 2s si un run est "pending", 30s sinon
 */

import { Bot, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFindManyAgentRun } from "@/lib/hooks/agent-run";
import type { AgentRun } from "@prisma/client";

// ─── Constantes ─────────────────────────────────────────────────────────────

/** Durée pendant laquelle le badge vert "succès" reste visible après la fin (ms) */
const SUCCESS_DISPLAY_DURATION_MS = 30_000;

/** Nombre maximum de caractères pour le label tronqué dans le bouton header */
const LABEL_TRUNCATE_LENGTH = 35;

/** Nombre de runs affichés dans le dropdown historique */
const RUNS_HISTORY_LIMIT = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formate une date en temps relatif simple (fr)
 * Ex: "il y a 2 min", "il y a 1h"
 */
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return "il y a quelques sec";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour}h`;
  return `il y a ${Math.floor(diffHour / 24)}j`;
}

/**
 * Extrait un résumé court lisible pour un run terminé avec succès
 * - Scraping → "12 nouvelles offres" ou "Scraping terminé"
 * - Application → "Candidature générée"
 */
function getSuccessSummary(run: AgentRun): string {
  if (run.type === "scraping" && run.result) {
    const result = run.result as { new?: number; total?: number };
    if (typeof result.new === "number") {
      return `${result.new} nouvelle${result.new !== 1 ? "s" : ""} offre${result.new !== 1 ? "s" : ""}`;
    }
  }
  if (run.type === "application") {
    return "Candidature générée";
  }
  return "Terminé";
}

/**
 * Tronque un label à n caractères en ajoutant "…" si nécessaire
 */
function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}

// ─── Icône de statut pour le dropdown ───────────────────────────────────────

/**
 * Rôle : Icône colorée indiquant le statut d'un run dans la liste historique
 * pending → horloge orange, success → check vert, error → croix rouge
 */
function RunStatusIcon({ status }: { status: string }) {
  if (status === "pending") {
    return <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
  if (status === "success") {
    return <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  }
  return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function AgentStatusIndicator() {
  /**
   * Polling adaptatif via Tanstack Query :
   *   - 2 000 ms si un run est "pending" (feedback quasi-temps-réel)
   *   - 30 000 ms sinon (économie de requêtes quand l'agent est inactif)
   *
   * ZenStack applique la policy @@allow('all', auth().id == userId)
   * → l'utilisateur ne voit que ses propres runs
   */
  const { data: runs = [] } = useFindManyAgentRun(
    { orderBy: { createdAt: "desc" }, take: RUNS_HISTORY_LIMIT },
    {
      refetchInterval: (query) =>
        query.state.data?.some((r) => r.status === "pending")
          ? 2_000
          : 30_000,
    }
  );

  // ─── Calcul de l'état courant ───────────────────────────────────────────

  /** Run actuellement en cours (status = "pending") */
  const pendingRun = runs.find((r) => r.status === "pending");

  /** Dernier run (quel que soit son statut) */
  const lastRun = runs[0];

  /**
   * Badge vert visible pendant 30s après un run réussi
   * Condition : dernier run = "success" ET terminé il y a moins de 30s
   */
  const isRecentSuccess =
    !pendingRun &&
    lastRun?.status === "success" &&
    Date.now() - new Date(lastRun.updatedAt).getTime() < SUCCESS_DISPLAY_DURATION_MS;

  /**
   * Badge rouge si le dernier run terminé est en erreur (sans run en cours)
   */
  const hasRecentError = !pendingRun && lastRun?.status === "error";

  // ─── Couleur et contenu du bouton header ──────────────────────────────

  /** Style de l'icône Bot selon l'état courant */
  const botIconStyle = (() => {
    if (pendingRun) return { color: "#0057BA" }; // bleu primaire brand
    if (isRecentSuccess) return { color: "#059669" }; // emerald-600
    if (hasRecentError) return { color: "hsl(var(--destructive))" }; // rouge
    return { color: "#9CA3AF" }; // gris inactif
  })();

  /** Texte court affiché à côté de l'icône (seulement si agent actif) */
  const statusText = (() => {
    if (pendingRun) return truncate(pendingRun.label, LABEL_TRUNCATE_LENGTH);
    if (isRecentSuccess && lastRun) return getSuccessSummary(lastRun);
    return null;
  })();

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/*
         * Bouton header — cohérent avec le style ghost du Header
         * animate-pulse uniquement si agent en cours
         */}
        <Button
          variant="ghost"
          size="sm"
          className={[
            "flex items-center gap-1.5 px-2 h-8",
            // Gris très léger au survol pour cohérence avec le header #F8F7F5
            "hover:bg-black/5",
          ].join(" ")}
        >
          <Bot
            className={[
              "h-4 w-4 transition-colors",
              // Pulse uniquement si pending → attire l'attention sans être agressif
              pendingRun ? "animate-pulse" : "",
            ].join(" ")}
            style={botIconStyle}
          />

          {/* Texte de statut — visible uniquement si agent actif ou succès récent */}
          {statusText && (
            <span
              className="text-xs font-medium max-w-[200px] truncate"
              style={{ color: botIconStyle.color }}
            >
              {statusText}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      {/*
       * Dropdown historique des 10 derniers runs
       * w-80 pour afficher les labels complets
       * align="end" pour rester dans la zone droite du header
       */}
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* En-tête du dropdown */}
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold text-foreground">
            Activité de l'agent
          </p>
          <p className="text-xs text-muted-foreground">
            10 dernières exécutions
          </p>
        </div>

        {/* Liste des runs */}
        <div className="max-h-[340px] overflow-y-auto">
          {runs.length === 0 ? (
            /* État vide — aucun run lancé */
            <div className="px-3 py-6 text-center">
              <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aucune exécution pour le moment
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Lancez un scraping depuis Recherches
              </p>
            </div>
          ) : (
            runs.map((run) => (
              <RunItem key={run.id} run={run} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sous-composant : ligne d'un run dans le dropdown ────────────────────────

/**
 * Rôle : Affiche un seul run dans la liste historique du dropdown
 * Contient : icône status, label, résumé/erreur, date relative
 */
function RunItem({ run }: { run: AgentRun }) {
  /** Résumé court affiché sous le label */
  const detail = (() => {
    if (run.status === "success") return getSuccessSummary(run);
    if (run.status === "error" && run.error) {
      // Tronquer les messages d'erreur longs
      return truncate(run.error, 60);
    }
    if (run.status === "pending") return "En cours…";
    return null;
  })();

  /** Couleur du texte "detail" selon le statut */
  const detailColor = (() => {
    if (run.status === "success") return "text-emerald-600";
    if (run.status === "error") return "text-destructive";
    return "text-amber-500";
  })();

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors border-b last:border-0">
      {/* Icône statut — alignée avec la première ligne du label */}
      <div className="mt-0.5">
        <RunStatusIcon status={run.status} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        {/* Label du run (ex: "Scraping — React Paris") */}
        <p className="text-xs font-medium text-foreground truncate">
          {run.label}
        </p>

        {/* Détail : résumé succès / message erreur / "En cours…" */}
        {detail && (
          <p className={`text-xs mt-0.5 ${detailColor}`}>
            {detail}
          </p>
        )}
      </div>

      {/* Date relative — alignée à droite */}
      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatRelativeTime(new Date(run.createdAt))}
      </span>
    </div>
  );
}
