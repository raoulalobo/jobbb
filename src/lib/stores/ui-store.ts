import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Role : Store Zustand pour l'etat UI global
 * Centralise : sidebar mobile, modals, etats de chargement, avatar preview
 * Utilise par : layout dashboard, header, mobile nav, profil, et tous composants UI partages
 *
 * Exemple :
 *   const isSidebarOpen = useUiStore((s) => s.isSidebarOpen)
 *   const toggleSidebar = useUiStore((s) => s.actions.toggleSidebar)
 */
interface UiState {
  // Etat de la sidebar mobile
  isSidebarOpen: boolean;
  // Etat de chargement de la recherche d'offres
  isSearchLoading: boolean;
  // Modal actuellement ouverte (null si aucune)
  activeModal: string | null;
  // URL de preview de l'avatar (affichage immediat apres upload)
  avatarPreview: string | null;
  // Etat de chargement de l'upload avatar
  isUploadingAvatar: boolean;

  // Actions pour modifier l'etat
  actions: {
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSearchLoading: (loading: boolean) => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
    setAvatarPreview: (url: string | null) => void;
    setUploadingAvatar: (loading: boolean) => void;
  };
}

export const useUiStore = create<UiState>()(
  immer((set) => ({
    isSidebarOpen: false,
    isSearchLoading: false,
    activeModal: null,
    avatarPreview: null,
    isUploadingAvatar: false,

    actions: {
      toggleSidebar: () =>
        set((state) => {
          state.isSidebarOpen = !state.isSidebarOpen;
        }),

      setSidebarOpen: (open: boolean) =>
        set((state) => {
          state.isSidebarOpen = open;
        }),

      setSearchLoading: (loading: boolean) =>
        set((state) => {
          state.isSearchLoading = loading;
        }),

      openModal: (modalId: string) =>
        set((state) => {
          state.activeModal = modalId;
        }),

      closeModal: () =>
        set((state) => {
          state.activeModal = null;
        }),

      setAvatarPreview: (url: string | null) =>
        set((state) => {
          state.avatarPreview = url;
        }),

      setUploadingAvatar: (loading: boolean) =>
        set((state) => {
          state.isUploadingAvatar = loading;
        }),
    },
  }))
);
