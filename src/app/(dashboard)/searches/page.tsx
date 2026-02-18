"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchConfigCard } from "@/components/search/SearchConfigCard";
import { SearchConfigCardSkeleton } from "@/components/search/SearchConfigCardSkeleton";
import { SearchConfigForm } from "@/components/search/SearchConfigForm";
import {
  useSearchConfigStore,
  type SearchConfigFormData,
} from "@/lib/stores/search-config-store";
import { authClient } from "@/lib/auth-client";

/**
 * Role : Page de gestion des criteres de recherche d'emploi
 * Affiche la liste des SearchConfig sous forme de cards
 * Permet de creer, editer, supprimer, activer/desactiver et lancer une recherche
 * Utilise par : route /searches
 * Etat : useSearchConfigStore (Zustand) pour le formulaire modal
 * Data : Tanstack Query pour le fetching/mutations via API ZenStack
 */
export default function SearchesPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  // Etat Zustand : ouverture du formulaire de creation
  const openCreateForm = useSearchConfigStore((s) => s.actions.openCreateForm);
  const closeForm = useSearchConfigStore((s) => s.actions.closeForm);
  const formData = useSearchConfigStore((s) => s.formData);

  // Query : recuperer toutes les configs de recherche de l'utilisateur
  const { data: configs, isLoading } = useQuery({
    queryKey: ["searchConfigs"],
    queryFn: async () => {
      const res = await fetch("/api/model/searchConfig/findMany", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des recherches");
      const json = await res.json();
      return json.data as (SearchConfigFormData & { id: string })[];
    },
  });

  // Mutation : creer ou mettre a jour une config
  const saveMutation = useMutation({
    mutationFn: async (data: SearchConfigFormData) => {
      if (!session?.user?.id) throw new Error("Utilisateur non connecte");

      const payload = {
        name: data.name,
        query: data.query,
        location: data.location,
        sites: data.sites,
        remote: data.remote,
        salaryMin: data.salaryMin,
        contractTypes: data.contractTypes,
        excludeKeywords: data.excludeKeywords,
        isActive: data.isActive,
      };

      if (data.id) {
        // Mise a jour
        const res = await fetch("/api/model/searchConfig/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            where: { id: data.id },
            data: payload,
          }),
        });
        if (!res.ok) throw new Error("Erreur lors de la mise a jour");
        return res.json();
      } else {
        // Creation avec connexion de l'utilisateur
        const res = await fetch("/api/model/searchConfig/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              ...payload,
              user: { connect: { id: session.user.id } },
            },
          }),
        });
        if (!res.ok) throw new Error("Erreur lors de la creation");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(
        formData.id ? "Recherche mise a jour" : "Recherche creee"
      );
      queryClient.invalidateQueries({ queryKey: ["searchConfigs"] });
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation : supprimer une config
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/model/searchConfig/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ where: { id } }),
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Recherche supprimee");
      queryClient.invalidateQueries({ queryKey: ["searchConfigs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation : toggle actif/inactif
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch("/api/model/searchConfig/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: { id },
          data: { isActive },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise a jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchConfigs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation : lancer une recherche via l'agent IA de scraping LinkedIn
  const launchMutation = useMutation({
    mutationFn: async (searchConfigId: string) => {
      const res = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchConfigId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur lors du lancement");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Recherche lancee avec succes");
      // Rafraichir les offres apres scraping
      queryClient.invalidateQueries({ queryKey: ["Offer"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* En-tete avec bouton de creation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes recherches</h1>
          <p className="text-muted-foreground">
            Configurez vos criteres de recherche d&apos;emploi
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle recherche
        </Button>
      </div>

      {/* Skeleton de chargement : grille de 4 cartes pendant isLoading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SearchConfigCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Liste des configurations de recherche */}
      {configs && configs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {configs.map((config) => (
            <SearchConfigCard
              key={config.id}
              config={config}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggleActive={(id, isActive) =>
                toggleMutation.mutate({ id, isActive })
              }
              onLaunchSearch={(id) => launchMutation.mutate(id)}
              isLaunching={launchMutation.isPending && launchMutation.variables === config.id}
            />
          ))}
        </div>
      )}

      {/* Etat vide : aucune configuration */}
      {configs && configs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune recherche configuree</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Creez votre premiere recherche pour commencer a trouver des offres.
          </p>
          <Button className="mt-4" onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Creer ma premiere recherche
          </Button>
        </div>
      )}

      {/* Modal de creation/edition */}
      <SearchConfigForm
        isPending={saveMutation.isPending}
        onSubmit={() => saveMutation.mutate(formData)}
      />
    </div>
  );
}
