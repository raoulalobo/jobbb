"use client";

/**
 * Role : Page detail d'une candidature (/applications/[id])
 * Affiche :
 *   - Informations de l'offre liee (titre, entreprise, lien)
 *   - Statut actuel avec possibilite de le modifier
 *   - Notes libres (textarea)
 *   - CV adapte et lettre de motivation dans des onglets (format markdown pre-wrap)
 *
 * Architecture :
 *   - ApplicationDetailPage : charge les donnees, affiche skeleton ou erreur
 *   - ApplicationDetailContent : rendu du contenu (monte uniquement quand l'application est chargee,
 *     ce qui permet d'initialiser l'etat local directement depuis les props sans useEffect)
 *
 * Hooks :
 *   - useFindUniqueApplication : charge la candidature avec l'offre liee
 *   - useUpdateApplication : sauvegarde statut + notes
 *
 * Parametres de route :
 *   - id : identifiant unique de la candidature (cuid)
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
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

/** Candidature avec l'offre liee (include: { offer: true }) */
type ApplicationWithOffer = Application & { offer: Offer };

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
  const updateMutation = useUpdateApplication({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Application"] });
      toast.success("Candidature mise a jour");
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

      {/* Onglets : CV adapte | Lettre de motivation */}
      <Tabs defaultValue="cv">
        <TabsList>
          <TabsTrigger value="cv">CV adapte</TabsTrigger>
          <TabsTrigger value="letter">Lettre de motivation</TabsTrigger>
        </TabsList>

        {/* Onglet CV : contenu markdown affiche en pre-wrap */}
        <TabsContent value="cv">
          <Card>
            <CardContent className="pt-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {application.cvContent}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Lettre de motivation : contenu markdown affiche en pre-wrap */}
        <TabsContent value="letter">
          <Card>
            <CardContent className="pt-6">
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
