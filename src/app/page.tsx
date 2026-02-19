import Link from "next/link";
import { ArrowRight, Bot, LogIn, UserPlus } from "lucide-react";
import { ConstellationBackground } from "@/components/landing/ConstellationBackground";
import { CyclingWord } from "@/components/landing/CyclingWord";

/**
 * Role : Landing page de JobAgent — hero unique, plein écran
 * Structure : Navbar → Hero (2 colonnes, full viewport) → Footer
 *
 * Direction artistique : "Precision Editorial"
 *   - Typographie : Instrument Serif (display) + Outfit (corps)
 *   - Palette : #0057BA (bleu dominant) / #9C52F2 (violet accent) / #BFABCC (lavande)
 *   - Objectif : accrocher immédiatement, message clair sur le but de l'app
 *   - Animation : CSS pur, stagger au chargement
 *
 * Server Component — aucun "use client" requis
 */
export default function HomePage() {
  return (
    <>
      <style>{`
        .ja-page {
          --ja-blue:     #0057BA;
          --ja-violet:   #9C52F2;
          --ja-lavender: #BFABCC;
          --ja-surface:  #F8F7F5;
          --ja-dark:     #0A0F1E;
          font-family: var(--font-body, 'Outfit', sans-serif);
        }

        @keyframes ja-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ja-slide-in {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes ja-underline {
          from { width: 0;    }
          to   { width: 100%; }
        }
        @keyframes ja-pulse {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.35; }
        }

        /* ConstellationBackground rendu via Canvas (composant client séparé) */

        /* Stagger d'apparition — éléments texte hero */
        .ja-fu   { opacity: 0; animation: ja-fade-up  0.65s ease forwards; }
        .ja-si   { opacity: 0; animation: ja-slide-in 0.8s  ease forwards 0.4s; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.2s;  }
        .d3 { animation-delay: 0.35s; }
        .d4 { animation-delay: 0.5s;  }
        .d5 { animation-delay: 0.65s; }

        /* Mot-clé "emploi" : couleur bleue + soulignement violet animé */
        .ja-kw {
          position: relative;
          display: inline-block;
          color: var(--ja-blue);
          font-style: italic;
        }
        .ja-kw::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          height: 3px; width: 0;
          background: var(--ja-violet);
          border-radius: 2px;
          animation: ja-underline 0.7s ease forwards 1s;
        }

        /* Point pulsant "agent actif" */
        .ja-dot { animation: ja-pulse 2s ease infinite; }

        /* Hover CTA primaire */
        .ja-btn-p { transition: background-color 0.18s, box-shadow 0.18s; }
        .ja-btn-p:hover {
          background-color: #004fa8 !important;
          box-shadow: 0 6px 28px rgba(0,87,186,0.38) !important;
        }

        /* Hover CTA secondaire */
        .ja-btn-s { transition: background-color 0.18s; }
        .ja-btn-s:hover { background-color: rgba(191,171,204,0.18) !important; }

        /* Hover liens nav */
        .ja-nl { transition: color 0.15s; }
        .ja-nl:hover { color: var(--ja-dark) !important; }
      `}</style>

      <div className="ja-page">

        {/* ═══════════════════════════════════════════════════════════════════
            NAVBAR — sticky, givré, logo + connexion/inscription
        ═══════════════════════════════════════════════════════════════════ */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "rgba(248,247,245,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(191,171,204,0.22)",
        }}>
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                backgroundColor: "var(--ja-blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={18} color="white" />
              </div>
              <span style={{
                fontWeight: 600, fontSize: "1.05rem",
                color: "var(--ja-dark)", letterSpacing: "-0.025em",
              }}>
                JobAgent
              </span>
            </Link>

            {/* Actions — texte sur sm+, icône seule sur mobile */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/*
               * Bouton Connexion :
               *   - Mobile (<sm) : icône LogIn seule, padding carré compact
               *   - sm+ : texte "Connexion", padding horizontal étendu
               */}
              <Link
                href="/login"
                className="ja-nl flex items-center justify-center p-2 sm:px-3.5 sm:py-2"
                style={{
                  color: "#64748b", fontSize: "0.875rem",
                  textDecoration: "none", borderRadius: "8px",
                }}
              >
                {/* Icône visible sur mobile uniquement */}
                <LogIn size={18} className="sm:hidden" aria-hidden />
                {/* Texte visible sur sm et plus */}
                <span className="hidden sm:inline">Connexion</span>
              </Link>

              {/*
               * Bouton Commencer :
               *   - Mobile (<sm) : icône UserPlus seule, padding carré compact
               *   - sm+ : texte "Commencer" + flèche, padding horizontal étendu
               */}
              <Link
                href="/register"
                className="ja-btn-p flex items-center justify-center gap-1.5 p-2 sm:px-[1.125rem] sm:py-2"
                style={{
                  backgroundColor: "var(--ja-blue)", color: "white",
                  textDecoration: "none", borderRadius: "8px",
                  fontSize: "0.875rem", fontWeight: 500,
                  boxShadow: "0 2px 12px rgba(0,87,186,0.22)",
                }}
              >
                {/* Icône visible sur mobile uniquement */}
                <UserPlus size={18} className="sm:hidden" aria-hidden />
                {/* Texte + flèche visibles sur sm et plus */}
                <span className="hidden sm:inline">Commencer</span>
                <ArrowRight size={13} className="hidden sm:inline" aria-hidden />
              </Link>

            </div>
          </nav>
        </header>


        {/* ═══════════════════════════════════════════════════════════════════
            HERO — plein écran, 2 colonnes : accroche à gauche, mockup à droite
        ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          backgroundColor: "var(--ja-surface)",
          minHeight: "calc(100vh - 66px)",
          display: "flex", alignItems: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* ── Constellation canvas — étoiles reliées qui dérivent lentement ── */}
          <ConstellationBackground />

          {/* Contenu au-dessus du mesh (z-index supérieur) */}
          <div className="mx-auto max-w-6xl w-full px-6 py-16 md:py-0" style={{ position: "relative", zIndex: 1 }}>
            <div className="max-w-2xl">

              <div className="space-y-8">

                {/* Badge "Agent IA" */}
                <div className="ja-fu d1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full" style={{
                  backgroundColor: "rgba(156,82,242,0.07)",
                  border: "1px solid rgba(156,82,242,0.2)",
                }}>
                  <span className="ja-dot" style={{
                    display: "inline-block",
                    width: 7, height: 7, borderRadius: "50%",
                    backgroundColor: "var(--ja-violet)",
                  }} />
                  <span style={{
                    fontSize: "0.78rem", fontWeight: 500,
                    color: "var(--ja-violet)", letterSpacing: "0.01em",
                  }}>
                    + de 10K annonces par jour
                  </span>
                </div>

                {/* Headline — raison d'être de l'app en une phrase */}
                <div className="ja-fu d2">
                  <h1 style={{
                    fontFamily: "var(--font-display, 'Instrument Serif', Georgia, serif)",
                    fontSize: "clamp(2.8rem, 5vw, 4.2rem)",
                    fontWeight: 400, lineHeight: 1.07,
                    letterSpacing: "-0.025em",
                    color: "var(--ja-dark)", margin: 0,
                  }}>
                    Trouvez votre{" "}
                    <span className="ja-kw">emploi</span>
                    <br />
                    pendant que vous{" "}
                    <CyclingWord />
                  </h1>
                </div>

                {/* Sous-titre — valeur concrète, sans jargon */}
                <p className="ja-fu d3" style={{
                  fontSize: "1.05rem", color: "#5a6a82",
                  lineHeight: 1.75, fontWeight: 300,
                  maxWidth: 450, margin: 0,
                }}>
                  JobAgent scrape les offres, adapte votre CV et rédige vos
                  lettres de motivation — pour chaque poste, chaque jour,
                  sans que vous n&apos;ayez à lever le petit doigt.
                </p>

                {/* CTAs */}
                <div className="ja-fu d4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="ja-btn-s"
                    style={{
                      color: "#475569", textDecoration: "none",
                      padding: "0.9rem 1.5rem", borderRadius: "10px",
                      fontSize: "0.975rem", fontWeight: 400,
                      border: "1px solid rgba(191,171,204,0.6)",
                    }}
                  >
                    Se connecter
                  </Link>
                </div>

                {/* Social proof — avatars + 310+ */}
                <div className="ja-fu d5 flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {[
                      { bg: "#0057BA", l: "M" },
                      { bg: "#9C52F2", l: "S" },
                      { bg: "#BFABCC", l: "A" },
                      { bg: "#0A0F1E", l: "T" },
                    ].map((a, i) => (
                      <div key={i} aria-hidden style={{
                        width: 30, height: 30, borderRadius: "50%",
                        backgroundColor: a.bg,
                        border: "2.5px solid var(--ja-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.58rem", fontWeight: 700, color: "white",
                      }}>
                        {a.l}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                    <strong style={{ color: "#475569", fontWeight: 600 }}>310+</strong>
                    {" "}candidats actifs ce mois
                  </p>
                </div>
              </div>


            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER — minimal, sombre
        ═══════════════════════════════════════════════════════════════════ */}
        <footer style={{
          backgroundColor: "var(--ja-dark)", padding: "2rem 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                backgroundColor: "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={15} color="white" />
              </div>
              <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500, fontSize: "0.875rem" }}>
                JobAgent
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", margin: 0 }}>
              © {new Date().getFullYear()} JobAgent. Tous droits réservés.
            </p>
            <div className="flex gap-5">
              {["Confidentialité", "CGU"].map((l) => (
                <a key={l} href="#" style={{
                  color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", textDecoration: "none",
                }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
