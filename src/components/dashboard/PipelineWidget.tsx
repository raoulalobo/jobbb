/**
 * Rôle : Widget "Pipeline de candidatures" du Dashboard Command Center
 * Affiche le funnel de candidatures sous forme de 6 étapes horizontales :
 *   Brouillon → Prêt → Envoyé → Entretien → Refusé → Accepté
 *
 * Chaque étape affiche :
 *   - Un point coloré + label
 *   - Le nombre de candidatures dans cet état
 *   - Une barre de progression proportionnelle au total
 *
 * Props :
 *   - draft / ready / sent / interview / rejected / accepted : compteurs par statut
 *   - total : total candidatures (pour calculer les proportions)
 *   - isLoading : affiche des barres skeleton si les compteurs ne sont pas encore chargés
 *
 * Exemple :
 *   <PipelineWidget draft={3} ready={1} sent={2} interview={0} rejected={0} accepted={0} total={6} isLoading={false} />
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Configuration visuelle de chaque étape du pipeline */
const STEPS = [
  { key: "draft",     label: "Brouillon", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  { key: "ready",     label: "Prêt",      color: "#0057BA", bg: "rgba(0,87,186,0.12)"    },
  { key: "sent",      label: "Envoyé",    color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
  { key: "interview", label: "Entretien", color: "#9C52F2", bg: "rgba(156,82,242,0.12)"  },
  { key: "rejected",  label: "Refusé",    color: "#EF4444", bg: "rgba(239,68,68,0.12)"   },
  { key: "accepted",  label: "Accepté",   color: "#10B981", bg: "rgba(16,185,129,0.12)"  },
] as const;

interface PipelineWidgetProps {
  draft:     number;
  ready:     number;
  sent:      number;
  interview: number;
  rejected:  number;
  accepted:  number;
  total:     number;
  isLoading: boolean;
}

export function PipelineWidget({
  draft, ready, sent, interview, rejected, accepted, total, isLoading,
}: PipelineWidgetProps) {
  /** Compte par clé pour simplifier l'accès dans la boucle */
  const counts: Record<string, number> = {
    draft, ready, sent, interview, rejected, accepted,
  };

  return (
    <Card>
      <CardHeader style={{ paddingBottom: "0.75rem" }}>
        <CardTitle
          style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0A0F1E" }}
        >
          Pipeline de candidatures
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Grille des 6 étapes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "0.5rem",
          }}
        >
          {STEPS.map((step, index) => {
            const count = counts[step.key] ?? 0;
            // Proportion de la barre : 0 si total = 0, sinon proportionnelle
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={step.key} style={{ position: "relative" }}>
                {/* Flèche séparatrice (sauf après le dernier) */}
                {index < STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: "-0.4rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(191,171,204,0.6)",
                      fontSize: "0.75rem",
                      zIndex: 1,
                      pointerEvents: "none",
                    }}
                  >
                    ›
                  </div>
                )}

                {/* Colonne d'une étape */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.65rem 0.4rem",
                    borderRadius: 10,
                    backgroundColor: count > 0 ? step.bg : "transparent",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {/* Point coloré de statut */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: count > 0 ? step.color : "rgba(191,171,204,0.4)",
                    }}
                  />

                  {/* Compteur ou skeleton */}
                  {isLoading ? (
                    <Skeleton style={{ width: 24, height: 22 }} />
                  ) : (
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: count > 0 ? step.color : "#D1D5DB",
                      }}
                    >
                      {count}
                    </span>
                  )}

                  {/* Label de l'étape */}
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 500,
                      color: count > 0 ? step.color : "#9CA3AF",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {step.label}
                  </span>

                  {/* Barre de progression proportionnelle */}
                  <div
                    style={{
                      width: "100%",
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: "rgba(191,171,204,0.2)",
                      overflow: "hidden",
                    }}
                  >
                    {isLoading ? (
                      <Skeleton style={{ width: "60%", height: "100%" }} />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 2,
                          backgroundColor: step.color,
                          transition: "width 0.5s ease",
                          minWidth: count > 0 ? "8%" : "0%",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message si aucune candidature */}
        {!isLoading && total === 0 && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            Aucune candidature générée pour l&apos;instant.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
