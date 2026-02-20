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
  // baseURL : utilise NEXT_PUBLIC_BETTER_AUTH_URL si defini au moment du build,
  // sinon fallback sur l'origine courante (window.location.origin).
  // Cela evite le fallback de better-auth sur localhost:3000 quand la variable
  // n'est pas baked dans le bundle (ex : premiere deploy Render sans la variable).
  //
  // En dev           : NEXT_PUBLIC_BETTER_AUTH_URL non defini → window.location.origin = http://localhost:3000 ✓
  // En prod (Render) : NEXT_PUBLIC_BETTER_AUTH_URL=https://jobagent-ccd9.onrender.com → utilise la valeur ✓
  //                    OU non defini → window.location.origin = https://jobagent-ccd9.onrender.com ✓
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined),
});
