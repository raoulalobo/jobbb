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
  playwrightGetJobDescription,
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
 * Nombre maximum de pages detail a visiter pour enrichir les descriptions.
 * Limite a 15 pour equilibrer qualite et temps d'execution (~45s supplementaires).
 * Les 15 premieres offres sont les plus pertinentes (tri LinkedIn par date/pertinence).
 */
const MAX_DETAIL_PAGES = 15;


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

    // Note : le navigateur N'est PAS ferme ici.
    // Il reste ouvert pour que runSearchAgent puisse scraper les pages detail.
    // La fermeture est geree par runSearchAgent apres l'enrichissement des descriptions.

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
 * Role : Nettoyer une description d'offre LinkedIn en supprimant les elements parasites
 * Parametre raw : texte brut extrait de la page LinkedIn (inclut UI, metadata, promo)
 * Retourne : description nettoyee, limitee a 5000 chars pour eviter le bruit de fin de page
 *
 * Supprime les lignes correspondant a ces categories de bruit LinkedIn :
 *   - Metadonnees d'offre : "37 candidats", "Republication il y a 2h", "Promue par un recruteur"
 *   - Boutons UI : "Enregistrer", "Postuler", "Candidature simplifiee"
 *   - Infos de modalite : "Hybride", "Temps plein" (ligne seule sans contexte)
 *   - Promotion Premium : "Essayer Premium", "Decouvrez comment vous vous positionnez"
 *   - Contacts recruteur : "Personnes que vous pouvez contacter", "Rencontrez l'equipe"
 *   - Entetes de section LinkedIn : "A propos de l'offre d'emploi" (header sans valeur)
 *   - Bruit de fin : "X sur LinkedIn", "Aimerez-vous travailler ici"
 *
 * Exemple :
 *   cleanLinkedInDescription("37 candidats\nHybride\nNous recherchons un dev React...\n...")
 *   // => "Nous recherchons un dev React..."
 */
/**
 * Modele Claude utilise pour le nettoyage des descriptions d'offres.
 * Haiku : suffisamment capable pour de l'extraction/nettoyage de texte,
 * beaucoup moins cher que Sonnet (~$0.001 par offre vs ~$0.005).
 */
const CLEANUP_MODEL = "claude-haiku-4-5-20251001";

/**
 * Role : Nettoyer et formater le texte brut d'une page LinkedIn via Claude Haiku
 * Parametre client : client Anthropic initialise
 * Parametre rawText : texte brut extrait par Playwright (avec bruit UI, footer, etc.)
 * Parametre offerTitle : titre de l'offre (contexte pour Claude)
 * Retourne : description propre en markdown, ou chaine vide en cas d'erreur
 *
 * Claude Haiku identifie et conserve uniquement :
 *   - Le contexte de l'entreprise (bref)
 *   - Les missions du poste
 *   - La stack technique / competences requises
 *   - Le profil recherche
 * Et supprime : navigation LinkedIn, footer, UI, promotion Premium, contacts recruteur,
 *   selecteur de langue, mentions legales, emojis decoratifs.
 *
 * Cout estime : ~$0.001 par offre (Haiku est ~25x moins cher que Sonnet)
 *
 * Exemple :
 *   const clean = await formatOfferDescription(client, rawText, "Dev React Senior");
 *   // clean = "## Missions\n- Développer des features React...\n## Stack\n- React, TypeScript..."
 */
async function formatOfferDescription(
  client: Anthropic,
  rawText: string,
  offerTitle: string
): Promise<string> {
  // Tronquer le texte brut a 6000 chars pour eviter de depasser le contexte de Haiku
  const truncatedRaw =
    rawText.length > 6000
      ? rawText.substring(0, 6000) + "\n... (tronque)"
      : rawText;

  try {
    const response = await client.messages.create({
      model: CLEANUP_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant qui extrait et formate les descriptions d'offres d'emploi LinkedIn.

Voici le texte brut extrait d'une page LinkedIn pour le poste : "${offerTitle}"
Ce texte contient le contenu utile MELANGE avec du bruit : navigation LinkedIn, footer, boutons UI,
promotion Premium, contacts recruteur, selecteur de langue, mentions legales.

TEXTE BRUT :
${truncatedRaw}

TACHE : Extrais UNIQUEMENT le contenu pertinent de l'offre et formate-le en markdown propre.

Conserve :
- Contexte / presentation de l'entreprise (2-3 phrases max)
- Missions et responsabilites du poste
- Stack technique et competences requises
- Profil recherche et qualifications

Supprime tout le reste : navigation, footer, boutons, premium, recruteur, langue, legal, emojis decoratifs.

Reponds directement avec le markdown, sans introduction ni commentaire.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return "";

    return textBlock.text.trim();
  } catch (error) {
    const err = error as Error;
    console.warn(`[Agent] Erreur formatage Haiku : ${err.message}`);
    // En cas d'erreur Haiku, retourner le texte brut tronque (pas de perte de donnees)
    return rawText.substring(0, 3000).trim();
  }
}

/**
 * Role : Visiter les pages detail des offres pour recuperer la description complete
 * Parametre offers : offres extraites depuis la page de resultats (descriptions courtes)
 * Parametre sessionName : session Playwright encore ouverte (connectee a LinkedIn)
 * Retourne : Map { url -> description complete }
 *
 * Flow pour chaque offre (jusqu'a MAX_DETAIL_PAGES) :
 *   1. Naviguer vers l'URL de l'offre
 *   2. Tenter d'extraire la description via les selecteurs LinkedIn specifiques
 *   3. Fallback sur playwrightExtractContent (article/main/body) si selecteurs echouent
 *   4. Pause de 1.5s entre les requetes pour eviter le rate limiting LinkedIn
 *
 * En cas d'erreur sur une offre individuelle : log + continuer avec les suivantes.
 *
 * Exemple :
 *   const descriptions = await scrapeOfferDetails(offers, "session-xyz");
 *   // descriptions.get("https://linkedin.com/jobs/view/123") = "Nous recherchons..."
 */
async function scrapeOfferDetails(
  offers: ScrapedOffer[],
  sessionName: string,
  client: Anthropic
): Promise<Map<string, string>> {
  const descriptionMap = new Map<string, string>();

  // Limiter aux MAX_DETAIL_PAGES premieres offres (les plus pertinentes)
  const offersToVisit = offers.slice(0, MAX_DETAIL_PAGES);

  console.log(
    `[Agent] Enrichissement descriptions : visite de ${offersToVisit.length} pages detail...`
  );

  for (let i = 0; i < offersToVisit.length; i++) {
    const offer = offersToVisit[i];
    if (!offer.url) continue;

    try {
      console.log(
        `[Agent] Detail ${i + 1}/${offersToVisit.length} : "${offer.title}" chez "${offer.company}"`
      );

      // Naviguer vers la page detail de l'offre
      await playwrightNavigate(sessionName, offer.url);

      // Extraction via heuristiques (selecteurs semantiques + densite textuelle + fallback)
      // Resilient aux changements de noms de classes LinkedIn
      const description = await playwrightGetJobDescription(sessionName, 8000);

      if (description && description.length >= 100) {
        // Nettoyer et reformater via Claude Haiku (supprime bruit UI/footer, formate en markdown)
        console.log(
          `[Agent] Detail ${i + 1} : ${description.length} chars bruts → nettoyage Haiku...`
        );
        const cleanDescription = await formatOfferDescription(
          client,
          description,
          offer.title
        );

        if (cleanDescription.length >= 100) {
          descriptionMap.set(offer.url, cleanDescription);
          console.log(
            `[Agent] Detail ${i + 1} : ${description.length} → ${cleanDescription.length} chars apres nettoyage Haiku`
          );
        } else {
          // Fallback : garder le texte brut tronque si Haiku retourne trop peu
          descriptionMap.set(offer.url, description.substring(0, 3000));
          console.warn(
            `[Agent] Detail ${i + 1} : Haiku a retourne trop peu (${cleanDescription.length} chars), fallback sur texte brut`
          );
        }
      } else {
        console.warn(
          `[Agent] Detail ${i + 1} : description trop courte ou vide, conserve la description initiale`
        );
      }

      // Pause entre les requetes pour eviter le rate limiting LinkedIn (1.5s)
      if (i < offersToVisit.length - 1) {
        await playwrightWait(sessionName, 1500);
      }
    } catch (error) {
      const err = error as Error;
      console.warn(
        `[Agent] Detail ${i + 1} : erreur sur "${offer.title}" : ${err.message}`
      );
      // Continuer avec les offres suivantes meme en cas d'erreur
    }
  }

  console.log(
    `[Agent] Enrichissement termine : ${descriptionMap.size}/${offersToVisit.length} descriptions recuperees`
  );

  return descriptionMap;
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

  try {
    // 1. Scraper LinkedIn (login + navigation + snapshot)
    // Note : le navigateur reste ouvert apres scrapeSite pour le scraping des details
    const result = await scrapeSite(criteria, sessionName);

    if (!result) {
      console.log("[Agent] Aucun resultat obtenu de LinkedIn");
      await playwrightClose(sessionName);
      return [];
    }

    // 2. Extraire les offres structurees via Claude Sonnet (descriptions courtes)
    console.log("[Agent] Extraction des offres via Claude Sonnet...");
    const offers = await extractOffersFromSnapshot(
      client,
      result.snapshot,
      result.links,
      criteria
    );

    console.log(`[Agent] ${offers.length} offre(s) extraites de LinkedIn`);

    if (offers.length === 0) {
      await playwrightClose(sessionName);
      return [];
    }

    // 3. Enrichir les descriptions en visitant les pages detail individuelles
    // Le navigateur est encore ouvert et connecte a LinkedIn
    // Claude Haiku est utilise pour nettoyer et formater chaque description
    console.log("[Agent] Demarrage de l'enrichissement des descriptions...");
    const detailDescriptions = await scrapeOfferDetails(offers, sessionName, client);

    // 4. Fermer le navigateur apres le scraping des details
    await playwrightClose(sessionName);

    // 5. Remplacer les descriptions courtes par les descriptions completes
    const enrichedOffers = offers.map((offer) => ({
      ...offer,
      description: detailDescriptions.get(offer.url) || offer.description,
    }));

    const enrichedCount = enrichedOffers.filter(
      (o) => detailDescriptions.has(o.url)
    ).length;

    console.log(
      `[Agent] ${enrichedCount}/${offers.length} offres enrichies avec description complete`
    );

    return enrichedOffers;
  } catch (error) {
    // Garantir la fermeture du navigateur en cas d'erreur non geree
    try {
      await playwrightClose(sessionName);
    } catch { /* ignore */ }
    throw error;
  }
}
