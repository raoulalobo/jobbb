import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Role : Affiche la page des paramètres utilisateur
 * Utilise par : route /settings
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configurez vos préférences et paramètres du compte</p>
      </div>

      {/* Carte placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des paramètres</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les paramètres seront implémentés en Phase 9
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
