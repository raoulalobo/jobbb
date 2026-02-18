/**
 * Role : Fonction Inngest declenchee par l'evenement "search/user.trigger"
 * Execute toutes les recherches actives d'un utilisateur et stocke les offres en BDD.
 *
 * Flux :
 *   1. Charge le profil de l'utilisateur (identifiants LinkedIn)
 *   2. Charge toutes ses SearchConfig actives
 *   3. Pour chaque SearchConfig : lance runSearchAgent + upsert des offres en BDD
 *   4. Retourne le nombre total d'offres nouvelles et mises a jour
 *
 * Etapes Inngest (step.run) :
 *   - Chaque etape est rejouable en cas d'echec partiel (propriete Inngest)
 *   - Une SearchConfig en erreur n'interrompt pas les autres
 *
 * Limites connues :
 *   - runSearchAgent utilise Playwright (navigateur headless)
 *   - En production Vercel, Playwright necessite une configuration speciale
 *     (playwright-core + navigateur distant via ex. Browserless.io)
 *   - En developpement local : fonctionne avec Playwright installe localement
 *
 * Variables d'env requises :
 *   - ANTHROPIC_API_KEY
 *   - INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
 */

import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { runSearchAgent, type SearchCriteria } from "@/lib/agent/orchestrator";

export const runUserSearch = inngest.createFunction(
  {
    id: "run-user-search",
    name: "Lancer les recherches d'un utilisateur",
    // Limite de concurrence : un seul job actif par utilisateur a la fois
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
  },
  { event: "search/user.trigger" },
  async ({ event, step }) => {
    const { userId } = event.data;

    // Etape 1 : charger le profil (identifiants LinkedIn)
    const profile = await step.run("load-profile", async () => {
      return prisma.profile.findUnique({ where: { userId } });
    });

    // Abandonner si les identifiants LinkedIn sont manquants
    if (!profile?.linkedinEmail || !profile?.linkedinPassword) {
      return {
        userId,
        skipped: true,
        reason: "Identifiants LinkedIn manquants dans le profil",
      };
    }

    // Etape 2 : charger les SearchConfigs actives de l'utilisateur
    const searchConfigs = await step.run("load-search-configs", async () => {
      return prisma.searchConfig.findMany({
        where: { userId, isActive: true },
      });
    });

    if (searchConfigs.length === 0) {
      return {
        userId,
        skipped: true,
        reason: "Aucune configuration de recherche active",
      };
    }

    let totalNew = 0;
    let totalUpdated = 0;

    // Etape 3 : lancer la recherche pour chaque SearchConfig
    for (const config of searchConfigs) {
      const result = await step.run(`search-config-${config.id}`, async () => {
        // Construire les criteres depuis la SearchConfig + identifiants LinkedIn du profil
        const criteria: SearchCriteria = {
          query: config.query,
          location: config.location,
          sites: config.sites as string[],
          contractTypes: config.contractTypes as string[],
          remote: config.remote,
          salaryMin: config.salaryMin,
          excludeKeywords: (config.excludeKeywords as string[]) ?? [],
          linkedinEmail: profile.linkedinEmail!,
          linkedinPassword: profile.linkedinPassword!,
        };

        console.log(
          `[Inngest] Recherche pour user=${userId}, config="${config.name}"`
        );

        // Lancer le scraping LinkedIn
        const scrapedOffers = await runSearchAgent(criteria, userId);

        // Upsert des offres en BDD (deduplication par userId + url)
        let newCount = 0;
        let updatedCount = 0;

        for (const offer of scrapedOffers) {
          if (!offer.url) continue;

          try {
            const saved = await prisma.offer.upsert({
              where: { userId_url: { userId, url: offer.url } },
              create: {
                userId,
                title: offer.title,
                company: offer.company,
                location: offer.location,
                url: offer.url,
                description: offer.description,
                salary: offer.salary,
                contractType: offer.contractType,
                source: offer.source,
                isNew: true,
                isBookmarked: false,
              },
              update: {
                title: offer.title,
                company: offer.company,
                location: offer.location,
                description: offer.description,
                salary: offer.salary,
                contractType: offer.contractType,
              },
            });

            // Si createdAt est recent (<5s) → nouvelle offre
            if (Date.now() - saved.createdAt.getTime() < 5000) {
              newCount++;
            } else {
              updatedCount++;
            }
          } catch (err) {
            console.error(
              `[Inngest] Erreur upsert offre "${offer.title}":`,
              err
            );
          }
        }

        return { newCount, updatedCount };
      });

      totalNew += result.newCount;
      totalUpdated += result.updatedCount;
    }

    console.log(
      `[Inngest] user=${userId} : ${totalNew} nouvelles offres, ${totalUpdated} mises a jour`
    );

    return {
      userId,
      searchConfigs: searchConfigs.length,
      totalNew,
      totalUpdated,
    };
  }
);
