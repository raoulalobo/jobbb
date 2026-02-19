/**
 * Role : Types partagés pour la génération de PDF
 * Utilisé par les templates react-pdf et la route API export-pdf
 */

/**
 * Identifiants des templates disponibles.
 * - "modern"     : header coloré bleu, 2 colonnes visuelles
 * - "classic"    : 1 colonne, Helvetica, style professionnel traditionnel
 * - "minimalist" : beaucoup d'espace blanc, accents très légers
 */
export type TemplateId = "modern" | "classic" | "minimalist";

/**
 * Données normalisées passées aux templates react-pdf.
 * Construit dans la route API depuis l'Application + l'Offer en BDD.
 *
 * Exemple :
 *   {
 *     content: "## Jean Dupont\n\n**Développeur Full-Stack**\n\n- React\n- Node.js",
 *     type: "cv",
 *     candidateName: "Jean Dupont",
 *     offerTitle: "Développeur React Senior",
 *     offerCompany: "Acme Corp",
 *   }
 */
export interface CvPdfData {
  /** Contenu markdown brut (cvContent ou letterContent depuis la BDD) */
  content: string;
  /** Type du document : CV adapté ou lettre de motivation */
  type: "cv" | "letter";
  /** Nom complet du candidat (depuis session ou profil) */
  candidateName: string;
  /** Titre de l'offre ciblée */
  offerTitle: string;
  /** Nom de l'entreprise cible */
  offerCompany: string;
}
