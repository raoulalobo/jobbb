/**
 * Role : Badge visuel representant le statut d'une candidature
 * Chaque statut a une couleur distinctive pour faciliter la lecture rapide
 *
 * Statuts possibles (cycle de vie d'une candidature) :
 *   draft      → Brouillon   (gris)    — genere par l'IA, pas encore envoye
 *   ready      → Pret        (bleu)    — relecture faite, pret a envoyer
 *   sent       → Envoye      (orange)  — candidature transmise a l'employeur
 *   interview  → Entretien   (violet)  — entretien obtenu
 *   rejected   → Refuse      (rouge)   — candidature rejetee
 *   accepted   → Accepte     (vert)    — offre d'emploi obtenue
 */

import { Badge } from "@/components/ui/badge";

/** Statuts valides pour une candidature */
export type ApplicationStatus =
  | "draft"
  | "ready"
  | "sent"
  | "interview"
  | "rejected"
  | "accepted";

/** Configuration d'affichage par statut : label francais + classes Tailwind */
const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  ready: {
    label: "Pret",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  sent: {
    label: "Envoye",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  interview: {
    label: "Entretien",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  rejected: {
    label: "Refuse",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  accepted: {
    label: "Accepte",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

interface ApplicationStatusBadgeProps {
  /** Statut brut de la BDD (ex: "draft", "sent") */
  status: string;
}

/**
 * Affiche un badge colore en fonction du statut de candidature.
 * Si le statut est inconnu, affiche le statut brut en gris.
 *
 * Exemple d'usage :
 *   <ApplicationStatusBadge status="sent" />
 *   → Badge orange avec le label "Envoye"
 */
export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const config = STATUS_CONFIG[status as ApplicationStatus] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

/**
 * Liste ordonnee des statuts pour les selects et filtres
 * Suit le cycle de vie naturel d'une candidature
 */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "draft",
  "ready",
  "sent",
  "interview",
  "rejected",
  "accepted",
];
