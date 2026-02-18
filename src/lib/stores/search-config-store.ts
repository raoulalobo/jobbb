import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Role : Store Zustand pour la gestion des configurations de recherche
 * Gere l'etat du formulaire d'edition/creation, la modal, et la config selectionnee
 * Utilise par : SearchConfigCard, SearchConfigForm, page /searches
 *
 * Exemple :
 *   const isFormOpen = useSearchConfigStore((s) => s.isFormOpen)
 *   const openCreateForm = useSearchConfigStore((s) => s.actions.openCreateForm)
 */

// Site unique supporte pour le scraping (LinkedIn authentifie)
export const AVAILABLE_SITES = [
  { value: "linkedin", label: "LinkedIn" },
] as const;

// Types de contrat disponibles
export const CONTRACT_TYPES = [
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "freelance", label: "Freelance" },
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
] as const;

// Donnees du formulaire de configuration
export interface SearchConfigFormData {
  id?: string;
  name: string;
  query: string;
  location: string;
  sites: string[];
  remote: boolean;
  salaryMin: number | null;
  contractTypes: string[];
  excludeKeywords: string[];
  isActive: boolean;
}

// Valeurs par defaut pour une nouvelle configuration
export const DEFAULT_SEARCH_CONFIG: SearchConfigFormData = {
  name: "",
  query: "",
  location: "",
  sites: ["linkedin"],
  remote: false,
  salaryMin: null,
  contractTypes: ["CDI"],
  excludeKeywords: [],
  isActive: true,
};

interface SearchConfigState {
  // Modal du formulaire ouverte ou fermee
  isFormOpen: boolean;
  // Donnees du formulaire en cours d'edition
  formData: SearchConfigFormData;

  // Actions
  actions: {
    // Ouvrir le formulaire en mode creation
    openCreateForm: () => void;
    // Ouvrir le formulaire en mode edition avec les donnees existantes
    openEditForm: (config: SearchConfigFormData) => void;
    // Fermer le formulaire
    closeForm: () => void;
    // Mettre a jour un champ du formulaire
    updateFormField: <K extends keyof SearchConfigFormData>(
      key: K,
      value: SearchConfigFormData[K]
    ) => void;
  };
}

export const useSearchConfigStore = create<SearchConfigState>()(
  immer((set) => ({
    isFormOpen: false,
    formData: { ...DEFAULT_SEARCH_CONFIG },

    actions: {
      openCreateForm: () =>
        set((state) => {
          state.formData = { ...DEFAULT_SEARCH_CONFIG };
          state.isFormOpen = true;
        }),

      openEditForm: (config: SearchConfigFormData) =>
        set((state) => {
          state.formData = { ...config };
          state.isFormOpen = true;
        }),

      closeForm: () =>
        set((state) => {
          state.isFormOpen = false;
        }),

      updateFormField: (key, value) =>
        set((state) => {
          (state.formData as Record<string, unknown>)[key] = value;
        }),
    },
  }))
);
