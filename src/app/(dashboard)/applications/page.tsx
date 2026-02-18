import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Role : Affiche la page de suivi des candidatures
 * Utilise par : route /applications
 */
export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        <p className="text-muted-foreground">Suivez l'état de vos candidatures</p>
      </div>

      {/* Carte placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des candidatures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le suivi des candidatures sera implémenté en Phase 8
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
