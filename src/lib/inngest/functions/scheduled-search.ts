/**
 * Role : Fonction Inngest cron — verifie toutes les minutes quels utilisateurs
 * ont configure une recherche automatique pour cette heure et cette minute.
 *
 * Fonctionnement :
 *   1. La fonction est declenchee par Inngest toutes les minutes ("* * * * *")
 *   2. Elle recupere tous les ScheduleConfig actifs depuis la BDD (sans filtre auth)
 *   3. Pour chaque config, elle convertit l'heure courante dans la timezone de l'utilisateur
 *   4. Si l'heure et la minute correspondent, elle emet un evenement "search/user.trigger"
 *   5. La fonction `run-user-search` consomme cet evenement et lance les recherches
 *
 * Precision : ±1 minute (la cron Inngest peut avoir un leger decalage)
 *
 * Cout estimé : ~0 (lecture BDD legere, pas de scraping dans cette fonction)
 *
 * Limites :
 *   - Sur Vercel hobby : timeout 10s/step → OK (la query BDD + conversions sont rapides)
 *   - Necessite INNGEST_EVENT_KEY et INNGEST_SIGNING_KEY en production
 */

import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

/**
 * Convertit l'heure et la minute courantes dans une timezone donnee.
 * Retourne { hour, minute } en heure locale de la timezone.
 *
 * Exemple :
 *   currentTimeInTimezone(new Date(), "America/New_York") => { hour: 9, minute: 30 }
 */
function currentTimeInTimezone(
  now: Date,
  timezone: string
): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0"
    );
    return { hour, minute };
  } catch {
    // Si la timezone est invalide, on utilise UTC
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes() };
  }
}

/**
 * Fonction Inngest declenchee toutes les minutes par le cron "* * * * *"
 * Identifie les utilisateurs dont l'heure planifiee correspond a l'heure courante
 * et emet un evenement par utilisateur correspondant.
 */
export const scheduledSearch = inngest.createFunction(
  {
    id: "scheduled-search",
    name: "Recherche planifiee (cron toutes les minutes)",
  },
  // Cron : toutes les minutes
  { cron: "* * * * *" },
  async ({ step }) => {
    // Etape 1 : recuperer tous les ScheduleConfig actifs
    // Utilise le client Prisma direct (sans ZenStack) car pas de contexte user ici
    const configs = await step.run("fetch-active-configs", async () => {
      return prisma.scheduleConfig.findMany({
        where: { isActive: true },
      });
    });

    if (configs.length === 0) {
      return { triggered: 0, message: "Aucun scheduler actif" };
    }

    // Etape 2 : filtrer les configs dont l'heure correspond a l'heure courante
    const now = new Date();
    const matchingUserIds = configs
      .filter((config) => {
        const { hour, minute } = currentTimeInTimezone(now, config.timezone);
        return hour === config.hour && minute === config.minute;
      })
      .map((config) => config.userId);

    if (matchingUserIds.length === 0) {
      return { triggered: 0, message: "Aucune recherche a declencher" };
    }

    // Etape 3 : emettre un evenement par utilisateur correspondant
    await step.run("emit-user-events", async () => {
      await inngest.send(
        matchingUserIds.map((userId) => ({
          name: "search/user.trigger" as const,
          data: { userId },
        }))
      );
    });

    return {
      triggered: matchingUserIds.length,
      message: `${matchingUserIds.length} recherche(s) declenchee(s)`,
    };
  }
);
