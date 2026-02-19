/**
 * Role : Template PDF "Moderne" pour react-pdf
 *
 * Design :
 *   - Zone identité minimaliste : nom en grand, fine ligne bleue, sous-titre
 *   - Corps en colonne unique avec titres colorés et sections bien délimitées
 *   - Puces personnalisées (>) pour les éléments de liste
 *   - paddingTop uniforme sur toutes les pages (page 1 ET pages de continuation)
 *
 * Police : Helvetica (intégrée react-pdf, pas de chargement réseau)
 *
 * Utilisé par : route API /api/application/[id]/export-pdf quand templateId === "modern"
 *
 * Exemple :
 *   <ModernTemplate data={{ content: "## ...", type: "cv", ... }} />
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { CvPdfData } from "../types";
import { parseMarkdown, type TextSegment } from "../markdown-parser";

// ─── Palette de couleurs ───────────────────────────────────────────────────────
const BLUE_MID   = "#2563eb";  // Ligne décorative, titres de section, puces
const BLUE_LIGHT = "#dbeafe";  // Bordures de section
const TEXT_DARK  = "#111827";  // Nom du candidat
const TEXT_BODY  = "#1f2937";  // Corps du texte
const TEXT_MUTED = "#6b7280";  // Sous-titres, métadonnées, footer

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Marges uniformes sur toutes les pages (page 1 ET pages 2+)
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 52, // Espace suffisant pour le footer fixe
    paddingHorizontal: 40,
  },

  // ── Zone identité (remplace le header bleu) ──────────────────────────────
  // Affichée uniquement en page 1 (positionnée dans le flux normal)
  identity: {
    marginBottom: 20,
  },
  // Nom du candidat en grand
  identityName: {
    fontSize: 26,
    color: TEXT_DARK,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  // Ligne décorative bleue sous le nom
  identityDivider: {
    height: 2,
    backgroundColor: BLUE_MID,
    marginBottom: 6,
  },
  // Type de document (ex : "CV Adapté")
  identitySubtitle: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  // Poste visé · Entreprise
  identityMeta: {
    fontSize: 9,
    color: TEXT_MUTED,
  },

  // ── Corps principal ───────────────────────────────────────────────────────
  body: {
    // Pas de paddingHorizontal : géré par la page
  },

  // Titre h2 : section principale (ex : "EXPÉRIENCES PROFESSIONNELLES")
  h2: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BLUE_MID,
    marginTop: 18,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: BLUE_LIGHT,
    paddingBottom: 3,
  },

  // Titre h3 : sous-section (ex : nom de l'entreprise, école)
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT_BODY,
    marginTop: 10,
    marginBottom: 3,
  },

  // Paragraphe normal
  paragraph: {
    fontSize: 10,
    color: TEXT_BODY,
    lineHeight: 1.55,
    marginBottom: 4,
  },

  // Ligne de liste avec puce ">"
  listRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  listBullet: {
    fontSize: 10,
    color: BLUE_MID,
    width: 14,
  },
  listText: {
    fontSize: 10,
    color: TEXT_BODY,
    lineHeight: 1.55,
    flex: 1,
  },

  // Texte en gras inline
  bold: {
    fontFamily: "Helvetica-Bold",
  },

  // ── Pied de page ─────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BLUE_LIGHT,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 8,
    color: TEXT_MUTED,
  },
});

// ─── Sous-composant : rendu d'un tableau de segments (texte + bold) ───────────

function RenderSegments({
  segments,
  style,
}: {
  segments: TextSegment[];
  style?: Style | Style[];
}) {
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.bold ? (
          <Text key={i} style={styles.bold}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface ModernTemplateProps {
  /** Données du document passées depuis la route API */
  data: CvPdfData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const blocks = parseMarkdown(data.content);

  // Libellé du type de document affiché sous le nom
  const docLabel = data.type === "cv" ? "CV Adapté" : "Lettre de Motivation";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Zone identité : nom + ligne bleue + sous-titre ───────────── */}
        {/* Non fixed → apparaît seulement en page 1 */}
        <View style={styles.identity}>
          <Text style={styles.identityName}>{data.candidateName}</Text>
          {/* Ligne décorative bleue */}
          <View style={styles.identityDivider} />
          <Text style={styles.identitySubtitle}>{docLabel}</Text>
          <Text style={styles.identityMeta}>
            {data.offerTitle} · {data.offerCompany}
          </Text>
        </View>

        {/* ── Corps du document ────────────────────────────────────────── */}
        <View style={styles.body}>
          {blocks.map((block, index) => {
            switch (block.type) {
              case "h2":
                return (
                  <RenderSegments
                    key={index}
                    segments={block.segments}
                    style={styles.h2}
                  />
                );
              case "h3":
                return (
                  <RenderSegments
                    key={index}
                    segments={block.segments}
                    style={styles.h3}
                  />
                );
              case "list-item":
                return (
                  <View key={index} style={styles.listRow}>
                    {/* ">" : caractère ASCII pur, compatible charset WinAnsi d'Helvetica */}
                    <Text style={styles.listBullet}>{">"}</Text>
                    <RenderSegments
                      segments={block.segments}
                      style={styles.listText}
                    />
                  </View>
                );
              case "paragraph":
              default:
                return (
                  <RenderSegments
                    key={index}
                    segments={block.segments}
                    style={styles.paragraph}
                  />
                );
            }
          })}
        </View>

        {/* ── Pied de page : nom candidat + numéro de page ─────────────── */}
        {/* fixed → répété sur toutes les pages */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.candidateName}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
