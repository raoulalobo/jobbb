/**
 * Role : Configuration du site LinkedIn pour le scraping authentifie
 * Utilise par : orchestrator.ts pour le flow de login et la recherche d'offres
 *
 * Contient :
 * - loginSelectors : selecteurs CSS pour la page de connexion LinkedIn
 * - selectors : selecteurs CSS pour les resultats de recherche authentifies
 * - searchUrlTemplate : template d'URL de recherche avec placeholders {query} et {location}
 *
 * Exemple :
 *   const url = LINKEDIN_CONFIG.searchUrlTemplate
 *     .replace("{query}", encodeURIComponent("React"))
 *     .replace("{location}", encodeURIComponent("Paris"));
 *   // url = "https://www.linkedin.com/jobs/search/?keywords=React&location=Paris"
 */

/** Interface de configuration du site LinkedIn */
export interface SiteConfig {
  /** Identifiant du site */
  id: string;
  /** Nom lisible du site */
  name: string;
  /** URL de base de la page de recherche */
  baseUrl: string;
  /** URL de la page de connexion */
  loginUrl: string;
  /** Template d'URL de recherche avec placeholders {query} et {location} */
  searchUrlTemplate: string;
  /** Description du site pour guider Claude dans le scraping */
  description: string;
  /** Selecteurs CSS pour la page de connexion LinkedIn */
  loginSelectors: {
    /** Champ email/telephone sur la page de login */
    emailInput: string;
    /** Champ mot de passe sur la page de login */
    passwordInput: string;
    /** Bouton de connexion */
    submitButton: string;
  };
  /** Selecteurs CSS pour les resultats de recherche (version authentifiee) */
  selectors: {
    /** Liste des offres dans les resultats de recherche */
    jobList?: string;
    /** Lien vers une offre individuelle */
    jobLink?: string;
    /** Titre d'une offre */
    jobTitle?: string;
    /** Nom de l'entreprise */
    company?: string;
    /** Localisation de l'offre */
    location?: string;
  };
  /** Instructions specifiques pour Claude lors de l'extraction des offres */
  scrapingTips: string;
}

/**
 * Configuration complete de LinkedIn pour le scraping authentifie.
 *
 * Flow prevu :
 *   1. Naviguer vers loginUrl
 *   2. Remplir emailInput + passwordInput
 *   3. Cliquer submitButton
 *   4. Verifier la redirection (feed = OK, checkpoint = 2FA, login = echec)
 *   5. Naviguer vers searchUrlTemplate avec les parametres de recherche
 *   6. Extraire les offres via snapshot + appel Claude
 */
export const LINKEDIN_CONFIG: SiteConfig = {
  id: "linkedin",
  name: "LinkedIn Jobs",
  baseUrl: "https://www.linkedin.com",
  loginUrl: "https://www.linkedin.com/login",
  searchUrlTemplate:
    "https://www.linkedin.com/jobs/search/?keywords={query}&location={location}",
  description:
    "Reseau professionnel avec section emploi. Scraping authentifie pour acceder aux offres completes.",
  loginSelectors: {
    /** Champ email : input#username sur la page /login */
    emailInput: "#username",
    /** Champ mot de passe : input#password sur la page /login */
    passwordInput: "#password",
    /** Bouton de connexion : bouton submit du formulaire de login */
    submitButton: 'button[type="submit"]',
  },
  selectors: {
    /** Liste des offres (version authentifiee, scaffold layout) */
    jobList: ".scaffold-layout__list-container, .jobs-search-results-list",
    /** Lien vers une offre (version authentifiee) */
    jobLink: "a.job-card-list__title--link, a.job-card-container__link",
    /** Titre de l'offre */
    jobTitle: ".job-card-list__title, .artdeco-entity-lockup__title",
    /** Nom de l'entreprise */
    company: ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle",
    /** Localisation */
    location: ".job-card-container__metadata-item, .artdeco-entity-lockup__caption",
  },
  scrapingTips: `
    - Le scraping se fait en mode authentifie (login prealable)
    - Apres login, naviguer vers /jobs/search/?keywords=...&location=...
    - Les resultats authentifies utilisent le layout "scaffold" avec des cartes job-card
    - Chaque carte contient : titre, entreprise, localisation, type de contrat
    - Scroller pour charger plus de resultats (lazy loading)
    - Se limiter a 15 offres maximum
    - Si CAPTCHA ou verification en 2 etapes : abandonner avec message explicite
  `,
};

/**
 * Map des configurations de sites (conserve pour compatibilite avec l'orchestrateur).
 * Contient uniquement LinkedIn.
 */
export const SITE_CONFIGS: Record<string, SiteConfig> = {
  linkedin: LINKEDIN_CONFIG,
};

/**
 * Role : Obtenir la configuration d'un site par son identifiant
 * Parametre siteId : identifiant du site (ex: "linkedin")
 * Retourne : la configuration du site ou undefined si non supporte
 *
 * Exemple :
 *   const config = getSiteConfig("linkedin");
 *   // config.name = "LinkedIn Jobs"
 */
export function getSiteConfig(siteId: string): SiteConfig | undefined {
  return SITE_CONFIGS[siteId];
}

/**
 * Role : Construire l'URL de recherche LinkedIn avec les parametres donnes
 * Parametre siteId : identifiant du site (doit etre "linkedin")
 * Parametre query : termes de recherche (ex: "developpeur React")
 * Parametre location : localisation (ex: "Paris")
 * Retourne : URL complete de recherche LinkedIn
 *
 * Exemple :
 *   const url = buildSearchUrl("linkedin", "React", "Paris");
 *   // url = "https://www.linkedin.com/jobs/search/?keywords=React&location=Paris"
 */
export function buildSearchUrl(
  siteId: string,
  query: string,
  location: string
): string {
  const config = SITE_CONFIGS[siteId];
  if (!config) {
    throw new Error(`Site "${siteId}" non supporte`);
  }

  return config.searchUrlTemplate
    .replace("{query}", encodeURIComponent(query))
    .replace("{location}", encodeURIComponent(location));
}

/**
 * Role : Obtenir la liste des identifiants de tous les sites supportes
 * Retourne : tableau contenant uniquement ["linkedin"]
 */
export function getSupportedSites(): string[] {
  return Object.keys(SITE_CONFIGS);
}
