"use client";

/**
 * Role : Page detail d'une candidature (/applications/[id])
 * Affiche :
 *   - Informations de l'offre liee (titre, entreprise, lien)
 *   - Statut actuel avec possibilite de le modifier
 *   - Notes libres (textarea)
 *   - CV adapte et lettre de motivation dans des onglets (format markdown pre-wrap)
 *   - Export PDF dans les onglets : choix de template + bouton génération
 *
 * Architecture :
 *   - ApplicationDetailPage : charge les donnees, affiche skeleton ou erreur
 *   - ApplicationDetailContent : rendu du contenu (monte uniquement quand l'application est chargee,
 *     ce qui permet d'initialiser l'etat local directement depuis les props sans useEffect)
 *   - PdfExportPanel : panneau réutilisable (sélecteur template + bouton export + lien PDF existant)
 *
 * Hooks :
 *   - useFindUniqueApplication : charge la candidature avec l'offre liee
 *   - useUpdateApplication : sauvegarde statut + notes
 *   - useMutation (TanStack Query) : appel POST /api/application/[id]/export-pdf
 *
 * Parametres de route :
 *   - id : identifiant unique de la candidature (cuid)
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, Loader2, Save } from "lucide-react";
import type { Application, Offer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFindUniqueApplication, useUpdateApplication } from "@/lib/hooks";
import {
  ApplicationStatusBadge,
  APPLICATION_STATUSES,
} from "@/components/applications/ApplicationStatusBadge";
import { ApplicationDetailSkeleton } from "@/components/applications/ApplicationDetailSkeleton";
import type { TemplateId } from "@/lib/pdf/types";

/** Candidature avec l'offre liee (include: { offer: true }) */
type ApplicationWithOffer = Application & { offer: Offer };

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : panneau export PDF (sélecteur template + bouton + lien)
// Réutilisé dans les onglets "CV adapté" et "Lettre de motivation"
// ─────────────────────────────────────────────────────────────────────────────

interface PdfExportPanelProps {
  /** Identifiant de la candidature (pour l'URL de l'API) */
  applicationId: string;
  /** Type du document à exporter */
  type: "cv" | "letter";
  /** Appelé après une génération réussie pour invalider la query */
  onSuccess: () => void;
}

/**
 * Panneau export PDF affiché en bas de chaque onglet (CV / Lettre).
 * Contient :
 *   - Un Select pour choisir le template visuel
 *   - Un bouton pour déclencher la génération via POST /api/application/[id]/export-pdf
 *   - Un lien "Voir le PDF" si un PDF a déjà été généré (existingPdfUrl)
 *
 * Gestion d'état :
 *   - templateId : useState local (état isolé à ce panneau)
 *   - isExporting : dérivé de mutation.isPending (pas de useState nécessaire)
 */
function PdfExportPanel({
  applicationId,
  type,
  onSuccess,
}: PdfExportPanelProps) {
  // État local : template sélectionné par l'utilisateur (isolé à ce panneau)
  const [templateId, setTemplateId] = useState<TemplateId>("modern");

  // Mutation TanStack Query : POST /api/application/[id]/export-pdf
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/application/${applicationId}/export-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, templateId }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        // Propager le message d'erreur de l'API pour l'afficher dans le toast
        throw new Error(json.error ?? "Erreur lors de la génération");
      }

      return json as { data: { url: string }; message: string };
    },
    onSuccess: (result) => {
      toast.success(result.message);
      // Ouvrir le PDF dans un nouvel onglet immédiatement après génération
      window.open(result.data.url, "_blank", "noopener,noreferrer");
      // Invalider la query de l'application pour rafraîchir le lien "Voir le PDF"
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sélecteur de template visuel */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`template-${type}`} className="text-sm text-muted-foreground">
          Template :
        </Label>
        <Select
          value={templateId}
          onValueChange={(v) => setTemplateId(v as TemplateId)}
          disabled={mutation.isPending}
        >
          <SelectTrigger id={`template-${type}`} className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modern">Moderne</SelectItem>
            <SelectItem value="classic">Classique</SelectItem>
            <SelectItem value="minimalist">Minimaliste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bouton de génération */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {mutation.isPending ? "Génération..." : "Exporter en PDF"}
      </Button>

    </div>
  );
}

/**
 * Formate une date en francais avec heure
 * Exemple : "18/02/2026 a 14h30"
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : formulaire de modification (statut + notes)
// Monte uniquement quand la candidature est chargee, ce qui permet d'initialiser
// l'etat local depuis les props sans useEffect (pattern React recommande).
// ─────────────────────────────────────────────────────────────────────────────

interface ApplicationDetailContentProps {
  /** Candidature chargee depuis la BDD avec son offre liee */
  application: ApplicationWithOffer;
}

function ApplicationDetailContent({ application }: ApplicationDetailContentProps) {
  const queryClient = useQueryClient();

  // Etat local initialise depuis les props a la premiere montee du composant
  // Pas de useEffect necessaire : le composant est monte une fois avec les donnees finales
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");

  // Mutation : sauvegarde du statut et des notes
  // queryKey ZenStack = ["zenstack", "Application", ...] — le préfixe ["zenstack", "Application"]
  // invalide toutes les queries du modèle Application (findMany, findUnique, count…)
  const updateMutation = useUpdateApplication({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zenstack", "Application"] });
      toast.success("Candidature mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour");
    },
  });

  /**
   * Enregistre les modifications de statut et notes
   */
  const handleSave = () => {
    updateMutation.mutate({
      where: { id: application.id },
      data: {
        status,
        notes: notes.trim() || null,
      },
    });
  };

  // Detecter si des modifications ont ete faites (pour activer le bouton Enregistrer)
  const hasChanges =
    status !== application.status || notes !== (application.notes ?? "");

  return (
    <div className="space-y-6">
      {/* Ligne du haut : infos de l'offre (gauche) + suivi candidature (droite) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card en-tete : informations de l'offre liee */}
        <Card>
          <CardHeader>
            {/* Titre + badge statut */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-xl">{application.offer.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {application.offer.company} — {application.offer.location}
                </p>
              </div>
              <ApplicationStatusBadge status={application.status} />
            </div>

            {/* Metadonnees : date + lien vers l'offre originale */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
              <span>Generee le {formatDate(application.createdAt)}</span>
              {application.offer.url && (
                <a
                  href={application.offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Voir l&apos;offre
                </a>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Card suivi : modification du statut et des notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi de la candidature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select de statut */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <ApplicationStatusBadge status={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Textarea de notes libres */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes (coordonnees du recruteur, date d'entretien...)"
                rows={3}
              />
            </div>

            {/* Bouton enregistrer : actif uniquement si modifications en cours */}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Onglets : CV adapte | Lettre de motivation */}
      <Tabs defaultValue="cv">
        <TabsList>
          <TabsTrigger value="cv">CV adapté</TabsTrigger>
          <TabsTrigger value="letter">Lettre de motivation</TabsTrigger>
        </TabsList>

        {/* Onglet CV : panneau export en haut + contenu markdown en dessous */}
        <TabsContent value="cv">
          <Card>
            {/* En-tête avec le panneau export PDF (visible immédiatement, sans scroll) */}
            <CardHeader className="pb-3">
              <PdfExportPanel
                applicationId={application.id}
                type="cv"
                onSuccess={() =>
                  queryClient.invalidateQueries({ queryKey: ["zenstack", "Application"] })
                }
              />
            </CardHeader>
            {/* Contenu markdown du CV adapté par l'IA */}
            <CardContent className="border-t pt-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {application.cvContent}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Lettre : panneau export en haut + contenu markdown en dessous */}
        <TabsContent value="letter">
          <Card>
            {/* En-tête avec le panneau export PDF (visible immédiatement, sans scroll) */}
            <CardHeader className="pb-3">
              <PdfExportPanel
                applicationId={application.id}
                type="letter"
                onSuccess={() =>
                  queryClient.invalidateQueries({ queryKey: ["zenstack", "Application"] })
                }
              />
            </CardHeader>
            {/* Contenu markdown de la lettre de motivation adaptée par l'IA */}
            <CardContent className="border-t pt-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {application.letterContent}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal : charge les donnees, orchestre l'affichage
// ─────────────────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Query : candidature avec l'offre liee (include: { offer: true })
  const { data: application, isLoading } = useFindUniqueApplication({
    where: { id },
    include: { offer: true },
  });

  // Skeleton pendant le chargement
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux candidatures
          </Link>
        </Button>
        <ApplicationDetailSkeleton />
      </div>
    );
  }

  // Candidature introuvable
  if (!application) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux candidatures
          </Link>
        </Button>
        <p className="text-muted-foreground">Candidature introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bouton retour vers la liste */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux candidatures
        </Link>
      </Button>

      {/*
       * ApplicationDetailContent est monte uniquement quand application est disponible.
       * Cela permet d'initialiser l'etat local (status, notes) depuis les props
       * au moment du mount, sans useEffect, conformement aux regles React.
       */}
      <ApplicationDetailContent
        application={application as ApplicationWithOffer}
      />
    </div>
  );
}
