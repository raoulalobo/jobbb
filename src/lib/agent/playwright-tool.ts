import { type Browser, type BrowserContext, type Page, chromium } from "playwright";

/**
 * Role : Wrapper autour de Playwright pour automatiser le navigateur
 * Utilise par : les tools de l'agent dans tools.ts
 *
 * Strategie : utilisation DIRECTE de l'API Playwright dans le meme processus Node.js.
 * Pas de child_process, pas de scripts temporaires, pas de WebSocket.
 * Le navigateur, le context et la page sont stockes en memoire.
 *
 * Avantages par rapport a l'approche child_process :
 * - Plus rapide (pas de spawn/connect a chaque action)
 * - Plus fiable (pas de problemes d'echappement, de timeout shell, de NODE_PATH)
 * - Plus simple a debugger
 *
 * Exemple :
 *   await launchBrowser("session1");
 *   const title = await playwrightNavigate("session1", "https://www.wttj.com/fr/jobs");
 *   const snapshot = await playwrightSnapshot("session1");
 *   await playwrightClose("session1");
 */

// User-Agent realiste pour eviter la detection de bot par les sites d'emploi
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Structure d'une session Playwright en memoire */
interface PlaywrightSession {
  /** Instance du navigateur Chromium */
  browser: Browser;
  /** Context avec user-agent et locale configures */
  context: BrowserContext;
  /** Page active (onglet) utilisee pour le scraping */
  page: Page;
  /** Timestamp de creation de la session */
  startedAt: number;
}

/**
 * Stockage en memoire des sessions Playwright actives
 * Cle : nom de session (ex: "search-userId-timestamp")
 * Valeur : objets browser, context, page
 */
const sessions = new Map<string, PlaywrightSession>();

/**
 * Role : Lancer un navigateur Playwright et creer une session
 * Parametre sessionName : identifiant unique de la session
 * Retourne : message de confirmation
 *
 * Lance Chromium en mode headless avec un user-agent realiste,
 * un viewport 1920x1080 et la locale fr-FR.
 * Le navigateur desactive la detection d'automatisation.
 *
 * Exemple :
 *   await launchBrowser("search-wttj");
 */
export async function launchBrowser(sessionName: string): Promise<string> {
  // Fermer la session existante si elle existe (eviter les fuites de memoire)
  if (sessions.has(sessionName)) {
    await playwrightClose(sessionName);
  }

  // Lancer Chromium en mode headless
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // Creer un context avec un user-agent realiste pour eviter la detection de bot
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1920, height: 1080 },
    locale: "fr-FR",
  });

  // Creer une page (onglet)
  const page = await context.newPage();

  // Stocker la session
  sessions.set(sessionName, {
    browser,
    context,
    page,
    startedAt: Date.now(),
  });

  return `Navigateur lance pour la session "${sessionName}"`;
}

/**
 * Role : Recuperer la page active d'une session
 * Parametre sessionName : identifiant de la session
 * Retourne : la page Playwright de la session
 * Leve une erreur si la session n'existe pas
 */
function getPage(sessionName: string): Page {
  const session = sessions.get(sessionName);
  if (!session) {
    throw new Error(
      `Session "${sessionName}" introuvable. Lancez d'abord launchBrowser().`
    );
  }
  return session.page;
}

/**
 * Role : Naviguer vers une URL dans la session Playwright
 * Parametre sessionName : identifiant de la session
 * Parametre url : URL cible
 * Retourne : JSON avec succes, titre de la page et URL finale
 *
 * Attend le chargement du DOM (domcontentloaded) avec un timeout de 45s,
 * puis attend 3s supplementaires pour le JS dynamique.
 *
 * Exemple :
 *   const result = await playwrightNavigate("session1", "https://www.wttj.com/fr/jobs");
 *   // result = '{"success":true,"title":"Offres d\'emploi","url":"https://..."}'
 */
export async function playwrightNavigate(
  sessionName: string,
  url: string
): Promise<string> {
  const page = getPage(sessionName);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  // Attente supplementaire pour le chargement du JS dynamique (SPA, hydratation)
  await page.waitForTimeout(3000);

  // Fermer automatiquement les bannieres de cookies courantes
  // Tente plusieurs selecteurs utilises par les sites d'emploi
  await dismissCookieBanners(page);

  const title = await page.title();
  return JSON.stringify({ success: true, title, url: page.url() });
}

/**
 * Role : Fermer les bannieres de cookies qui bloquent le contenu de la page
 * Parametre page : page Playwright active
 *
 * Tente de cliquer sur les boutons d'acceptation/refus des cookies.
 * Essaie plusieurs selecteurs courants utilises par les sites d'emploi.
 * Ignore silencieusement si aucune banniere n'est presente.
 *
 * Sites geres :
 * - WTTJ (Axeptio) : "OK pour moi" / "Non merci"
 * - Indeed : "Accept" / "Tout accepter"
 * - LinkedIn : "Accept cookies"
 * - Generique : boutons avec texte "accepter", "accept", "agree"
 */
async function dismissCookieBanners(page: Page): Promise<void> {
  // Liste des selecteurs de boutons de cookies (ordre : refuser d'abord, accepter ensuite)
  const cookieButtonSelectors = [
    // WTTJ (Axeptio) - le bouton "Non merci" a le role "Fermer sans accepter les cookies"
    'button[title*="accepter" i]',
    'button:has-text("Non merci")',
    'button:has-text("Fermer sans accepter")',
    // Generique - accepter (utilise si refus impossible)
    'button:has-text("Tout accepter")',
    'button:has-text("Accepter")',
    'button:has-text("Accept all")',
    'button:has-text("Accept cookies")',
    'button:has-text("J\'accepte")',
    'button:has-text("OK pour moi")',
    // ID/classes courants
    '#onetrust-accept-btn-handler',
    '[data-testid="cookie-accept"]',
    // Axeptio specifique
    '.axeptio_btn_dismiss',
    '[aria-label*="cookie" i][aria-label*="fermer" i]',
  ];

  for (const selector of cookieButtonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click({ timeout: 2000 });
        // Attendre que la banniere disparaisse
        await page.waitForTimeout(1000);
        return;
      }
    } catch {
      // Selecteur non trouve, essayer le suivant
    }
  }
}

/**
 * Role : Capturer un snapshot textuel de la page (arbre d'accessibilite)
 * Parametre sessionName : identifiant de la session
 * Retourne : arbre d'accessibilite formate en texte compact
 *
 * Le snapshot d'accessibilite est prefere au HTML car :
 * - Plus compact (moins de tokens pour Claude)
 * - Contient les elements interactifs avec leurs roles
 * - Plus facile a analyser pour l'IA
 *
 * Tronque a 8000 caracteres pour economiser les tokens.
 *
 * Exemple :
 *   const snapshot = await playwrightSnapshot("session1");
 *   // snapshot = "heading 'Offres d'emploi'\n  link 'Dev React' [href=/jobs/123]\n  ..."
 */
export async function playwrightSnapshot(
  sessionName: string
): Promise<string> {
  const page = getPage(sessionName);

  // Utiliser ariaSnapshot() de Playwright (remplace page.accessibility.snapshot() deprecie)
  // Retourne un arbre YAML-like avec les roles, noms et liens
  let snapshot = await page.locator("body").ariaSnapshot();

  // Limiter la taille pour economiser les tokens (max ~15000 caracteres)
  // Les pages de resultats WTTJ font ~38K, il faut garder assez pour couvrir les offres
  if (snapshot.length > 15000) {
    snapshot = snapshot.substring(0, 15000) + "\n... (tronque)";
  }
  return snapshot;
}

/**
 * Role : Remplir un champ de formulaire dans la page
 * Parametre sessionName : identifiant de la session
 * Parametre selector : selecteur CSS du champ
 * Parametre value : valeur a saisir
 *
 * Exemple :
 *   await playwrightFill("session1", "input[name='query']", "developpeur React");
 */
export async function playwrightFill(
  sessionName: string,
  selector: string,
  value: string
): Promise<string> {
  const page = getPage(sessionName);
  await page.fill(selector, value);
  return JSON.stringify({ success: true, selector, value });
}

/**
 * Role : Cliquer sur un element de la page
 * Parametre sessionName : identifiant de la session
 * Parametre selector : selecteur CSS de l'element
 *
 * Attend 2 secondes apres le clic pour le chargement eventuel.
 *
 * Exemple :
 *   await playwrightClick("session1", "button[type='submit']");
 */
export async function playwrightClick(
  sessionName: string,
  selector: string
): Promise<string> {
  const page = getPage(sessionName);
  await page.click(selector, { timeout: 10_000 });
  await page.waitForTimeout(2000);
  return JSON.stringify({ success: true, clicked: selector });
}

/**
 * Role : Attendre un certain temps (pour le chargement de pages dynamiques)
 * Parametre sessionName : identifiant de la session
 * Parametre ms : duree en millisecondes (max 10000)
 */
export async function playwrightWait(
  sessionName: string,
  ms: number
): Promise<string> {
  const page = getPage(sessionName);
  const safeMs = Math.min(ms, 10_000);
  await page.waitForTimeout(safeMs);
  return JSON.stringify({ success: true, waited: safeMs });
}

/**
 * Role : Extraire les liens d'elements correspondant a un selecteur CSS
 * Parametre sessionName : identifiant de la session
 * Parametre selector : selecteur CSS des elements a extraire
 * Retourne : tableau JSON des textes et hrefs extraits
 *
 * Exemple :
 *   const links = await playwrightExtractLinks("session1", 'a[href*="/jobs/"]');
 *   // links = '[{"text":"Dev React","href":"/jobs/123"}, ...]'
 */
export async function playwrightExtractLinks(
  sessionName: string,
  selector: string
): Promise<string> {
  const page = getPage(sessionName);
  const elements = await page.$$(selector);
  const links: { text: string; href: string }[] = [];

  for (const el of elements) {
    let text = "";
    let href = "";
    try {
      text = (await el.innerText()).trim();
    } catch { /* element sans texte */ }
    try {
      href = (await el.getAttribute("href")) || "";
    } catch { /* element sans href */ }
    links.push({ text, href });
  }

  return JSON.stringify(links);
}

/**
 * Role : Extraire le texte d'un element specifique via une liste de selecteurs CSS
 * Essaie chaque selecteur dans l'ordre et retourne le premier match valide (> 100 chars)
 * Parametre sessionName : identifiant de la session
 * Parametre selectors : liste de selecteurs CSS a essayer (du plus specifique au plus generique)
 * Parametre maxLength : longueur max du texte retourne (defaut : 8000 chars)
 * Retourne : contenu textuel tronque, ou chaine vide si aucun match
 *
 * Utilise principalement pour extraire la description complete d'une offre LinkedIn :
 *   Selecteurs tentes : ".jobs-description-content__text", ".jobs-box__html-content", etc.
 *
 * Exemple :
 *   const desc = await playwrightGetText("session1", [
 *     ".jobs-description-content__text",
 *     ".jobs-description__content",
 *     "#job-details",
 *   ]);
 *   // desc = "Nous recherchons un developpeur React senior..."
 */
export async function playwrightGetText(
  sessionName: string,
  selectors: string[],
  maxLength = 8000
): Promise<string> {
  const page = getPage(sessionName);

  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();

      // Verifier que l'element est visible et contient du texte substantiel
      if (await el.isVisible({ timeout: 2000 })) {
        let text = await el.innerText();

        // Ignorer les elements avec trop peu de texte (probablement pas la description)
        if (text.trim().length > 100) {
          if (text.length > maxLength) {
            text = text.substring(0, maxLength) + "\n... (tronque)";
          }
          return text.trim();
        }
      }
    } catch {
      // Selecteur non trouve ou timeout, essayer le suivant
    }
  }

  // Aucun selecteur n'a fonctionne
  return "";
}

/**
 * Role : Extraire la description complete d'une offre d'emploi via heuristiques
 * Parametre sessionName : identifiant de la session
 * Parametre maxLength : longueur max du texte retourne (defaut : 8000 chars)
 * Retourne : description complete de l'offre, ou chaine vide si non trouvee
 *
 * Strategie en 3 etapes (executee dans le contexte de la page via page.evaluate) :
 *
 *   1. Selecteurs semantiques connus : cherche des elements dont la classe ou l'id
 *      contient "description", "job-detail", "job-content" (independant des noms
 *      de classes specifiques qui changent frequemment sur LinkedIn).
 *
 *   2. Heuristique de densite textuelle : parmi tous les div/section/article
 *      (hors nav/header/footer/aside), trouve le bloc avec le meilleur ratio
 *      texte/enfants. Ce bloc est presque toujours la description du poste.
 *
 *   3. Fallback : retourne le innerText de <main> ou <body> si les deux
 *      premieres strategies echouent.
 *
 * Avantage par rapport aux selecteurs CSS statiques : resilient aux changements
 * de noms de classes LinkedIn/Indeed/WTTJ.
 *
 * Exemple :
 *   const desc = await playwrightGetJobDescription("session1");
 *   // desc = "Nous recherchons un developpeur React senior..."
 */
export async function playwrightGetJobDescription(
  sessionName: string,
  maxLength = 8000
): Promise<string> {
  const page = getPage(sessionName);

  const description = await page.evaluate((max: number) => {
    // --- Strategie 1 : selecteurs semantiques independants des noms de classes ---
    // Cherche des elements dont classe ou id contient des mots-cles de description
    const semanticPatterns = [
      "[class*='description']",
      "[id*='description']",
      "[id*='job-detail']",
      "[class*='job-detail']",
      "[class*='job-content']",
      "[id*='job-content']",
      "[class*='offer-description']",
      "[data-job-description]",
    ];

    for (const pattern of semanticPatterns) {
      try {
        const el = document.querySelector(pattern) as HTMLElement | null;
        if (el) {
          const text = el.innerText.trim();
          // Valide uniquement si le texte est substantiel (> 200 chars = vraie description)
          if (text.length > 200) {
            return text.substring(0, max);
          }
        }
      } catch {
        // Selecteur invalide, continuer
      }
    }

    // --- Strategie 2 : heuristique de densite textuelle ---
    // Trouve le bloc DOM avec le meilleur ratio texte/structure
    // Un bloc de description a beaucoup de texte et peu d'elements enfants directs
    const excludeTags = new Set(["NAV", "HEADER", "FOOTER", "ASIDE", "SCRIPT", "STYLE"]);

    const candidates = Array.from(
      document.querySelectorAll("div, section, article")
    )
      .filter((el) => {
        // Exclure les elements dans nav/header/footer/aside
        let ancestor = el.parentElement;
        while (ancestor) {
          if (excludeTags.has(ancestor.tagName)) return false;
          ancestor = ancestor.parentElement;
        }
        // Garder seulement les elements avec du texte substantiel
        return (el as HTMLElement).innerText.trim().length > 200;
      })
      .map((el) => {
        const text = (el as HTMLElement).innerText.trim();
        // Ratio densite : longueur du texte / nombre d'enfants directs
        // Un paragraphe de description a un ratio eleve (beaucoup de texte, peu d'enfants)
        const density = text.length / Math.max(el.children.length, 1);
        return { el, text, density };
      })
      // Trier par densite decroissante (le plus dense d'abord)
      .sort((a, b) => b.density - a.density)
      .slice(0, 5); // Garder les 5 meilleurs candidats

    for (const { text } of candidates) {
      if (text.length > 200) {
        return text.substring(0, max);
      }
    }

    // --- Strategie 3 : fallback sur le contenu principal ---
    const main =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("article") ||
      document.body;

    const fallbackText = main ? (main as HTMLElement).innerText.trim() : "";
    return fallbackText.substring(0, max);
  }, maxLength);

  return description || "";
}

/**
 * Role : Extraire le contenu textuel principal d'une page (fallback generique)
 * Parametre sessionName : identifiant de la session
 * Retourne : contenu textuel tronque a 5000 caracteres
 *
 * Cherche le contenu dans cet ordre : <article>, <main>, [role="main"], <body>
 * Conserve pour compatibilite. Preferer playwrightGetJobDescription pour les offres.
 */
export async function playwrightExtractContent(
  sessionName: string
): Promise<string> {
  const page = getPage(sessionName);

  let content = await page.evaluate(() => {
    // Tenter d'extraire le contenu principal (le plus specifique d'abord)
    const main =
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.body;
    return main ? (main as HTMLElement).innerText : "";
  });

  // Tronquer pour economiser les tokens
  if (content.length > 5000) {
    content = content.substring(0, 5000) + "\n... (tronque)";
  }
  return content;
}

/**
 * Role : Fermer la session navigateur et liberer les ressources
 * Parametre sessionName : identifiant de la session a fermer
 *
 * Ferme le navigateur Chromium et supprime la session de la memoire.
 * Ignore les erreurs si le navigateur est deja ferme.
 *
 * Exemple :
 *   await playwrightClose("session1");
 */
/**
 * Role : Scroller vers le bas de la page pour charger du contenu dynamique
 * Parametre sessionName : identifiant de la session
 *
 * Utile pour les sites qui chargent les offres au scroll (lazy loading).
 * Scrolle de 3 viewport heights puis attend 2s pour le chargement.
 */
export async function playwrightScroll(sessionName: string): Promise<void> {
  const page = getPage(sessionName);
  // Scroller progressivement pour declencher le lazy loading
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(800);
  }
  // Attendre le chargement du contenu dynamique
  await page.waitForTimeout(1500);
}

/**
 * Role : Obtenir l'URL actuelle de la page
 * Parametre sessionName : identifiant de la session
 * Retourne : URL actuelle
 *
 * Utile pour detecter les redirections (ex: LinkedIn redirige vers /login)
 */
export async function playwrightGetUrl(sessionName: string): Promise<string> {
  const page = getPage(sessionName);
  return page.url();
}

export async function playwrightClose(sessionName: string): Promise<void> {
  const session = sessions.get(sessionName);
  if (session) {
    try {
      await session.browser.close();
    } catch {
      // Navigateur peut-etre deja ferme, ignorer
    }
    sessions.delete(sessionName);
  }
}
