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
  // baseURL pointe vers NEXT_PUBLIC_BETTER_AUTH_URL si defini (production Vercel)
  // En dev : undefined = meme origin (localhost:3000)
  // Sur Vercel : definir NEXT_PUBLIC_BETTER_AUTH_URL=https://jobbb-brown.vercel.app
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
