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
import { Bookmark, X } from "lucide-react";
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
  const setFilter = useSearchStore((s) => s.actions.setFilter);
  const resetFilters = useSearchStore((s) => s.actions.resetFilters);

  // Determine si au moins un filtre est actif pour afficher le bouton "Effacer"
  const hasActiveFilters =
    searchQuery !== "" ||
    source !== null ||
    contractType !== null ||
    onlyNew ||
    onlyBookmarked;

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
