"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bookmark, CalendarClock, MousePointerClick, SendHorizontal, X } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";

/**
 * Role : Barre de filtres pour la liste des offres d'emploi
 * Consomme le store Zustand useSearchStore pour lire/modifier les filtres
 * Utilise des selecteurs granulaires pour eviter les re-renders inutiles
 *
 * Filtres disponibles :
 *   - Recherche textuelle (titre, entreprise, description)
 *   - Source (LinkedIn, Indeed, WTTJ)
 *   - Type de contrat (CDI, CDD, Freelance, Alternance, Stage)
 *   - Toggle "Nouvelles uniquement"
 *   - Toggle "Favoris"
 *   - Bouton "Effacer les filtres" (visible si au moins un filtre actif)
 *
 * Exemple :
 *   <OfferFilters />
 */
export function OfferFilters() {
  // Selecteurs granulaires Zustand : chaque filtre est lu independamment
  const searchQuery = useSearchStore((s) => s.filters.searchQuery);
  const source = useSearchStore((s) => s.filters.source);
  const contractType = useSearchStore((s) => s.filters.contractType);
  const onlyNew = useSearchStore((s) => s.filters.onlyNew);
  const onlyBookmarked = useSearchStore((s) => s.filters.onlyBookmarked);
  // Filtre par origine : "scheduled" (Inngest auto) | "sandbox" (manuel) | null (toutes)
  const origin = useSearchStore((s) => s.filters.origin);
  // Masquer les offres postulees (true par defaut) — false = afficher toutes
  const hideApplied = useSearchStore((s) => s.filters.hideApplied);
  const setFilter = useSearchStore((s) => s.actions.setFilter);
  const resetFilters = useSearchStore((s) => s.actions.resetFilters);

  // Determine si au moins un filtre est actif pour afficher le bouton "Effacer"
  // !hideApplied = l'utilisateur a active l'affichage des offres postulees (hors default)
  const hasActiveFilters =
    searchQuery !== "" ||
    source !== null ||
    contractType !== null ||
    onlyNew ||
    onlyBookmarked ||
    origin !== null ||
    !hideApplied;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Recherche textuelle */}
      <Input
        placeholder="Rechercher (titre, entreprise...)"
        value={searchQuery}
        onChange={(e) => setFilter("searchQuery", e.target.value)}
        className="w-64"
      />

      {/* Filtre par source */}
      <Select
        value={source ?? "all"}
        onValueChange={(val) =>
          setFilter("source", val === "all" ? null : val)
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les sources</SelectItem>
          <SelectItem value="linkedin">LinkedIn</SelectItem>
          <SelectItem value="indeed">Indeed</SelectItem>
          <SelectItem value="wttj">WTTJ</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtre par origine : planifiée (Inngest) ou sandbox (manuel) */}
      <Select
        value={origin ?? "all"}
        onValueChange={(v) => setFilter("origin", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Origine" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes origines</SelectItem>
          <SelectItem value="scheduled">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Planifiées
            </span>
          </SelectItem>
          <SelectItem value="sandbox">
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Sandbox
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Filtre par type de contrat */}
      <Select
        value={contractType ?? "all"}
        onValueChange={(val) =>
          setFilter("contractType", val === "all" ? null : val)
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Contrat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les contrats</SelectItem>
          <SelectItem value="CDI">CDI</SelectItem>
          <SelectItem value="CDD">CDD</SelectItem>
          <SelectItem value="Freelance">Freelance</SelectItem>
          <SelectItem value="Alternance">Alternance</SelectItem>
          <SelectItem value="Stage">Stage</SelectItem>
        </SelectContent>
      </Select>

      {/* Toggle "Nouvelles uniquement" */}
      <Button
        variant={onlyNew ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("onlyNew", !onlyNew)}
      >
        Nouvelles
      </Button>

      {/* Toggle "Favoris" */}
      <Button
        variant={onlyBookmarked ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("onlyBookmarked", !onlyBookmarked)}
      >
        <Bookmark className="mr-1.5 h-4 w-4" />
        Favoris
      </Button>

      {/* Toggle "Postulées" — actif quand hideApplied=false (offres postulees visibles) */}
      <Button
        variant={!hideApplied ? "default" : "outline"}
        size="sm"
        onClick={() => setFilter("hideApplied", !hideApplied)}
      >
        <SendHorizontal className="mr-1.5 h-4 w-4" />
        Postulées
      </Button>

      {/* Bouton "Effacer les filtres" — visible uniquement si un filtre est actif */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="mr-1.5 h-4 w-4" />
          Effacer les filtres
        </Button>
      )}
    </div>
  );
}
