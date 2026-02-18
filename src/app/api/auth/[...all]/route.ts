import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Role : Handler API pour toutes les routes d'authentification Better Auth
 * Gere automatiquement :
 *   POST /api/auth/sign-up/email    -> inscription
 *   POST /api/auth/sign-in/email    -> connexion
 *   POST /api/auth/sign-out         -> deconnexion
 *   GET  /api/auth/session          -> recuperer la session
 *   etc.
 */
export const { GET, POST } = toNextJsHandler(auth);
