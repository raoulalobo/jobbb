import { createAuthClient } from "better-auth/react";

/**
 * Role : Client Better Auth pour les composants React cote client
 * Fournit les hooks d'authentification : useSession, signIn, signUp, signOut
 * Utilise par : composants client (login, register, header, etc.)
 *
 * Exemple :
 *   const { data: session } = authClient.useSession()
 *   await authClient.signIn.email({ email, password })
 */
export const authClient = createAuthClient({
  // Pas de baseURL explicite : les requetes sont envoyees sur le meme origin
  // Cela evite les problemes CORS quand le port change (3000 -> 3001, etc.)
});
