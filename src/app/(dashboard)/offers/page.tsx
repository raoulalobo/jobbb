import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Role : Affiche la page des offres d'emploi
 * Utilise par : route /offers
 */
export default function OffersPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold">Offres d'emploi</h1>
        <p className="text-muted-foreground">Consultez les offres d'emploi disponibles</p>
      </div>

      {/* Carte placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des offres</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La liste des offres sera implémentée en Phase 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
