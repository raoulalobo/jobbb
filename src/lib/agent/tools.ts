/**
 * Role : Interface et type pour les offres d'emploi scrapees
 * Utilise par : orchestrator.ts et la route API agent/search
 */

/** Interface pour une offre d'emploi scrapee */
export interface ScrapedOffer {
  /** Titre du poste (ex: "Developpeur React Senior") */
  title: string;
  /** Nom de l'entreprise (ex: "Doctolib") */
  company: string;
  /** Localisation (ex: "Paris, France") */
  location: string;
  /** URL de l'offre sur le site source */
  url: string;
  /** Description complete du poste */
  description: string;
  /** Fourchette de salaire si disponible */
  salary: string | null;
  /** Type de contrat (CDI, CDD, freelance, etc.) */
  contractType: string | null;
  /** Site source de l'offre */
  source: string;
}
