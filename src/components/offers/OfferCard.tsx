"use client";

import Link from "next/link";
import type { Offer } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, CalendarClock, MapPin, MousePointerClick, Building2 } from "lucide-react";

/**
 * Role : Carte d'offre d'emploi affichee dans la grille de la page /offers
 * Affiche le titre, l'entreprise, la localisation, les badges (nouveau, source, contrat),
 * une description tronquee, la date relative et les boutons bookmark / detail
 *
 * Props :
 *   - offer : objet Offer complet depuis Prisma
 *   - onToggleBookmark : callback pour basculer le favori (recoit l'id)
 *   - isTogglingBookmark : true pendant la mutation bookmark (desactive le bouton)
 *
 * Exemple :
 *   <OfferCard
 *     offer={offer}
 *     onToggleBookmark={(id) => bookmarkMutation.mutate(id)}
 *     isTogglingBookmark={false}
 *   />
 */

interface OfferCardProps {
  offer: Offer;
  onToggleBookmark: (id: string) => void;
  isTogglingBookmark: boolean;
}

/**
 * Calcule une date relative en francais sans dependance externe
 * Exemples : "Aujourd'hui", "Hier", "Il y a 3 jours"
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
}

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

export function OfferCard({
  offer,
  onToggleBookmark,
  isTogglingBookmark,
}: OfferCardProps) {
  return (
    <Card
      className={`flex flex-col transition-shadow hover:shadow-md ${
        offer.isNew ? "ring-2 ring-primary/30" : ""
      }`}
    >
      <CardHeader className="pb-3">
        {/* Titre de l'offre */}
        <CardTitle className="line-clamp-2 text-base leading-tight">
          {offer.title}
        </CardTitle>

        {/* Entreprise et localisation */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {offer.company}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {offer.location}
          </span>
        </div>

        {/* Badges : nouveau, origine, source, type de contrat */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {offer.isNew && (
            <Badge variant="default" className="text-xs">
              Nouveau
            </Badge>
          )}

          {/* Badge origine : bleu pour planifiee (Inngest), violet pour sandbox (manuel) */}
          {offer.origin === "scheduled" ? (
            <Badge
              variant="outline"
              className="gap-1 text-xs text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950"
            >
              <CalendarClock className="h-3 w-3" />
              Planifiée
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 text-xs text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:bg-violet-950"
            >
              <MousePointerClick className="h-3 w-3" />
              Sandbox
            </Badge>
          )}

          <Badge variant="secondary" className="text-xs">
            {formatSource(offer.source)}
          </Badge>
          {offer.contractType && (
            <Badge variant="outline" className="text-xs">
              {offer.contractType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        {/* Salaire si present */}
        {offer.salary && (
          <p className="text-sm font-medium text-primary">{offer.salary}</p>
        )}

        {/* Description tronquee a 3 lignes */}
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {offer.description}
        </p>

        {/* Date relative et actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(offer.createdAt)}
          </span>

          <div className="flex items-center gap-2">
            {/* Bouton bookmark */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleBookmark(offer.id)}
              disabled={isTogglingBookmark}
              aria-label={
                offer.isBookmarked
                  ? "Retirer des favoris"
                  : "Ajouter aux favoris"
              }
            >
              <Bookmark
                className={`h-4 w-4 ${
                  offer.isBookmarked
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Button>

            {/* Lien vers le detail */}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/offers/${offer.id}`}>Voir</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
