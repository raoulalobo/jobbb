"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Provider as ZenStackProvider } from "@/lib/hooks";

/**
 * Role : Provider Tanstack Query + ZenStack pour l'application
 * Initialise le QueryClient et configure l'endpoint ZenStack.
 * Utilise par : layout.tsx racine pour envelopper toute l'application
 *
 * Le Provider ZenStack fournit l'endpoint /api/model aux hooks generés.
 * Sans lui, getHooksContext() utilise localhost:3000 → HTML au lieu de JSON en prod.
 *
 * Exemple :
 *   <QueryProvider>{children}</QueryProvider>
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Creation du QueryClient dans un useState pour eviter
  // le partage entre requetes SSR (un client par session navigateur)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Pas de refetch automatique au focus pour eviter les requetes inutiles
            refetchOnWindowFocus: false,
            // Retry une seule fois en cas d'erreur
            retry: 1,
            // Cache valide pendant 5 minutes
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* ZenStackProvider : injecte l'endpoint /api/model dans le contexte des hooks générés */}
      <ZenStackProvider value={{ endpoint: "/api/model" }}>
        {children}
      </ZenStackProvider>
    </QueryClientProvider>
  );
}
