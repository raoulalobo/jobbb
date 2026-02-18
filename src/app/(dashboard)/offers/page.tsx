"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFindManyOffer, useCountOffer, useUpdateOffer } from "@/lib/hooks";
import { useSearchStore } from "@/lib/stores/search-store";
import { OfferCard } from "@/components/offers/OfferCard";
import { OfferFilters } from "@/components/offers/OfferFilters";

/**
 * Role : Page liste des offres d'emploi avec filtres et pagination
 * Affiche une grille de cartes OfferCard filtrees via OfferFilters
 * Utilise les hooks ZenStack (useFindManyOffer, useCountOffer) pour le fetching
 * Etat des filtres gere par useSearchStore (Zustand)
 *
 * Fonctionnalites :
 *   - Filtrage par source, contrat, nouvelles, favoris, recherche textuelle
 *   - Pagination (20 offres par page)
 *   - Toggle bookmark avec mutation + invalidation du cache
 *   - Etats vide et chargement
 */
export default function OffersPage() {
  const queryClient = useQueryClient();

  // Selecteurs Zustand granulaires pour les filtres et la pagination
  const searchQuery = useSearchStore((s) => s.filters.searchQuery);
  const source = useSearchStore((s) => s.filters.source);
  const contractType = useSearchStore((s) => s.filters.contractType);
  const onlyNew = useSearchStore((s) => s.filters.onlyNew);
  const onlyBookmarked = useSearchStore((s) => s.filters.onlyBookmarked);
  const currentPage = useSearchStore((s) => s.currentPage);
  const pageSize = useSearchStore((s) => s.pageSize);
  const setPage = useSearchStore((s) => s.actions.setPage);

  // Construction dynamique de la clause `where` Prisma depuis les filtres actifs
  const where = useMemo(() => {
    const conditions: Prisma.OfferWhereInput = {};

    // Filtre par source (ex: "linkedin", "indeed", "wttj")
    if (source) {
      conditions.source = source;
    }

    // Filtre par type de contrat (ex: "CDI", "CDD")
    if (contractType) {
      conditions.contractType = contractType;
    }

    // Toggle nouvelles offres uniquement
    if (onlyNew) {
      conditions.isNew = true;
    }

    // Toggle favoris uniquement
    if (onlyBookmarked) {
      conditions.isBookmarked = true;
    }

    // Recherche textuelle sur titre, entreprise ou description (insensitive)
    if (searchQuery.trim()) {
      conditions.OR = [
        { title: { contains: searchQuery.trim(), mode: "insensitive" } },
        { company: { contains: searchQuery.trim(), mode: "insensitive" } },
        { description: { contains: searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    return conditions;
  }, [source, contractType, onlyNew, onlyBookmarked, searchQuery]);

  // Query : liste des offres paginee avec filtres
  const { data: offers, isLoading } = useFindManyOffer({
    where,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  // Query : comptage total pour la pagination
  const { data: totalCount } = useCountOffer({ where });

  // Calcul du nombre total de pages
  const totalPages = typeof totalCount === "number"
    ? Math.ceil(totalCount / pageSize)
    : 0;

  // Mutation : basculer le bookmark d'une offre
  const bookmarkMutation = useUpdateOffer({
    onSuccess: () => {
      // Rafraichir toutes les queries Offer apres modification du bookmark
      queryClient.invalidateQueries({ queryKey: ["Offer"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour du favori");
    },
  });

  /**
   * Toggle le bookmark d'une offre : inverse la valeur actuelle de isBookmarked
   * @param offerId - identifiant de l'offre a modifier
   */
  const handleToggleBookmark = (offerId: string) => {
    const offer = offers?.find((o) => o.id === offerId);
    if (!offer) return;

    bookmarkMutation.mutate({
      where: { id: offerId },
      data: { isBookmarked: !offer.isBookmarked },
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tete avec compteur d'offres */}
      <div>
        <h1 className="text-2xl font-bold">Offres d&apos;emploi</h1>
        <p className="text-muted-foreground">
          {typeof totalCount === "number"
            ? `${totalCount} offre${totalCount > 1 ? "s" : ""} disponible${totalCount > 1 ? "s" : ""}`
            : "Chargement..."}
        </p>
      </div>

      {/* Barre de filtres */}
      <OfferFilters />

      {/* Etat de chargement */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Grille d'offres — 3 colonnes sur desktop, 2 sur tablette, 1 sur mobile */}
      {offers && offers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onToggleBookmark={handleToggleBookmark}
              isTogglingBookmark={
                bookmarkMutation.isPending &&
                bookmarkMutation.variables?.where?.id === offer.id
              }
            />
          ))}
        </div>
      )}

      {/* Etat vide : aucune offre trouvee */}
      {offers && offers.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune offre trouvee</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Lancez une recherche pour decouvrir des offres d&apos;emploi.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/searches">Configurer une recherche</Link>
          </Button>
        </div>
      )}

      {/* Pagination : boutons Precedent / Suivant */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
