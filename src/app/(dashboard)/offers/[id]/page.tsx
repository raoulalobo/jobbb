"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFindUniqueOffer, useUpdateOffer } from "@/lib/hooks";
import { OfferDetailSkeleton } from "@/components/offers/OfferDetailSkeleton";

/**
 * Role : Page detail d'une offre d'emploi
 * Affiche toutes les informations de l'offre (titre, entreprise, description, etc.)
 * Marque automatiquement l'offre comme lue (isNew: false) a l'ouverture
 * Permet de basculer le bookmark et de voir l'offre originale
 *
 * Parametres de route :
 *   - id : identifiant unique de l'offre (cuid)
 *
 * Hooks utilises :
 *   - useFindUniqueOffer : charge l'offre depuis l'API ZenStack
 *   - useUpdateOffer : mutation pour marquer lu / toggle bookmark
 *   - useParams() : recupere l'id depuis l'URL (Next.js 16 pattern client)
 */

/**
 * Mappe le code source vers un label affichable
 * Exemple : "linkedin" -> "LinkedIn"
 */
function formatSource(source: string): string {
  const map: Record<string, string> = {
    linkedin: "LinkedIn",
    indeed: "Indeed",
    wttj: "WTTJ",
  };
  return map[source] ?? source;
}

/**
 * Formate une date en francais (jour/mois/annee)
 * Exemple : "18/02/2026"
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function OfferDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  // Ref pour eviter le double appel du marquage lu en React Strict Mode
  const hasMarkedAsRead = useRef(false);

  // Query : charger l'offre par son id
  const { data: offer, isLoading } = useFindUniqueOffer({
    where: { id },
  });

  // Mutation : mise a jour generique (marquage lu + bookmark)
  const updateMutation = useUpdateOffer({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Offer"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour");
    },
  });

  // Marquage automatique comme lu a l'ouverture de l'offre
  // Le useRef empeche le double appel en React Strict Mode (dev)
  useEffect(() => {
    if (offer && offer.isNew && !hasMarkedAsRead.current) {
      hasMarkedAsRead.current = true;
      updateMutation.mutate({
        where: { id },
        data: { isNew: false },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer?.id, offer?.isNew]);

  // Toggle le bookmark de l'offre
  const handleToggleBookmark = () => {
    if (!offer) return;
    updateMutation.mutate({
      where: { id },
      data: { isBookmarked: !offer.isBookmarked },
    });
  };

  // Skeleton affiché pendant le chargement de l'offre
  if (isLoading) {
    return <OfferDetailSkeleton />;
  }

  // Offre non trouvee
  if (!offer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/offers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Link>
        </Button>
        <p className="text-muted-foreground">Offre introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bouton retour vers la liste */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/offers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux offres
        </Link>
      </Button>

      {/* Card principale : informations de l'offre */}
      <Card>
        <CardHeader>
          {/* Titre de l'offre */}
          <CardTitle className="text-2xl">{offer.title}</CardTitle>

          {/* Entreprise et localisation */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {offer.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {offer.location}
            </span>
          </div>

          {/* Badges : source et type de contrat */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">{formatSource(offer.source)}</Badge>
            {offer.contractType && (
              <Badge variant="outline">{offer.contractType}</Badge>
            )}
          </div>

          {/* Salaire si present */}
          {offer.salary && (
            <p className="pt-1 text-lg font-semibold text-primary">
              {offer.salary}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            {/* Lien vers l'offre originale (ouvre un nouvel onglet) */}
            <Button asChild>
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir l&apos;offre originale
              </a>
            </Button>

            {/* Toggle bookmark */}
            <Button
              variant={offer.isBookmarked ? "default" : "outline"}
              onClick={handleToggleBookmark}
              disabled={updateMutation.isPending}
            >
              <Bookmark
                className={`mr-2 h-4 w-4 ${
                  offer.isBookmarked ? "fill-current" : ""
                }`}
              />
              {offer.isBookmarked ? "Favori" : "Ajouter aux favoris"}
            </Button>

            {/* Placeholder Phase 6 : postuler avec l'IA (desactive) */}
            <Button variant="outline" disabled>
              <Bot className="mr-2 h-4 w-4" />
              Postuler avec l&apos;IA
            </Button>
          </div>

          {/* Description complete de l'offre */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {offer.description}
            </p>
          </div>

          {/* Metadonnees en grille 2 colonnes */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Informations</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Date de publication */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date :</span>
                <span>{formatDate(offer.createdAt)}</span>
              </div>

              {/* Source */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Source :</span>
                <span>{formatSource(offer.source)}</span>
              </div>

              {/* Type de contrat */}
              {offer.contractType && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Contrat :</span>
                  <span>{offer.contractType}</span>
                </div>
              )}

              {/* Salaire */}
              {offer.salary && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Salaire :</span>
                  <span>{offer.salary}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
