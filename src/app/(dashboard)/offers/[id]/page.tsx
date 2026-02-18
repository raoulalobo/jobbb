import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Role : Affiche le détail d'une offre d'emploi
 * Utilise par : route /offers/[id]
 * Paramètres : id (identifiant de l'offre)
 */
export default function OfferDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold">Détail de l'offre</h1>
        <p className="text-muted-foreground">Consultez les détails complets de cette offre d'emploi</p>
      </div>

      {/* Carte placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Offre #{params.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le détail de l'offre sera implémenté en Phase 5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
