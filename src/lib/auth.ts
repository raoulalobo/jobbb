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

  // Origins autorisees pour CORS
  // Inclut toutes les URLs Vercel possibles pour eviter les erreurs cross-origin
  // Variables d'env a definir sur Vercel :
  //   BETTER_AUTH_URL=https://jobbb-brown.vercel.app (URL principale)
  //   BETTER_AUTH_TRUSTED_ORIGINS=https://jobbb.vercel.app,https://jobbb-brown.vercel.app (optionnel, URLs supplementaires)
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    // Origins supplementaires separees par des virgules (ex: plusieurs domaines Vercel)
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
      : []),
  ],

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
