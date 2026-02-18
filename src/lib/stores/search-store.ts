import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Role : Store Zustand pour l'etat de la recherche en cours
 * Gere les filtres actifs, la pagination et les resultats temporaires
 * Utilise par : composants search, offers, filtres
 *
 * Exemple :
 *   const filters = useSearchStore((s) => s.filters)
 *   const { setFilter, resetFilters } = useSearchStore((s) => s.actions)
 */

interface SearchFilters {
  // Filtre par source (wttj, indeed, linkedin)
  source: string | null;
  // Filtre par type de contrat
  contractType: string | null;
  // Afficher uniquement les nouvelles offres
  onlyNew: boolean;
  // Afficher uniquement les offres favorites
  onlyBookmarked: boolean;
  // Recherche textuelle
  searchQuery: string;
}

interface SearchState {
  // Filtres actifs pour la liste d'offres
  filters: SearchFilters;
  // Page actuelle pour la pagination
  currentPage: number;
  // Nombre d'elements par page
  pageSize: number;

  // Actions pour modifier l'etat
  actions: {
    setFilter: <K extends keyof SearchFilters>(
      key: K,
      value: SearchFilters[K]
    ) => void;
    resetFilters: () => void;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}

// Filtres par defaut
const DEFAULT_FILTERS: SearchFilters = {
  source: null,
  contractType: null,
  onlyNew: false,
  onlyBookmarked: false,
  searchQuery: "",
};

export const useSearchStore = create<SearchState>()(
  immer((set) => ({
    filters: { ...DEFAULT_FILTERS },
    currentPage: 1,
    pageSize: 20,

    actions: {
      setFilter: (key, value) =>
        set((state) => {
          state.filters[key] = value;
          // Retour a la page 1 quand un filtre change
          state.currentPage = 1;
        }),

      resetFilters: () =>
        set((state) => {
          state.filters = { ...DEFAULT_FILTERS };
          state.currentPage = 1;
        }),

      setPage: (page: number) =>
        set((state) => {
          state.currentPage = page;
        }),

      setPageSize: (size: number) =>
        set((state) => {
          state.pageSize = size;
          state.currentPage = 1;
        }),
    },
  }))
);
