"use client";

/**
 * Rôle : Widget "Offres récentes" du Dashboard Command Center
 * Affiche les 4 dernières offres scrappées avec leur titre, entreprise, source et date.
 * Un lien "Voir toutes les offres" est présent en pied de card.
 *
 * Props :
 *   - offers : tableau d'offres (max 4, pré-fetché dans le parent)
 *
 * Design :
 *   - Card brand (bordure lavande + ombre bleue via card.tsx)
 *   - Chaque ligne : titre tronqué + entreprise en muted + date relative à droite
 *   - Badge source coloré (LinkedIn = bleu, WTTJ = vert, Indeed = slate)
 *   - Lien cliquable vers le détail de l'offre
 *
 * Exemple :
 *   <RecentOffersWidget offers={recentOffers} />
 */

import Link from "next/link";
import type { Offer } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2 } from "lucide-react";

/** Couleurs par source pour les mini-badges */
const SOURCE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  linkedin: { color: "#0057BA", bg: "rgba(0,87,186,0.1)",   label: "LinkedIn" },
  wttj:     { color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "WTTJ"     },
  indeed:   { color: "#475569", bg: "rgba(71,85,105,0.1)",  label: "Indeed"   },
};

/**
 * Calcule une date relative en français sans dépendance externe
 * Exemples : "Aujourd'hui", "Hier", "Il y a 3 jours"
 */
function relativeDate(date: Date): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays}j`;
}

interface RecentOffersWidgetProps {
  offers: Offer[];
}

export function RecentOffersWidget({ offers }: RecentOffersWidgetProps) {
  return (
    <Card style={{ height: "100%" }}>
      <CardHeader style={{ paddingBottom: "0.5rem" }}>
        <CardTitle style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0A0F1E" }}>
          Offres récentes
        </CardTitle>
      </CardHeader>

      <CardContent>
        {offers.length === 0 ? (
          /* État vide */
          <p style={{ fontSize: "0.85rem", color: "#9CA3AF", textAlign: "center", padding: "1rem 0" }}>
            Aucune offre pour le moment.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {offers.map((offer, i) => {
              const src = SOURCE_COLORS[offer.source] ?? {
                color: "#6B7280", bg: "rgba(107,114,128,0.1)", label: offer.source,
              };

              return (
                <Link
                  key={offer.id}
                  href={`/offers/${offer.id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.65rem 0",
                      borderBottom: i < offers.length - 1
                        ? "1px solid rgba(191,171,204,0.25)"
                        : "none",
                      cursor: "pointer",
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.opacity = "0.7")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.opacity = "1")
                    }
                  >
                    {/* Info principale : titre + entreprise */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          color: "#0A0F1E",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "0.15rem",
                        }}
                      >
                        {offer.title}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.72rem",
                          color: "#9CA3AF",
                        }}
                      >
                        <Building2 size={11} style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 100,
                          }}
                        >
                          {offer.company}
                        </span>
                      </div>
                    </div>

                    {/* Droite : badge source + date */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "0.2rem",
                        flexShrink: 0,
                      }}
                    >
                      {/* Badge source coloré */}
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 500,
                          color: src.color,
                          backgroundColor: src.bg,
                          borderRadius: 4,
                          padding: "0.1rem 0.4rem",
                        }}
                      >
                        {src.label}
                      </span>
                      {/* Date relative */}
                      <span style={{ fontSize: "0.65rem", color: "#D1D5DB" }}>
                        {relativeDate(offer.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Lien "Voir toutes les offres" */}
        <Link
          href="/offers"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            marginTop: "0.85rem",
            fontSize: "0.78rem",
            fontWeight: 500,
            color: "#0057BA",
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")
          }
        >
          Voir toutes les offres
          <ArrowRight size={13} />
        </Link>
      </CardContent>
    </Card>
  );
}
