"use client";

/**
 * Role : Page liste des candidatures (/applications)
 * Affiche toutes les candidatures de l'utilisateur connecte dans un tableau
 * avec filtrage par statut et tri par colonne (Tanstack Table).
 *
 * Comportement :
 *   - Pendant le chargement → skeleton du tableau (ApplicationsTableSkeleton)
 *   - Aucune candidature → etat vide avec lien vers les offres
 *   - Donnees chargees → ApplicationsTable avec filtres et tri
 *
 * Hooks :
 *   - useFindManyApplication : recupere les candidatures + offres liees
 *   - useCountApplication : compteur total pour l'en-tete
 */

import Link from "next/link";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFindManyApplication, useCountApplication } from "@/lib/hooks";
import { ApplicationsTable } from "@/components/applications/ApplicationsTable";
import { ApplicationsTableSkeleton } from "@/components/applications/ApplicationsTableSkeleton";

export default function ApplicationsPage() {
  // Query : compteur total de candidatures pour l'en-tete
  const { data: totalCount } = useCountApplication();

  // Query : liste des candidatures avec l'offre liee (include offer)
  const { data: applications, isLoading } = useFindManyApplication({
    include: { offer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* En-tete de la page avec compteur */}
      <div>
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <p className="text-muted-foreground">
          {typeof totalCount === "number"
            ? `${totalCount} candidature${totalCount > 1 ? "s" : ""}`
            : "Chargement..."}
        </p>
      </div>

      {/* Skeleton pendant le chargement initial */}
      {isLoading && <ApplicationsTableSkeleton />}

      {/* Tableau des candidatures */}
      {applications && applications.length > 0 && (
        <ApplicationsTable
          applications={
            applications as Parameters<
              typeof ApplicationsTable
            >[0]["applications"]
          }
        />
      )}

      {/* Etat vide : aucune candidature generee */}
      {applications && applications.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(191,171,204,0.6)] py-16">
          <FilePlus className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Aucune candidature</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez une offre et cliquez sur &quot;Postuler avec l&apos;IA&quot; pour
            generer votre premiere candidature.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/offers">Voir les offres</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
