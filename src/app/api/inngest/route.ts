/**
 * Role : Route API de serve pour Inngest
 * Point d'entree HTTP que le cloud Inngest appelle pour :
 *   - Decouvrir les fonctions disponibles (GET)
 *   - Declencher l'execution des fonctions (POST)
 *   - Synchroniser les definitions (PUT)
 *
 * En developpement :
 *   - Inngest Dev Server (http://localhost:8288) appelle cette route
 *   - Pas de cles requises, le Dev Server est local
 *   - Lancer le Dev Server : npx inngest-cli@latest dev
 *
 * En production (Vercel) :
 *   - Inngest Cloud appelle cette route via HTTPS
 *   - Requiert INNGEST_EVENT_KEY et INNGEST_SIGNING_KEY en variables d'env
 *   - Configurer l'URL dans le dashboard Inngest : https://votreapp.vercel.app/api/inngest
 *
 * Fonctions enregistrees :
 *   - scheduledSearch : cron toutes les minutes, detecte les users a lancer
 *   - runUserSearch   : lance le scraping pour un user specifique
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { scheduledSearch } from "@/lib/inngest/functions/scheduled-search";
import { runUserSearch } from "@/lib/inngest/functions/run-user-search";

/**
 * Handler Inngest : exporte GET, POST, PUT pour Next.js App Router
 * Ces trois methodes sont necessaires pour le protocole Inngest
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scheduledSearch, // cron : detecte les users a lancer
    runUserSearch,   // event handler : scraping pour un user
  ],
});
