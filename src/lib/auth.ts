import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

/**
 * Role : Configuration serveur de Better Auth
 * Gere l'authentification email/password avec roles (candidate/admin)
 * Utilise par : API routes d'auth, middleware, server components
 *
 * Fonctionnalites :
 *   - Inscription/connexion par email + mot de passe
 *   - Sessions persistantes via cookie
 *   - Champ role ("candidate" par defaut) stocke dans User
 */
export const auth = betterAuth({
  // Utilise Prisma comme adaptateur BDD
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Configuration email + password
  emailAndPassword: {
    enabled: true,
  },

  // Champs additionnels sur le modele User
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "candidate",
        input: false, // Pas modifiable par l'utilisateur lors de l'inscription
      },
    },
  },

  // Configuration des sessions
  session: {
    // Duree de session : 7 jours
    expiresIn: 60 * 60 * 24 * 7,
    // Renouvellement automatique si la session expire dans moins de 1 jour
    updateAge: 60 * 60 * 24,
  },
});
