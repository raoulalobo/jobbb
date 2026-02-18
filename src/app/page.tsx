import Link from "next/link";

/**
 * Role : Page d'accueil / Landing page de JobAgent
 * Redirige vers le dashboard si connecte, sinon affiche la landing
 * Utilise par : route racine "/"
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-primary">JobAgent</h1>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Inscription
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Automatisez votre recherche d&apos;emploi
          </h2>
          <p className="text-lg text-muted-foreground">
            Un agent IA qui scrape les offres, adapte votre CV et vos lettres
            de motivation, et vous aide a postuler. Tout ca, automatiquement.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-6 py-3 text-base font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Se connecter
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold">Recherche automatique</h3>
            <p className="text-sm text-muted-foreground">
              Configurez vos criteres et laissez l&apos;agent scraper les offres
              sur Welcome to the Jungle, Indeed et LinkedIn.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold">CV & Lettre adaptes</h3>
            <p className="text-sm text-muted-foreground">
              L&apos;IA adapte automatiquement votre CV et genere une lettre de
              motivation pour chaque offre.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold">Candidature assistee</h3>
            <p className="text-sm text-muted-foreground">
              L&apos;agent remplit les formulaires de candidature pour vous.
              Vous validez, il postule.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} JobAgent. Tous droits reserves.
      </footer>
    </div>
  );
}
