"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Search, TrendingUp } from "lucide-react";
import { useCountOffer, useCountApplication, useCountSearchConfig } from "@/lib/hooks";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

/**
 * Role : Page principale du dashboard avec statistiques réelles et actions rapides
 * Utilise par : route /dashboard
 * Affiche : nombre d'offres nouvelles, candidatures, recherches actives, taux de réponse
 * Data : Tanstack Query via hooks ZenStack (useCountOffer, useCountApplication, useCountSearchConfig)
 */
export default function DashboardPage() {
  // Comptage des nouvelles offres (isNew = true)
  const { data: newOffersCount, isLoading: isLoadingOffers } = useCountOffer({
    where: { isNew: true },
  });

  // Comptage de toutes les candidatures
  const { data: applicationsCount, isLoading: isLoadingApplications } = useCountApplication();

  // Comptage des recherches actives
  const { data: activeSearchesCount, isLoading: isLoadingSearches } = useCountSearchConfig({
    where: { isActive: true },
  });

  // Afficher le skeleton tant qu'au moins une requête est en cours
  const isLoading = isLoadingOffers || isLoadingApplications || isLoadingSearches;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Construction des stats avec les données réelles
  const STATS = [
    {
      label: "Nouvelles offres",
      value: String(newOffersCount ?? 0),
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      label: "Candidatures",
      value: String(applicationsCount ?? 0),
      icon: FileText,
      color: "text-green-600",
    },
    {
      label: "Recherches actives",
      value: String(activeSearchesCount ?? 0),
      icon: Search,
      color: "text-purple-600",
    },
    {
      label: "Taux de réponse",
      // Calcul futur Phase 8 : candidatures répondues / total candidatures
      value: applicationsCount ? "0%" : "—",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Titre de la page */}
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de votre recherche d&apos;emploi
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section offres récentes (placeholder Phase 7) */}
      <Card>
        <CardHeader>
          <CardTitle>Offres récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {(newOffersCount ?? 0) > 0
              ? `${newOffersCount} nouvelle${(newOffersCount ?? 0) > 1 ? "s" : ""} offre${(newOffersCount ?? 0) > 1 ? "s" : ""} disponible${(newOffersCount ?? 0) > 1 ? "s" : ""}. Consultez la page Offres.`
              : "Aucune offre pour le moment. Configurez vos critères de recherche pour commencer."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
