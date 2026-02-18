import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedOffer } from "./tools";
import { buildSearchUrl, LINKEDIN_CONFIG, SITE_CONFIGS } from "./site-configs";
import {
  launchBrowser,
  playwrightNavigate,
  playwrightSnapshot,
  playwrightClose,
  playwrightExtractLinks,
  playwrightScroll,
  playwrightGetUrl,
  playwrightFill,
  playwrightClick,
  playwrightWait,
} from "./playwright-tool";

/**
 * Role : Orchestrateur principal de l'agent de scraping LinkedIn authentifie
 * Utilise par : la route API POST /api/agent/search
 *
 * Architecture :
 *   - Playwright se connecte a LinkedIn avec les identifiants de l'utilisateur
 *   - Navigation deterministe (login → recherche → extraction)
 *   - UN SEUL appel Claude Sonnet pour structurer les offres du snapshot
 *
 * Flow complet :
 *   1. Lancer Playwright
 *   2. Naviguer vers linkedin.com/login
 *   3. Remplir email + mot de passe via playwrightFill()
 *   4. Cliquer le bouton de connexion via playwrightClick()
 *   5. Verifier le login (feed = OK, checkpoint = 2FA, login = echec)
 *   6. Si OK : naviguer vers /jobs/search?keywords=...&location=...
 *   7. Scroller pour charger les resultats (lazy loading)
 *   8. Capturer snapshot + extraire liens
 *   9. UN appel Claude Sonnet pour structurer les offres
 *   10. Fermer le navigateur
 *
 * Cout estime : ~0.03$ par recherche (1 seul appel Sonnet)
 *
 * Exemple :
 *   const offers = await runSearchAgent({
 *     query: "developpeur React",
 *     location: "Paris",
 *     sites: ["linkedin"],
 *     contractTypes: ["CDI"],
 *     remote: false,
 *     salaryMin: null,
 *     excludeKeywords: [],
 *     linkedinEmail: "user@example.com",
 *     linkedinPassword: "password123",
 *   }, "user-123");
 */

/** Interface des criteres de recherche incluant les identifiants LinkedIn */
export interface SearchCriteria {
  /** Termes de recherche (ex: "developpeur React") */
  query: string;
  /** Localisation (ex: "Paris") */
  location: string;
  /** Sites a scraper (toujours ["linkedin"]) */
  sites: string[];
  /** Types de contrat recherches (ex: ["CDI", "CDD"]) */
  contractTypes: string[];
  /** Recherche en teletravail uniquement */
  remote: boolean;
  /** Salaire minimum souhaite (en euros annuel) */
  salaryMin: number | null;
  /** Mots-cles a exclure des resultats */
  excludeKeywords: string[];
  /** Email de connexion LinkedIn (requis pour le scraping authentifie) */
  linkedinEmail: string;
  /** Mot de passe LinkedIn (requis pour le scraping authentifie) */
  linkedinPassword: string;
}

/**
 * Modele Claude a utiliser pour l'extraction des offres.
 * Sonnet offre un bon rapport qualite/prix pour l'extraction structuree.
 */
const EXTRACTION_MODEL = "claude-sonnet-4-5-20250929";

/** Nombre maximum d'offres a extraire (75 = 3 pages de 25 resultats LinkedIn) */
const MAX_OFFERS_PER_SITE = 75;

/** Nombre maximum de pages LinkedIn a scraper (pagination via &start=0,25,50) */
const MAX_PAGES = 3;

/** Nombre de resultats par page LinkedIn */
const LINKEDIN_RESULTS_PER_PAGE = 25;

/**
 * URLs indicatrices du resultat du login LinkedIn.
 * - /feed : login reussi, l'utilisateur est connecte
 * - /checkpoint : verification en 2 etapes (2FA) ou challenge de securite
 * - /login : echec du login (identifiants invalides ou autre erreur)
 */
const LOGIN_SUCCESS_INDICATORS = ["/feed", "/mynetwork", "/jobs"];
const LOGIN_CHALLENGE_INDICATORS = ["/checkpoint", "/challenge"];
const LOGIN_FAILURE_INDICATORS = ["/login", "/uas/login"];

/**
 * Role : Se connecter a LinkedIn via Playwright
 * Parametre sessionName : identifiant de la session Playwright
 * Parametre email : email de connexion LinkedIn
 * Parametre password : mot de passe LinkedIn
 * Retourne : { success: boolean, error?: string }
 *
 * Flow :
 *   1. goto("https://www.linkedin.com/login")
 *   2. fill("#username", email)
 *   3. fill("#password", password)
 *   4. click('button[type="submit"]')
 *   5. waitForTimeout(3000)
 *   6. getUrl() → verifier la redirection
 *
 * Exemple :
 *   const result = await loginToLinkedIn("session1", "user@mail.com", "pass123");
 *   if (result.success) { /* connecte * / }
 */
async function loginToLinkedIn(
  sessionName: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { loginSelectors, loginUrl } = LINKEDIN_CONFIG;

  try {
    // 1. Naviguer vers la page de connexion LinkedIn
    console.log("[Agent] Navigation vers la page de connexion LinkedIn...");
    await playwrightNavigate(sessionName, loginUrl);

    // 2. Remplir le champ email
    console.log("[Agent] Saisie de l'email LinkedIn...");
    await playwrightFill(sessionName, loginSelectors.emailInput, email);

    // 3. Remplir le champ mot de passe
    console.log("[Agent] Saisie du mot de passe LinkedIn...");
    await playwrightFill(sessionName, loginSelectors.passwordInput, password);

    // 4. Cliquer sur le bouton de connexion
    console.log("[Agent] Clic sur le bouton de connexion...");
    await playwrightClick(sessionName, loginSelectors.submitButton);

    // 5. Attendre la redirection apres soumission du formulaire
    await playwrightWait(sessionName, 3000);

    // 6. Verifier l'URL actuelle pour determiner le resultat du login
    const currentUrl = await playwrightGetUrl(sessionName);
    const urlPath = new URL(currentUrl).pathname.toLowerCase();
    console.log(`[Agent] URL apres login : ${currentUrl}`);

    // Verifier si le login a reussi (redirection vers /feed, /mynetwork ou /jobs)
    if (LOGIN_SUCCESS_INDICATORS.some((ind) => urlPath.startsWith(ind))) {
      console.log("[Agent] Login LinkedIn reussi !");
      return { success: true };
    }

    // Verifier si LinkedIn demande une verification 2FA ou challenge
    if (LOGIN_CHALLENGE_INDICATORS.some((ind) => urlPath.startsWith(ind))) {
      console.warn("[Agent] LinkedIn demande une verification en 2 etapes (2FA/CAPTCHA)");
      return {
        success: false,
        error: "LinkedIn demande une verification en 2 etapes. Connectez-vous manuellement a LinkedIn dans un navigateur pour valider votre appareil, puis relancez la recherche.",
      };
    }

    // Si on est encore sur /login, les identifiants sont probablement invalides
    if (LOGIN_FAILURE_INDICATORS.some((ind) => urlPath.startsWith(ind))) {
      console.warn("[Agent] Echec du login LinkedIn (identifiants invalides ?)");
      return {
        success: false,
        error: "Identifiants LinkedIn invalides. Verifiez votre email et mot de passe dans votre profil.",
      };
    }

    // URL inattendue : on considere quand meme comme un succes si on n'est plus sur /login
    console.log(`[Agent] URL post-login inattendue : ${urlPath}, tentative de continuer...`);
    return { success: true };
  } catch (error) {
    const err = error as Error;
    console.error("[Agent] Erreur lors du login LinkedIn :", err.message);
    return {
      success: false,
      error: `Erreur lors de la connexion a LinkedIn : ${err.message}`,
    };
  }
}

/**
 * Role : Scraper LinkedIn apres authentification avec pagination (jusqu'a MAX_PAGES pages)
 * Parametre criteria : criteres de recherche (query, location, identifiants LinkedIn)
 * Parametre sessionName : nom unique de la session Playwright
 * Retourne : snapshot textuel concatene + tous les liens extraits, ou null si erreur
 *
 * Flow :
 *   1. Lancer le navigateur
 *   2. Se connecter a LinkedIn (loginToLinkedIn)
 *   3. Pour chaque page (0 a MAX_PAGES-1) :
 *      a. Naviguer vers la page de resultats avec &start=page*25
 *      b. Verifier l'absence de blocage (captcha/checkpoint)
 *      c. Scroller pour charger les resultats (lazy loading)
 *      d. Capturer le snapshot + extraire les liens
 *      e. Si snapshot < 500 chars ou 0 nouveaux liens → arreter la pagination
 *   4. Fermer le navigateur
 *
 * Pagination LinkedIn :
 *   - Page 1 : &start=0 (ou sans parametre)
 *   - Page 2 : &start=25
 *   - Page 3 : &start=50
 *   Chaque page contient ~25 resultats, soit ~75 offres max pour 3 pages.
 */
async function scrapeSite(
  criteria: SearchCriteria,
  sessionName: string
): Promise<{ snapshot: string; links: { text: string; href: string }[] } | null> {
  try {
    console.log("[Agent] Scraping LinkedIn (mode authentifie, pagination activee)...");

    // 1. Lancer le navigateur
    await launchBrowser(sessionName);

    // 2. Se connecter a LinkedIn
    const loginResult = await loginToLinkedIn(
      sessionName,
      criteria.linkedinEmail,
      criteria.linkedinPassword
    );

    if (!loginResult.success) {
      console.error(`[Agent] Login LinkedIn echoue : ${loginResult.error}`);
      await playwrightClose(sessionName);
      throw new Error(loginResult.error || "Echec de la connexion LinkedIn");
    }

    // 3. Construire l'URL de base pour la recherche
    const baseSearchUrl = buildSearchUrl("linkedin", criteria.query, criteria.location);
    const jobLinkSelector = LINKEDIN_CONFIG.selectors.jobLink;
    const blockIndicators = ["captcha", "challenge", "/checkpoint", "verify"];

    // Accumulateurs pour les snapshots et liens de toutes les pages
    const allSnapshots: string[] = [];
    const allLinks: { text: string; href: string }[] = [];

    // 4. Boucle de pagination : scraper jusqu'a MAX_PAGES pages
    for (let page = 0; page < MAX_PAGES; page++) {
      // Construire l'URL paginee (ex: &start=0, &start=25, &start=50)
      const startOffset = page * LINKEDIN_RESULTS_PER_PAGE;
      const separator = baseSearchUrl.includes("?") ? "&" : "?";
      const pageUrl = `${baseSearchUrl}${separator}start=${startOffset}`;

      console.log(`[Agent] Page ${page + 1}/${MAX_PAGES} : navigation vers ${pageUrl}`);
      await playwrightNavigate(sessionName, pageUrl);

      // Verifier qu'on n'a pas ete redirige vers une page de blocage
      const currentUrl = await playwrightGetUrl(sessionName);
      const urlLower = currentUrl.toLowerCase();

      if (blockIndicators.some((ind) => urlLower.includes(ind))) {
        console.warn(`[Agent] LinkedIn bloque le scraping page ${page + 1} (URL: ${currentUrl})`);
        // Si c'est la premiere page, on echoue ; sinon on arrete la pagination
        if (page === 0) {
          await playwrightClose(sessionName);
          throw new Error("LinkedIn a bloque l'acces. Essayez de vous connecter manuellement d'abord.");
        }
        console.log("[Agent] Arret de la pagination suite au blocage");
        break;
      }

      // Scroller pour charger les resultats (lazy loading LinkedIn)
      await playwrightScroll(sessionName);

      // Capturer le snapshot d'accessibilite de cette page
      const pageSnapshot = await playwrightSnapshot(sessionName);
      console.log(`[Agent] Page ${page + 1}/${MAX_PAGES} : snapshot ${pageSnapshot.length} caracteres`);

      // Si le snapshot est trop court, la page est probablement vide → arreter
      if (pageSnapshot.length < 500) {
        console.log(`[Agent] Page ${page + 1}/${MAX_PAGES} : snapshot trop court, fin de la pagination`);
        break;
      }

      allSnapshots.push(pageSnapshot);

      // Extraire les liens d'offres de cette page
      let pageLinks: { text: string; href: string }[] = [];

      if (jobLinkSelector) {
        const selectors = jobLinkSelector.split(",").map((s) => s.trim());

        for (const selector of selectors) {
          try {
            const linksJson = await playwrightExtractLinks(sessionName, selector);
            const parsed = JSON.parse(linksJson) as { text: string; href: string }[];
            if (parsed.length > 0) {
              pageLinks = parsed;
              break;
            }
          } catch {
            // Selecteur ne fonctionne pas, essayer le suivant
          }
        }
      }

      console.log(`[Agent] Page ${page + 1}/${MAX_PAGES} : ${pageLinks.length} liens extraits`);

      // Si aucun nouveau lien sur cette page, la pagination est terminee
      if (pageLinks.length === 0 && page > 0) {
        console.log(`[Agent] Page ${page + 1}/${MAX_PAGES} : aucun nouveau lien, fin de la pagination`);
        break;
      }

      allLinks.push(...pageLinks);
    }

    // 5. Fermer le navigateur (une seule fois apres toutes les pages)
    await playwrightClose(sessionName);

    // Si aucun snapshot n'a ete capture, retourner null
    if (allSnapshots.length === 0) {
      console.warn("[Agent] Aucun snapshot exploitable capture sur aucune page");
      return null;
    }

    // Concatener tous les snapshots avec un separateur de page
    const combinedSnapshot = allSnapshots
      .map((s, i) => `--- Page ${i + 1}/${allSnapshots.length} ---\n${s}`)
      .join("\n\n");

    console.log(
      `[Agent] Scraping termine : ${allSnapshots.length} page(s), ` +
      `${combinedSnapshot.length} chars de snapshot, ${allLinks.length} liens au total`
    );

    return { snapshot: combinedSnapshot, links: allLinks };
  } catch (error) {
    const err = error as Error;
    console.error("[Agent] Erreur scraping LinkedIn :", err.message);

    // Toujours fermer le navigateur en cas d'erreur
    try {
      await playwrightClose(sessionName);
    } catch { /* ignore */ }

    // Propager l'erreur pour que la route API puisse la gerer
    throw error;
  }
}

/**
 * Role : Extraire les offres structurees a partir d'un snapshot via Claude Sonnet
 * Parametre client : client Anthropic
 * Parametre snapshot : snapshot textuel de la page de resultats LinkedIn
 * Parametre links : liens d'offres extraits par Playwright
 * Parametre criteria : criteres de recherche pour le filtrage
 * Retourne : tableau des offres structurees (ScrapedOffer[])
 *
 * UN SEUL appel a Claude Sonnet.
 * Le prompt est direct : "voici le snapshot, extrais les offres en JSON".
 *
 * Exemple :
 *   const offers = await extractOffersFromSnapshot(client, snapshot, links, criteria);
 *   // offers = [{ title: "Dev React", company: "Doctolib", ... }]
 */
async function extractOffersFromSnapshot(
  client: Anthropic,
  snapshot: string,
  links: { text: string; href: string }[],
  criteria: SearchCriteria
): Promise<ScrapedOffer[]> {
  const baseUrl = LINKEDIN_CONFIG.baseUrl;

  // Construire un contexte compact avec les liens et le snapshot
  const linksContext = links.length > 0
    ? `\nLiens d'offres extraits:\n${links.slice(0, MAX_OFFERS_PER_SITE).map((l, i) => `${i + 1}. "${l.text}" -> ${l.href}`).join("\n")}`
    : "";

  // Tronquer le snapshot a 30000 chars pour supporter jusqu'a 3 pages de resultats
  let truncatedSnapshot = snapshot;
  if (truncatedSnapshot.length > 30000) {
    truncatedSnapshot = truncatedSnapshot.substring(0, 30000) + "\n... (tronque)";
  }

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extrais les offres d'emploi de ce snapshot de page LinkedIn (resultats authentifies).
Retourne UNIQUEMENT un tableau JSON (pas de texte avant/apres).

Criteres: "${criteria.query}" a "${criteria.location}"
${criteria.excludeKeywords.length > 0 ? `Exclure les offres contenant: ${criteria.excludeKeywords.join(", ")}` : ""}
${linksContext}

Snapshot de la page:
${truncatedSnapshot}

Format JSON attendu (max ${MAX_OFFERS_PER_SITE} offres):
[{"title":"...","company":"...","location":"...","url":"...","description":"resume court 100-200 chars","salary":null,"contractType":null}]

Regles:
- url doit etre complete (prefixer avec "${baseUrl}" si relative)
- description = resume court du poste visible dans la liste (pas la page detail)
- salary et contractType = null si non visible
- Ignorer les offres sans titre ou sans lien`,
      },
    ],
  });

  // Extraire le JSON de la reponse
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    console.warn("[Agent] Pas de contenu textuel dans la reponse Claude");
    return [];
  }

  try {
    // Extraire le tableau JSON de la reponse (peut contenir du texte autour)
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[Agent] Pas de JSON valide dans la reponse Claude");
      return [];
    }

    const rawOffers = JSON.parse(jsonMatch[0]) as Array<Record<string, string | null>>;

    // Transformer en ScrapedOffer avec source "linkedin"
    return rawOffers
      .filter((o) => o.title && o.url)
      .slice(0, MAX_OFFERS_PER_SITE)
      .map((o) => ({
        title: o.title || "Sans titre",
        company: o.company || "Entreprise inconnue",
        location: o.location || criteria.location,
        url: o.url || "",
        description: o.description || "",
        salary: o.salary || null,
        contractType: o.contractType || null,
        source: "linkedin",
      }));
  } catch (error) {
    const err = error as Error;
    console.error("[Agent] Erreur parsing JSON des offres :", err.message);
    console.error("[Agent] Reponse brute :", textContent.text.substring(0, 300));
    return [];
  }
}

/**
 * Role : Executer l'agent de scraping LinkedIn authentifie
 * Parametre criteria : criteres de recherche incluant les identifiants LinkedIn
 * Parametre userId : identifiant de l'utilisateur (pour nommer la session)
 * Retourne : tableau des offres scrapees (ScrapedOffer[])
 *
 * Flow :
 *   1. Valider la cle API Anthropic
 *   2. Scraper LinkedIn (login + recherche + snapshot)
 *   3. Extraire les offres via Claude Sonnet
 *   4. Retourner les offres structurees
 *
 * Erreurs possibles :
 *   - ANTHROPIC_API_KEY manquante
 *   - Identifiants LinkedIn invalides
 *   - 2FA/CAPTCHA LinkedIn
 *   - Blocage par LinkedIn
 *
 * Exemple :
 *   const offers = await runSearchAgent(
 *     { query: "React", location: "Paris", linkedinEmail: "a@b.com", linkedinPassword: "pass", ... },
 *     "user-abc123"
 *   );
 */
export async function runSearchAgent(
  criteria: SearchCriteria,
  userId: string
): Promise<ScrapedOffer[]> {
  // Verifier que la cle API Anthropic est configuree
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-...") {
    throw new Error(
      "ANTHROPIC_API_KEY non configuree. Ajoutez votre cle dans .env.local"
    );
  }

  // Initialiser le client Anthropic
  const client = new Anthropic({ apiKey });

  console.log(
    `[Agent] Demarrage recherche LinkedIn "${criteria.query}" a "${criteria.location}"`
  );

  const sessionName = `search-${userId}-linkedin-${Date.now()}`;

  // 1. Scraper LinkedIn (login + navigation + snapshot)
  const result = await scrapeSite(criteria, sessionName);

  if (!result) {
    console.log("[Agent] Aucun resultat obtenu de LinkedIn");
    return [];
  }

  // 2. Extraire les offres via Claude Sonnet
  console.log("[Agent] Extraction des offres via Claude Sonnet...");
  const offers = await extractOffersFromSnapshot(
    client,
    result.snapshot,
    result.links,
    criteria
  );

  console.log(`[Agent] ${offers.length} offre(s) extraites de LinkedIn`);
  return offers;
}
