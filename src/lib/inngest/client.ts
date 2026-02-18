/**
 * Role : Client Inngest centralise pour toute l'application
 * Definit l'identifiant de l'application et le schema des evenements
 *
 * Evenements declares :
 *   - "search/user.trigger" : declenche la recherche pour un utilisateur specifique
 *     Emis par la fonction cron `scheduled-search` quand l'heure configuree correspond
 *     Consomme par la fonction `run-user-search`
 *
 * Variables d'env requises :
 *   - INNGEST_EVENT_KEY   : cle d'evenement (fournie par le dashboard Inngest)
 *   - INNGEST_SIGNING_KEY : cle de validation des webhooks (fournie par le dashboard Inngest)
 *
 * En developpement local, Inngest Dev Server tourne sur http://localhost:8288
 * et ne necessite pas de cles (detection automatique)
 *
 * Exemple d'emission d'evenement :
 *   await inngest.send({ name: "search/user.trigger", data: { userId: "abc123" } });
 */

import { Inngest, EventSchemas } from "inngest";

/**
 * Schema typesafe des evenements Inngest de l'application
 * Chaque cle est le nom de l'evenement, la valeur definit la forme de `data`
 */
type Events = {
  /** Declenche la recherche pour un utilisateur dont l'heure planifiee correspond */
  "search/user.trigger": {
    data: {
      /** ID de l'utilisateur dont les SearchConfigs actifs doivent etre scrapees */
      userId: string;
    };
  };
};

/**
 * Instance Inngest partagee dans toute l'application
 * L'id "jobagent" identifie cette app dans le dashboard Inngest
 * EventSchemas.fromRecord<Events>() assure le typage des evenements
 */
export const inngest = new Inngest({
  id: "jobagent",
  schemas: new EventSchemas().fromRecord<Events>(),
});
