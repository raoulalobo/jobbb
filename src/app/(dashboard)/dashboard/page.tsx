"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Search, TrendingUp } from "lucide-react";

/**
 * Role : Page principale du dashboard avec statistiques et actions rapides
 * Utilise par : route /dashboard
 * Affiche : nombre d'offres, candidatures, recherches actives, taux de reponse
 */

// Donnees placeholder (seront remplacees par des donnees reelles en Phase 5+)
const STATS = [
  { label: "Nouvelles offres", value: "0", icon: Briefcase, color: "text-blue-600" },
  { label: "Candidatures", value: "0", icon: FileText, color: "text-green-600" },
  { label: "Recherches actives", value: "0", icon: Search, color: "text-purple-600" },
  { label: "Taux de reponse", value: "0%", icon: TrendingUp, color: "text-orange-600" },
] as const;

export default function DashboardPage() {
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
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section offres recentes (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Offres recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune offre pour le moment. Configurez vos criteres de recherche pour commencer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Import cn pour les classes conditionnelles
import { cn } from "@/lib/utils";
