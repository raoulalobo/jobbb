"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Role : Provider Tanstack Query pour l'application
 * Initialise le QueryClient avec une configuration par defaut
 * Utilise par : layout.tsx racine pour envelopper toute l'application
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
