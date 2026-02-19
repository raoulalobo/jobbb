import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

/**
 * Police d'affichage : Instrument Serif (serif contemporain, style editorial)
 * Utilisee pour les titres h1/h2 de la landing page
 * Variable CSS : --font-display
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Police de corps : Outfit (sans-serif geometrique, sobre et lisible)
 * Utilisee pour tout le texte courant, remplace Inter
 * Variable CSS : --font-body
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

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
    <html lang="fr" className={`${instrumentSerif.variable} ${outfit.variable}`}>
      <body className="min-h-screen antialiased">
        <QueryProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
