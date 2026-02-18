import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

/**
 * Role : Layout racine de l'application JobAgent
 * Definit les metadonnees globales, enveloppe l'app avec les providers
 * Utilise par : toutes les pages de l'application
 * Providers : QueryProvider (Tanstack Query), Toaster (notifications)
 */
export const metadata: Metadata = {
  title: "JobAgent - Recherche d'emploi automatisee",
  description:
    "SaaS de recherche d'emploi automatisee avec agent IA. Trouvez, adaptez et postulez automatiquement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
