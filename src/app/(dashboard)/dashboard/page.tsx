"use client";

/**
 * Rôle : Dashboard Command Center — vue principale de l'application
 * Utilise par : route /dashboard
 *
 * Layout :
 *   1. Greeting — "Bonjour, [Prénom] ✦" en Instrument Serif + sous-titre dynamique
 *   2. 4 Stat cards — nouvelles offres, candidatures, recherches actives, taux de réponse
 *   3. Pipeline de candidatures — 6 étapes avec compteurs et barres de progression
 *   4. Bas de page — Offres récentes (gauche 2/3) + Prochaine action (droite 1/3)
 *
 * Data (Tanstack Query via hooks ZenStack) :
 *   - authClient.useSession() : prénom de l'utilisateur
 *   - useCountOffer / useCountApplication / useCountSearchConfig : stats
 *   - useCountApplication x6 : pipeline par statut
 *   - useFindManyOffer (take:4) : offres récentes
 */

import Link from "next/link";
import {
  Briefcase,
  FileText,
  Search,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCountOffer,
  useCountApplication,
  useCountSearchConfig,
  useFindManyOffer,
} from "@/lib/hooks";
import { authClient } from "@/lib/auth-client";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PipelineWidget } from "@/components/dashboard/PipelineWidget";
import { RecentOffersWidget } from "@/components/dashboard/RecentOffersWidget";

// ─── Styles keyframe fade-up (réutilise la même animation que les pages auth) ──
const FADE_UP_STYLE = `
@keyframes ja-du-fade {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ja-du { animation: ja-du-fade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
.ja-du-1 { animation-delay: 0.05s; }
.ja-du-2 { animation-delay: 0.1s; }
.ja-du-3 { animation-delay: 0.15s; }
.ja-du-4 { animation-delay: 0.2s; }
`;

// ─── Configuration des 4 stat cards ─────────────────────────────────────────

interface StatCardDef {
  label:    string;
  icon:     React.ElementType;
  color:    string;   // couleur du cercle icône + chiffre
  bgColor:  string;   // fond du cercle icône
}

const STAT_DEFS: StatCardDef[] = [
  { label: "Nouvelles offres",   icon: Briefcase,   color: "#0057BA", bgColor: "rgba(0,87,186,0.1)"    },
  { label: "Candidatures",       icon: FileText,    color: "#9C52F2", bgColor: "rgba(156,82,242,0.1)"  },
  { label: "Recherches actives", icon: Search,      color: "#10B981", bgColor: "rgba(16,185,129,0.1)"  },
  { label: "Taux de réponse",    icon: TrendingUp,  color: "#F59E0B", bgColor: "rgba(245,158,11,0.1)"  },
];

// ─── Sous-composant : Stat Card individuelle ────────────────────────────────

interface StatCardProps extends StatCardDef {
  value:    string;
  delay:    string;
}

/**
 * Carte de statistique du dashboard.
 * Affiche : icône dans un cercle coloré, label, grande valeur numérique.
 */
function StatCard({ label, icon: Icon, color, bgColor, value, delay }: StatCardProps) {
  return (
    <Card className={`ja-du ${delay}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1">
        {/* Label de la stat */}
        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6B7280" }}>
          {label}
        </span>

        {/* Cercle icône coloré */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </CardHeader>

      <CardContent style={{ paddingTop: "0.25rem" }}>
        {/* Valeur numérique proéminente */}
        <p style={{ fontSize: "2rem", fontWeight: 700, color, lineHeight: 1 }}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Sous-composant : Prochaine action ──────────────────────────────────────

interface NextActionCardProps {
  newOffersCount:      number;
  activeSearchesCount: number;
  applicationsCount:   number;
  sentCount:           number;
}

/**
 * Card "Prochaine action" : suggère l'action la plus pertinente selon l'état actuel.
 * Priorités :
 *   1. Nouvelles offres à consulter
 *   2. Aucune recherche active → configurer
 *   3. Candidatures envoyées → relancer
 *   4. Tout est en ordre
 */
function NextActionCard({
  newOffersCount,
  activeSearchesCount,
  applicationsCount,
  sentCount,
}: NextActionCardProps) {
  // Détermination de la suggestion prioritaire
  let icon = CheckCircle2;
  let iconColor = "#10B981";
  let iconBg = "rgba(16,185,129,0.1)";
  let title = "Tout est en ordre";
  let text = "Votre agent surveille vos recherches et cherche de nouvelles offres.";
  let ctaLabel: string | null = null;
  let ctaHref: string | null = null;
  let ctaColor = "#0057BA";

  if (newOffersCount > 0) {
    // Priorité 1 : nouvelles offres à voir
    icon      = Briefcase;
    iconColor = "#0057BA";
    iconBg    = "rgba(0,87,186,0.1)";
    title     = `${newOffersCount} nouvelle${newOffersCount > 1 ? "s" : ""} offre${newOffersCount > 1 ? "s" : ""}`;
    text      = `Votre agent a trouvé des offres correspondant à vos critères.`;
    ctaLabel  = "Consulter les offres";
    ctaHref   = "/offers";
    ctaColor  = "#0057BA";
  } else if (activeSearchesCount === 0) {
    // Priorité 2 : aucune recherche configurée
    icon      = Search;
    iconColor = "#9C52F2";
    iconBg    = "rgba(156,82,242,0.1)";
    title     = "Démarrez votre recherche";
    text      = "Configurez vos critères pour que l'agent scrape des offres automatiquement.";
    ctaLabel  = "Configurer une recherche";
    ctaHref   = "/searches";
    ctaColor  = "#9C52F2";
  } else if (applicationsCount > 0 && sentCount > 0) {
    // Priorité 3 : candidatures envoyées, penser à relancer
    icon      = FileText;
    iconColor = "#F59E0B";
    iconBg    = "rgba(245,158,11,0.1)";
    title     = "Suivi des candidatures";
    text      = `${sentCount} candidature${sentCount > 1 ? "s" : ""} envoyée${sentCount > 1 ? "s" : ""} — pensez à faire un suivi.`;
    ctaLabel  = "Voir mes candidatures";
    ctaHref   = "/applications";
    ctaColor  = "#F59E0B";
  }

  const IconComp = icon;

  return (
    <Card style={{ height: "100%" }}>
      <CardHeader style={{ paddingBottom: "0.75rem" }}>
        <CardTitle style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0A0F1E" }}>
          Prochaine action
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {/* Icône centrale */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComp size={20} style={{ color: iconColor }} />
          </div>

          {/* Titre + texte */}
          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0A0F1E", marginBottom: "0.25rem" }}>
              {title}
            </p>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5 }}>
              {text}
            </p>
          </div>

          {/* CTA (si pertinent) — ternaire explicite selon rendering-conditional-render */}
          {ctaLabel !== null && ctaHref !== null ? (
            <Link
              href={ctaHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.5rem 1rem",
                borderRadius: 9,
                backgroundColor: ctaColor,
                color: "white",
                fontSize: "0.82rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "filter 0.15s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.filter = "brightness(0.88)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1)")
              }
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  // Session utilisateur pour le prénom dans le greeting
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "vous";

  // ── Queries principales (isLoading = skeleton complet) ──────────────────
  const { data: newOffersCount,     isLoading: loadingOffers      } = useCountOffer({ where: { isNew: true } });
  const { data: applicationsCount,  isLoading: loadingApps        } = useCountApplication();
  const { data: activeSearchesCount,isLoading: loadingSearches    } = useCountSearchConfig({ where: { isActive: true } });
  const { data: recentOffers,       isLoading: loadingRecentOffers } = useFindManyOffer({
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  // ── Queries pipeline (chargées indépendamment, montrent 0 si pas encore prêtes) ──
  // On capture isLoading sur TOUTES les queries pour ne passer isLoading=false
  // au PipelineWidget que lorsque l'ensemble des 6 statuts est résolu.
  const { data: draftCount,     isLoading: lDraft     } = useCountApplication({ where: { status: "draft"     } });
  const { data: readyCount,     isLoading: lReady     } = useCountApplication({ where: { status: "ready"     } });
  const { data: sentCount,      isLoading: lSent      } = useCountApplication({ where: { status: "sent"      } });
  const { data: interviewCount, isLoading: lInterview } = useCountApplication({ where: { status: "interview" } });
  const { data: rejectedCount,  isLoading: lRejected  } = useCountApplication({ where: { status: "rejected"  } });
  const { data: acceptedCount,  isLoading: lAccepted  } = useCountApplication({ where: { status: "accepted"  } });

  // Vrai tant qu'au moins un des 6 compteurs du pipeline est en cours de chargement
  const loadingPipeline = lDraft || lReady || lSent || lInterview || lRejected || lAccepted;

  // Skeleton si les données principales ne sont pas encore chargées
  const isLoading = loadingOffers || loadingApps || loadingSearches || loadingRecentOffers;

  if (isLoading) return <DashboardSkeleton />;

  // Valeurs résolues pour les stat cards
  const statsValues = [
    String(newOffersCount      ?? 0),
    String(applicationsCount   ?? 0),
    String(activeSearchesCount ?? 0),
    // Taux de réponse : candidatures avec réponse (interview + accepted) / total
    (applicationsCount ?? 0) > 0
      ? `${Math.round((((interviewCount ?? 0) + (acceptedCount ?? 0)) / (applicationsCount ?? 1)) * 100)}%`
      : "—",
  ];

  return (
    <>
      {/* Keyframes animation fade-up pour les sections du Command Center */}
      <style dangerouslySetInnerHTML={{ __html: FADE_UP_STYLE }} />

      <div className="space-y-6">

        {/* ── 1. Greeting ─────────────────────────────────────────────── */}
        <div className="ja-du">
          {/* Titre en Instrument Serif, cohérent avec la homepage et les pages auth */}
          <h1
            style={{
              fontFamily: "var(--font-display, 'Instrument Serif', serif)",
              fontSize: "2.2rem",
              fontWeight: 400,
              color: "#0A0F1E",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Bonjour, {firstName}{" "}
            {/* Étoile violette brand — clin d'œil au logo de la homepage */}
            <span style={{ color: "#9C52F2" }}>✦</span>
          </h1>

          {/* Sous-titre dynamique selon le contexte */}
          <p style={{ marginTop: "0.3rem", fontSize: "0.9rem", color: "#6B7280" }}>
            {(activeSearchesCount ?? 0) > 0
              ? `Votre agent surveille ${activeSearchesCount} recherche${(activeSearchesCount ?? 0) > 1 ? "s" : ""} active${(activeSearchesCount ?? 0) > 1 ? "s" : ""}.`
              : "Configurez une recherche pour démarrer l'automatisation."}
          </p>
        </div>

        {/* ── 2. Grille des 4 stat cards ──────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_DEFS.map((def, i) => (
            <StatCard
              key={def.label}
              {...def}
              value={statsValues[i]}
              delay={`ja-du-${i + 1}`}
            />
          ))}
        </div>

        {/* ── 3. Pipeline de candidatures (pleine largeur) ─────────────── */}
        <div className="ja-du ja-du-3">
          <PipelineWidget
            draft={draftCount         ?? 0}
            ready={readyCount         ?? 0}
            sent={sentCount           ?? 0}
            interview={interviewCount ?? 0}
            rejected={rejectedCount   ?? 0}
            accepted={acceptedCount   ?? 0}
            total={applicationsCount  ?? 0}
            isLoading={loadingPipeline}
          />
        </div>

        {/* ── 4. Bas de page : offres récentes + prochaine action ──────── */}
        <div className="ja-du ja-du-4 grid gap-4 lg:grid-cols-3">
          {/* Offres récentes — 2/3 de largeur */}
          <div className="lg:col-span-2">
            <RecentOffersWidget offers={recentOffers ?? []} />
          </div>

          {/* Prochaine action — 1/3 de largeur */}
          <div>
            <NextActionCard
              newOffersCount={newOffersCount         ?? 0}
              activeSearchesCount={activeSearchesCount ?? 0}
              applicationsCount={applicationsCount   ?? 0}
              sentCount={sentCount                   ?? 0}
            />
          </div>
        </div>

      </div>
    </>
  );
}
